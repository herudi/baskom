import * as http from 'http';
import * as pathnode from 'path';
import Router from './router';
import { parse as parsequery } from 'querystring';
import { generalError, toPathx, findBase, getParamNames, wrap, parseurl, finalHandler, getError, wrapError, defaultRenderEngine, findArgs } from './utils';
import response from './response';
import { IApp, Request, Response, Runner } from './types';

export default class Application extends Router {
    private error: (err: any, req: Request, res: Response, run: Runner) => any;
    private notFound: any;
    private parsequery: any;
    private parseurl: any;
    private debugError: any;
    private bodyLimit: any;
    private isUse: any;
    private midds: any;
    private pmidds: any;
    private engine: any;
    private defaultBody: any;
    constructor({ useParseQueryString, useParseUrl, useDebugError, useBodyLimit, useDefaultBody }: IApp = {}) {
        super();
        this.debugError = useDebugError || false;
        this.bodyLimit = useBodyLimit || '1mb';
        this.defaultBody = useDefaultBody || true;
        this.parseurl = useParseUrl || parseurl;
        this.parsequery = useParseQueryString || parsequery;
        this.error = generalError(useDebugError);
        this.notFound = this.error.bind(null, { code: 404, name: 'NotFoundError', message: 'Not Found Error' });
        this.isUse = undefined;
        this.midds = [];
        this.pmidds = {};
        this.engine = {};
    }

    wrapFn(fn: any) {
        return wrap(fn);
    }

    getError(err: any, req: Request, res: Response) {
        let data = getError(err, this.debugError, req);
        res.code(data.statusCode);
        return data;
    }

    on(method: string, path: string, ...args: any[]) {
        if (args.length > 1 && this.isUse === undefined) this.isUse = 1;
        return super.on(method, path, ...args);
    }

    use(...args: any) {
        if (this.isUse === void 0) this.isUse = 1;
        let arg = args[0], larg = args[args.length - 1], prefix = null;
        if (typeof arg === 'object' && (arg.engine || arg.render)) {
            let obj: any = {},
                defaultDir = pathnode.join(pathnode.dirname(require.main.filename || process.mainModule.filename), 'views');
            obj.engine = (typeof arg.engine === 'string' ? require(arg.engine) : arg.engine);
            obj.name = arg.name || (typeof arg.engine === 'string' ? arg.engine : 'html');
            obj.ext = arg.ext || ('.' + obj.name);
            obj.basedir = arg.basedir || defaultDir;
            obj.options = arg.options;
            obj.set = arg.set;
            obj.header = arg.header || {
                'Content-Type': 'text/html; charset=utf-8'
            };
            obj.render = arg.render || defaultRenderEngine({
                engine: obj.engine,
                name: obj.name,
                options: obj.options,
                header: obj.header,
                settings: {
                    views: obj.basedir,
                    ...(arg.set ? arg.set : {})
                }
            });
            this.engine[obj.ext] = obj;
        } else if (typeof arg === 'function' && (getParamNames(arg)[0] === 'err' || getParamNames(arg)[0] === 'error' || getParamNames(arg).length === 4)) {
            this.error = wrapError(larg);
        } else if (arg === '*') {
            this.notFound = wrap(larg);
        } else if (typeof larg === 'object' && larg.routes) {
            let prefix_obj = '';
            if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') {
                prefix_obj = arg;
            }
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
        let url = this.parseurl(req), route = this.getRoute(req.method, url.pathname, this.notFound);
        response(res, this.engine);
        req.originalUrl = req.originalUrl || req.url;
        req.query = this.parsequery(url.query);
        req.search = url.search;
        req.params = route.params;
        if (this.isUse === void 0 && req.method === 'GET') route.handlers[0](req, res, (err?: any) => this.error(err, req, res, (val?: any) => { }));
        else finalHandler(req, res, this.bodyLimit, this.parsequery, this.debugError, this.defaultBody, req.method, (function () {
            let midds = this.midds, prefix = findBase(req.path = url.pathname);
            if (this.pmidds[prefix] !== void 0) {
                midds = midds.concat(this.pmidds[prefix]);
            }
            midds = midds.concat(route.handlers);
            let mlen = midds.length, j = 0;
            let run = (err?: any) => err ? this.error(err, req, res, run) : execute();
            let execute = () => (j < mlen) && midds[j++](req, res, run);
            execute();
        }).bind(this));
    }

    server() {
        return (req: Request, res: Response) => this.requestListener(req, res);
    }

    listen(port: number = 3000, ...args: any) {
        let server = http.createServer(this.server());
        server.listen(port, ...args);
        return this;
    }
}