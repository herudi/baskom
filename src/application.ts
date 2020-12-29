import * as http from 'http';
import * as pathnode from 'path';
import * as cluster from 'cluster';
import * as os from 'os';
import Router from './router';
import { parse as parsequery } from 'querystring';
import { generalError, toPathx, findBase, getParamNames, wrap, parseurl, finalHandler, getError, wrapError, defaultRenderEngine, findArgs } from './utils';
import response from './response';
import { IApp, Request, Response, Runner } from './types';

let preMethod = 'GET,POST';

export default class Application extends Router {
    private error: (err: any, req: Request, res: Response, run: Runner) => any;
    private notFound: any;
    private parsequery: any;
    private parseurl: any;
    private debugError: any;
    private bodyLimit: any;
    private midds: any;
    private pmidds: any;
    private engine: any;
    private workers: any;
    private defaultBody: any;
    private cluster: any;
    private mroute: any;
    constructor({ useCluster, useParseQueryString, useParseUrl, useDebugError, useBodyLimit, useDefaultBody }: IApp = {}) {
        super();
        this.debugError = useDebugError || false;
        this.bodyLimit = useBodyLimit || '1mb';
        this.defaultBody = useDefaultBody || true;
        this.parseurl = useParseUrl || parseurl;
        this.parsequery = useParseQueryString || parsequery;
        this.error = generalError(useDebugError);
        this.notFound = this.error.bind(null, { code: 404, name: 'NotFoundError', message: 'Not Found Error' });
        this.midds = [];
        this.pmidds = {};
        this.engine = {};
        this.mroute = {};
        this.workers = [];
        this.cluster = useCluster;
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
        } else if (typeof arg === 'function' && (getParamNames(arg)[0] === 'err' || getParamNames(arg)[0] === 'error' || getParamNames(arg).length === 4)) {
            this.error = wrapError(larg);
        } else if (arg === '*') {
            this.notFound = wrap(larg);
        } else if (typeof larg === 'object' && larg.routes) {
            let prefix_obj = '';
            if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') prefix_obj = arg;
            let fns = findArgs(args, true);
            for (let i = 0; i < args.length; i++) {
                let el = args[i];
                if (typeof el === 'object') {
                    if (el.routes) {
                        let routes = el.routes;
                        for (let j = 0; j < routes.length; j++) {
                            routes[j].path = prefix_obj + routes[j].path;
                            routes[j].pathx = toPathx(routes[j].path).pathx;
                            routes[j].handlers = fns.concat(routes[j].handlers);
                        }
                        this.routes = this.routes.concat(routes);
                    }
                }
            }
        } else if (Array.isArray(larg)) {
            let fns = findArgs(args, true), prefix_obj = '';
            if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') {
                prefix_obj = arg;
            }
            let pushFromArray = (_args: string | any[], _prefix_obj: string) => {
                for (let i = 0; i < _args.length; i++) {
                    let el = _args[i];
                    if (typeof el === 'object') {
                        if (el.routes) {
                            let routes = el.routes;
                            for (let j = 0; j < routes.length; j++) {
                                routes[j].path = _prefix_obj + routes[j].path;
                                routes[j].pathx = toPathx(routes[j].path).pathx;
                                routes[j].handlers = fns.concat(routes[j].handlers);
                            }
                            this.routes = this.routes.concat(routes);
                        }
                    } else if (typeof el === 'function') {
                        this.midds.push(wrap(el));
                    }
                }
            }
            for (let i = 0; i < args.length; i++) {
                let el = args[i];
                if (Array.isArray(el)) {
                    pushFromArray(el, prefix_obj);
                }
            }
        } else {
            if (typeof arg === 'function') {
                this.midds = this.midds.concat(findArgs(args));
            } else if (arg === '/' || arg === '') {
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
                        fixs.push((req: Request, res: Response, run: Runner) => {
                            req.url = req.url.substring(prefix.length) || '/';
                            req.path = req.path ? req.path.substring(prefix.length) || '/' : '/';
                            run();
                        });
                        this.pmidds[prefix] = fixs.concat(el);
                    }
                }
            }
        }
        return this;
    }

    private requestListener(req: Request, res: Response) {
        let url = this.parseurl(req);
        let cnt = 0; for (let k in this.mroute) cnt++;
        if (cnt > 128) this.mroute = {};
        let key = req.method + url.pathname,
            route = this.mroute[key],
            prefix = findBase(req.path = url.pathname);
        if (route === void 0) {
            route = this.getRoute(req.method, url.pathname, this.notFound);
            if (preMethod.indexOf(req.method) !== -1) this.mroute[key] = route;
        }
        response(res, this.engine);
        req.originalUrl = req.originalUrl || req.url;
        req.query = this.parsequery(url.query);
        req.search = url.search;
        req.params = route.params;
        if (route.m === void 0) {
            if (this.pmidds[prefix] !== void 0) route.handlers = this.pmidds[prefix].concat(route.handlers);
            route.handlers = this.midds.concat(route.handlers);
            route.m = true;
            route.len = route.handlers.length;
            if (preMethod.indexOf(req.method) !== -1) this.mroute[key] = route;
        };
        let mlen = route.len || route.handlers.length, i = 0;
        let cb: Function = () => void (
            (i < mlen) && route.handlers[i++](req, res, (err?: any) => err ? this.error(err, req, res, (_err?: any) => res.code(_err.code || 500).send(_err.stack || 'Something went wrong')) : cb())
        );
        finalHandler(req, res, this.bodyLimit, this.parsequery, this.debugError, this.defaultBody, req.method, cb);
    }

    server() {
        return (req: any, res: any) => this.requestListener(req, res);
    }

    listen(port: number = 3000, ...args: any) {
        let cls: any = undefined;
        if (typeof this.cluster === 'boolean' && this.cluster === true) cls = { numCPUs: os.cpus().length };
        else if (typeof this.cluster === 'object') cls = this.cluster;
        if (cls !== void 0 && cluster.isMaster) {
            for (let i = 0; i < cls.numCPUs; i++) this.workers.push(cluster.fork());
            cluster.on('exit', () => {
                cluster.fork();
                this.workers.push(cluster.fork());
            });
        } else {
            http.createServer((req: Request, res: Response) => {
                this.requestListener(req, res);
            }).listen(port, ...args);
        }
    }
}