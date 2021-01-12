import * as http from 'http';
import * as pathnode from 'path';
import * as cluster from 'cluster';
import * as os from 'os';
import Router from './router';
import { parse as parsequery } from 'querystring';
import { generalError, getParamNames, wrap, parseurl, finalHandler, getError, wrapError, defaultRenderEngine, findArgs, toPathx, findBase } from './utils';
import response from './response';
import request from './request';
import { THandler, IApp, Request, Response, NextFunction, TEHandler } from './types';
import { METHODS } from './constant';

const PRE_METHOD = 'GET,POST';

interface Application extends Router {
    use(prefix: string, routers: Router[]): this;
    use(prefix: string, router: Router): this;
    use(router: Router): this;
    use(router: Router[]): this;
    use(middleware: THandler, routers: Router[]): this;
    use(middleware: THandler, router: Router): this;
    use(middleware: THandler | TEHandler): this;
    use(...middlewares: Array<THandler | THandler[]> | Array<TEHandler | TEHandler[]>): this;
    use(prefix: string, middleware: THandler, routers: Router[]): this;
    use(prefix: string, middleware: THandler, router: Router): this;
    use(prefix: string, middleware: THandler): this;
    use(prefix: string, ...middlewares: Array<THandler | THandler[]>): this;
    use(...args: any): this;
    listen(port: number, hostname?: string, callback?: (req: Request, res: Response) => void): void;
    listen(port: number, callback: (req: Request, res: Response) => void): void;
    listen(port: number, ...args: any): void;
    handler(req: Request, res: Response): void;
    handler(req: any, res: any): void;
    withCluster(config: { numCPUs: number }, callback: () => void): void;
    withCluster(callback: () => void): void;
    withCluster(...args: any): void;
}

function wrapHandlers(handlers: Array<THandler | THandler[]>) {
    let ret: Array<THandler | THandler[]> = [], j = 0, i = 0;
    for (; i < handlers.length; i++) {
        let arg = handlers[i];
        if (Array.isArray(arg)) {
            for (; j < arg.length; j++) ret.push(wrap(arg[j]));
        } else ret.push(wrap(arg));
    }
    return ret;
}

function patchRoutes(arg: string, args: any[], routes: any[]) {
    let prefix = '', handlers = findArgs(args, true), i = 0, len = routes.length, ret = {};
    if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') prefix = arg;
    for (; i < len; i++) {
        let el = routes[i];
        let { params, pathx } = toPathx(prefix + el.path);
        el.handlers = wrapHandlers(el.handlers);
        el.handlers = handlers.concat(el.handlers);
        if (ret[el.method] === void 0) ret[el.method] = [];
        ret[el.method].push({ params, pathx, handlers: el.handlers });
    }
    return ret;
}

function bindRoutes(routes: any, c_routes: any) {
    METHODS.forEach(el => {
        if (c_routes[el] !== void 0) {
            if (routes[el] === void 0) routes[el] = [];
            routes[el] = routes[el].concat(c_routes[el]);
        };
    });
    return routes;
}

class Application extends Router {
    private error: (err: any, req: Request, res: Response, next: NextFunction) => any;
    private notFound: any;
    private parsequery: any;
    private debugError: any;
    private bodyLimit: any;
    private midds: any;
    private pmidds: any;
    private engine: any;
    private workers: any;
    private defaultBody: any;
    private mroute: any;
    private server: any;
    constructor({ useServer, useParseQueryString, useDebugError, useBodyLimit, useDefaultBody }: IApp = {}) {
        super();
        this.debugError = useDebugError || false;
        this.bodyLimit = useBodyLimit || '1mb';
        this.defaultBody = useDefaultBody || true;
        this.parsequery = useParseQueryString || parsequery;
        this.error = generalError(useDebugError);
        this.notFound = undefined;
        this.midds = [];
        this.pmidds = {};
        this.engine = {};
        this.mroute = {};
        this.workers = [];
        this.server = useServer;
    }

    call(method: string, path: string, ...handlers: Array<THandler | THandler[]>) {
        let fns = wrapHandlers(handlers);
        let { params, pathx } = toPathx(path);
        if (this.routes[method] === void 0) this.routes[method] = [];
        this.routes[method].push({ params, pathx, handlers: fns });
        return this;
    }

    wrapFn(fn: Function) {
        return wrap(fn);
    }

    getError(err: any, req: Request, res: Response) {
        let data = getError(err, this.debugError, req);
        res.code(data.statusCode);
        return data;
    }

    use(...args: any) {
        let arg = args[0], larg = args[args.length - 1], prefix = null;
        if (typeof arg === 'object' && arg.engine) {
            let defaultDir = pathnode.join(pathnode.dirname(require.main.filename || process.mainModule.filename), 'views'),
                _ext = arg.ext,
                _basedir = pathnode.resolve(arg.basedir || defaultDir),
                _render = arg.render;
            if (_render === void 0) {
                let _engine = (typeof arg.engine === 'string' ? require(arg.engine) : arg.engine);
                if (typeof _engine === 'object' && _engine.renderFile !== void 0) _engine = _engine.renderFile;
                let _name = arg.name || (typeof arg.engine === 'string' ? arg.engine : 'html');
                _ext = _ext || ('.' + _name);
                if (_name === 'nunjucks') _engine.configure(_basedir, { autoescape: arg.autoescape || true });
                _render = defaultRenderEngine({
                    engine: _engine,
                    name: _name,
                    options: arg.options,
                    header: arg.header || {
                        'Content-Type': 'text/html; charset=utf-8'
                    },
                    settings: {
                        views: _basedir,
                        ...(arg.set ? arg.set : {})
                    }
                })
            }
            this.engine[_ext] = {
                ext: _ext,
                basedir: _basedir,
                render: _render
            };
        }
        else if (typeof arg === 'function' && (getParamNames(arg)[0] === 'err' || getParamNames(arg)[0] === 'error' || getParamNames(arg).length === 4)) this.error = wrapError(larg);
        else if (arg === '*') this.notFound = wrap(larg);
        else if (typeof larg === 'object' && larg.c_routes) bindRoutes(this.routes, patchRoutes(arg, args, larg.c_routes));
        else if (Array.isArray(larg)) {
            let el: any, i = 0, len = larg.length;
            for (; i < len; i++) {
                el = larg[i];
                if (typeof el === 'object' && el.c_routes) bindRoutes(this.routes, patchRoutes(arg, args, el.c_routes));
                else if (typeof el === 'function') this.midds.push(wrap(el));
            };
        } else {
            if (typeof arg === 'function') this.midds = this.midds.concat(findArgs(args));
            else if (arg === '/' || arg === '') {
                args.shift();
                this.midds = this.midds.concat(findArgs(args));
            } else {
                if (typeof arg === 'string' && arg.charAt(0) === '/') {
                    prefix = arg === '/' ? '' : arg;
                    args.shift();
                }
                for (let i = 0; i < args.length; i++) {
                    let el = args[i], fixs = this.pmidds[prefix] || [];
                    if (prefix) {
                        fixs.push((req: Request, res: Response, next: NextFunction) => {
                            req.url = req.url.substring(prefix.length) || '/';
                            req.path = req.path ? req.path.substring(prefix.length) || '/' : '/';
                            next();
                        });
                        this.pmidds[prefix] = fixs.concat(el);
                    }
                }
            }
        }
        return this;
    }

    handler(req: Request, res: Response) {
        let cnt = 0; for (let k in this.mroute) cnt++;
        if (cnt > 32) this.mroute = {};
        let url = parseurl(req),
            key = req.method + url.pathname,
            obj = this.mroute[key], idx = 0,
            next: (err?: any) => void = (err?: any) => {
                if (err) return this.error(err, req, res, next);
                obj.handlers[idx++](req, res, next);
            };
        if (obj === void 0) {
            obj = this.getRoute(req.method, url.pathname, this.notFound);
            if (PRE_METHOD.indexOf(req.method) !== -1 && obj.nf !== void 0) this.mroute[key] = obj;
        }
        response(res, this.engine);
        request(req, url, obj.params, this.parsequery);
        if (obj.m === void 0) {
            let prefix = findBase(url.pathname), midds = this.midds;
            if (this.pmidds[prefix] !== void 0) obj.handlers = this.pmidds[prefix].concat(obj.handlers);
            obj.handlers = midds.concat(obj.handlers);
            obj.m = true;
            if (PRE_METHOD.indexOf(req.method) !== -1 && obj.nf !== void 0) this.mroute[key] = obj;
        };
        finalHandler(req, res, this.bodyLimit, this.parsequery, this.debugError, this.defaultBody, req.method, next);
    }

    withCluster(...args: any) {
        let opts: any = { numCPUs: os.cpus().length }, cb = args[0];
        if (args[0] === 'object') {
            opts = args[0];
            cb = args[1];
        }
        if (cluster.isMaster) {
            for (let i = 0; i < opts.numCPUs; i++) this.workers.push(cluster.fork());
            cluster.on('exit', () => {
                cluster.fork();
                this.workers.push(cluster.fork());
            });
        } else cb();
    }

    listen(port: number = 3000, ...args: any) {
        const server = this.server || http.createServer();
        server.on('request', (req: Request, res: Response) => {
            this.handler(req, res);
        });
        server.listen(port, ...args);
    }
}

export default Application;