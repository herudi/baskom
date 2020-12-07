import * as http from 'http';
import * as pathnode from 'path';
import Router from './router';
import { parse as parsequery } from 'querystring';
import { generalError, toPathx, findBase, getParamNames, wrap, parseurl, finalHandler, getError, wrapError } from './utils';
import response from './response';
import { IApp, Request, Response, Runner } from './types';
import { TYPE } from './constant';

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
    private defaultBody: any;
    constructor({ useParseQueryString, useParseUrl, useDebugError, useBodyLimit, useDefaultBody }: IApp = {}) {
        super();
        this.requestHandler = this.requestHandler.bind(this);
        this.debugError = useDebugError || false;
        this.bodyLimit = useBodyLimit || '1mb';
        this.defaultBody = useDefaultBody || true;
        this.error = generalError(useDebugError);
        this.notFound = this.error.bind(null, { code: 404, name: 'NotFoundError', message: 'Not Found Error' });
        this.parsequery = useParseQueryString || parsequery;
        this.parseurl = useParseUrl || parseurl;
        this.isUse = undefined;
        this.midds = [];
        this.pmidds = {};
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
        let arg = args[0];
        let larg = args[args.length - 1];
        let prefix = null;
        if (typeof arg === 'object' && arg.engine) {
            let _render = (res: Response, filename: any, ...args: any) => {
                arg.engine.renderFile(filename, ...args, (err: any, html: any) => {
                    if (err) throw new Error(err.message || 'Error View Something Went Wrong');
                    res.setHeader(TYPE, res.getHeader(TYPE) || 'text/html');
                    res.end(html);
                });
            }
            let obj = {
                engine: arg.engine,
                ext: arg.ext,
                basedir: arg.basedir || 'views',
                render: arg.render || _render
            }
            this.midds.push((req: Request, res: Response, run: Runner) => {
                res.render = function (pathfile: string, ...args: any) {
                    pathfile = pathnode.extname(pathfile) !== '' ? pathfile : pathfile + obj.ext;
                    if (obj.basedir !== '' || obj.basedir !== null) {
                        pathfile = obj.basedir + '/' + pathfile;
                    }
                    return obj.render(res, pathfile, ...args);
                };
                run();
            });
        } else if (typeof arg === 'function' && (getParamNames(arg)[0] === 'err' || getParamNames(arg)[0] === 'error' || getParamNames(arg).length === 4)) {
            this.error = wrapError(larg);
        } else if (arg === '*') {
            this.notFound = wrap(larg);
        } else if (typeof larg === 'object' && larg.routes) {
            let prefix_obj = '';
            if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') {
                prefix_obj = arg;
            }
            for (let i = 0; i < args.length; i++) {
                let el = args[i];
                if (typeof el === 'object') {
                    if (el.routes) {
                        let routes = el.routes;
                        for (let j = 0; j < routes.length; j++) {
                            routes[j].path = prefix_obj + routes[j].path;
                            routes[j].pathx = toPathx(routes[j].path).pathx;
                        }
                        this.routes = this.routes.concat(routes);
                    }
                } else if (typeof el === 'function') {
                    this.midds.push(wrap(el));
                }
            }
        } else if (Array.isArray(larg)) {
            let pushFromArray = (_args: string | any[], _prefix_obj: string) => {
                for (let i = 0; i < _args.length; i++) {
                    let el = _args[i];
                    if (typeof el === 'object') {
                        if (el.routes) {
                            let routes = el.routes;
                            for (let j = 0; j < routes.length; j++) {
                                routes[j].path = _prefix_obj + routes[j].path;
                                routes[j].pathx = toPathx(routes[j].path).pathx;
                            }
                            this.routes = this.routes.concat(routes);
                        }
                    } else if (typeof el === 'function') {
                        this.midds.push(wrap(el));
                    }
                }
            }
            let prefix_obj = '';
            if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') {
                prefix_obj = arg;
            }
            for (let i = 0; i < args.length; i++) {
                let el = args[i];
                if (Array.isArray(el)) {
                    pushFromArray(el, prefix_obj);
                } else if (typeof el === 'function') {
                    this.midds.push(wrap(el));
                }
            }
        } else {
            if (typeof arg === 'function') {
                for (let i = 0; i < args.length; i++) {
                    let el = args[i];
                    this.midds.push(wrap(el));
                }
            } else if (arg === '/' || arg === '') {
                args.shift();
                for (let i = 0; i < args.length; i++) {
                    let el = args[i];
                    this.midds.push(wrap(el));
                }
            } else {
                if (typeof arg === 'string' && arg.charAt(0) === '/') {
                    prefix = arg === '/' ? '' : arg;
                    args.shift();
                }
                for (let i = 0; i < args.length; i++) {
                    let el = args[i];
                    let fixs = this.pmidds[prefix] || [];
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

    private requestHandler(req: Request, res: Response) {
        let url = this.parseurl(req),
            path = url.pathname,
            method = req.method,
            isUse = this.isUse,
            onError = this.error,
            isUseGet = (!isUse && method === 'GET'),
            route = this.getRoute(method, path, this.notFound);
        response(res);
        req.originalUrl = req.originalUrl || req.url;
        req.query = this.parsequery(url.query);
        req.search = url.search;
        req.params = route.params;
        if (isUseGet) {
            route.handlers[0](req, res, (err?: any) => onError(err, req, res, (val?: any) => { }));
            return;
        };
        let midds = this.midds,
            pmidds = this.pmidds;
        finalHandler(req, res, this.bodyLimit, this.parsequery, this.debugError, this.defaultBody, method, () => {
            if (!isUse) {
                route.handlers[0](req, res, (err?: any) => onError(err, req, res, (val?: any) => { }));
                return;
            }
            let prefix = findBase(req.path = path);
            if (pmidds[prefix]) {
                midds = midds.concat(pmidds[prefix]);
            }
            midds = midds.concat(route.handlers);
            let mlen = midds.length, j = 0;
            let run = (err?: any) => err ? onError(err, req, res, run) : execute();
            let execute = () => (j < mlen) && midds[j++](req, res, run);
            execute();
        });
    }

    server() {
        return (req: Request, res: Response) => this.requestHandler(req, res);
    }

    listen(...args: any) {
        let server = http.createServer(this.requestHandler);
        return server.listen(...args);
    }
}