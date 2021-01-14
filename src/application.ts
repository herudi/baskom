import * as http from 'http';
import * as cluster from 'cluster';
import * as os from 'os';
import Router from './router';
import { parse as parsequery } from 'querystring';
import { generalError, getParamNames, parseurl, withPromise, finalHandler, getError, wrapError, toPathx, findBase, getEngine } from './utils';
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
    lookup(req: Request, res: Response): void;
    lookup(req: any, res: any): void;
    withCluster(config: { numCPUs: number }, callback: () => void): void;
    withCluster(callback: () => void): void;
    withCluster(...args: any): void;
}
function wrapHandlers(fns: Array<THandler | THandler[]>) {
    let ret: Array<THandler | THandler[]> = [], len = fns.length, i = 0, fn: string | any[] | THandler;
    for (; i < len; i++) {
        fn = fns[i];
        if (Array.isArray(fn)) ret.push(...fn);
        else ret.push(fn);
    }
    return ret;
}
function patchRoutes(arg: string, args: any[], routes: any[]) {
    let prefix = '', midds = findFns(args), i = 0, j = 0, alen = args.length, len = routes.length, ret = {};
    if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') prefix = arg;
    for (; i < len; i++) {
        let el = routes[i];
        let { params, pathx } = toPathx(prefix + el.path);
        el.handlers = wrapHandlers(el.handlers);
        el.handlers = midds.concat(el.handlers);
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
function findFns(arr: any[]) {
    let ret = [], i = 0, len = arr.length;
    for (; i < len; i++) {
        if (typeof arr[i] === 'function') ret.push(arr[i]);
    }
    return ret;
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
        this.lookup = this.lookup.bind(this);
        this.notFound = (req: Request, res: Response, next: NextFunction) => {
            return res.code(404).json({
                statusCode: 404,
                name: 'NotFoundError',
                message: `Route ${req.method}${req.url} not found`
            })
        };
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

    getError(err: any, req: Request, res: Response) {
        let data = getError(err, this.debugError, req);
        res.code(data.statusCode);
        return data;
    }

    use(...args: any) {
        let arg = args[0], larg = args[args.length - 1], len = args.length;
        if (len === 1 && typeof arg === 'function') {
            let params = getParamNames(arg), fname = params[0];
            if (fname === 'err' || fname === 'error' || params.length === 4) this.error = wrapError(arg);
            else this.midds.push(arg);
        }
        else if (typeof arg === 'string' && typeof larg === 'function') {
            if (arg === '*') this.notFound = larg;
            else {
                let prefix = arg === '/' ? '' : arg, fns = [];
                fns.push((req: Request, res: Response, next: NextFunction) => {
                    req.url = req.url.substring(prefix.length) || '/';
                    req.path = req.path ? req.path.substring(prefix.length) || '/' : '/';
                    next();
                });
                for (let i = 0; i < args.length; i++) {
                    let el = args[i];
                    if (typeof el === 'function') fns.push(el);
                }
                this.pmidds[prefix] = fns;
            }
        }
        else if (typeof larg === 'object' && larg.c_routes) bindRoutes(this.routes, patchRoutes(arg, args, larg.c_routes));
        else if (typeof larg === 'object' && larg.engine) {
            let obj = getEngine(arg);
            this.engine[obj.ext] = obj;
        }
        else if (Array.isArray(larg)) {
            let el: any, i = 0, len = larg.length;
            for (; i < len; i++) {
                el = larg[i];
                if (typeof el === 'object' && el.c_routes) bindRoutes(this.routes, patchRoutes(arg, args, el.c_routes));
                else if (typeof el === 'function') this.midds.push(el);
            };
        }
        else this.midds = this.midds.concat(findFns(args));
        return this;
    }

    requestListener(req: Request, res: Response) {
        let cnt = 0; for (let k in this.mroute) cnt++;
        if (cnt > 32) this.mroute = {};
        let url = parseurl(req),
            key = req.method + url.pathname,
            obj = this.mroute[key], idx = 0,
            next: (err?: any) => void = (err?: any) => {
                if (err) return this.error(err, req, res, next);
                try {
                    let ret = obj.handlers[idx++](req, res, next);
                    if (ret) {
                        if (typeof ret === 'string') res.send(ret);
                        else if (typeof ret.then === 'function') return withPromise(ret, res, next);
                        else res.json(ret);
                    }
                } catch (error) {
                    next(error);
                }
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

    lookup(req: Request, res: Response) {
        this.requestListener(req, res);
    }

    listen(port: number = 3000, ...args: any) {
        const server = this.server || http.createServer();
        server.on('request', (req: Request, res: Response) => {
            this.requestListener(req, res);
        });
        server.listen(port, ...args);
    }
}

export default Application;