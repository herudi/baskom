import * as http from 'http';
import * as cluster from 'cluster';
import * as os from 'os';
import Router from './router';
import { parse as parsequery } from 'querystring';
import { generalError, getParamNames, parseurl, sendPromise, finalHandler, getError, wrapError, toPathx, getEngine, modPath } from './utils';
import response from './response';
import request from './request';
import { THandler, IApp, Request, Response, NextFunction, TEHandler } from './types';

interface Application extends Router {
    use(prefix: string, routers: Router[]): this;
    use(prefix: string, router: Router): this;
    use(router: Router): this;
    use(router: Router[]): this;
    use(middleware: THandler, routers: Router[]): this;
    use(middleware: THandler, router: Router): this;
    use(middleware: THandler | TEHandler): this;
    use(...middlewares: Array<THandler | THandler[]>): this;
    use(prefix: string, middleware: THandler, routers: Router[]): this;
    use(prefix: string, middleware: THandler, router: Router): this;
    use(prefix: string, middleware: THandler): this;
    use(prefix: string, ...middlewares: Array<THandler | THandler[]>): this;
    use(...args: any): this;
    listen(port: number, hostname?: string, callback?: (err?: Error) => void): void;
    listen(port: number, callback: (err?: Error) => void): void;
    listen(port: number, ...args: any): void;
    lookup(req: Request, res: Response): void;
    lookup(req: any, res: any): void;
    withCluster(config: { numCPUs: number }, callback: () => void): void;
    withCluster(callback: () => void): void;
    withCluster(...args: any): void;
}
function findFns(arr: any[]) {
    let ret = [], i = 0, len = arr.length;
    for (; i < len; i++) {
        if (Array.isArray(arr[i])) ret = ret.concat(findFns(arr[i]));
        else if (typeof arr[i] === 'function') ret.push(arr[i]);
    }
    return ret;
}
function addRoutes(arg: string, args: any[], routes: any[]) {
    let prefix = '', midds = findFns(args), i = 0, len = routes.length;
    if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') prefix = arg;
    for (; i < len; i++) {
        let el = routes[i];
        el.handlers = midds.concat(el.handlers);
        this.call(el.method, prefix + el.path, ...el.handlers);
    }
}
function preNext(cb: (req: Request, res: Response, next: NextFunction) => void, req: Request, res: Response, next: NextFunction): any {
    if (res.finished === true || res.writableEnded === true) return;
    return cb(req, res, next);
}
class Application extends Router {
    private error: (err: any, req: Request, res: Response, next: NextFunction) => any;
    private notFound: (req: Request, res: Response, next: NextFunction) => void;
    private parsequery: any;
    private debugError: boolean;
    private bodyLimit: string | number;
    private engine: any;
    private workers: any;
    private defaultBody: boolean;
    private server: any;
    private serverTimeout: number;
    constructor({ useServer, useServerTimeout, useParseQueryString, useDebugError, useBodyLimit, useDefaultBody }: IApp = {}) {
        super();
        this.debugError = useDebugError === undefined ? false : !!useDebugError;
        this.serverTimeout = useServerTimeout || 0;
        this.bodyLimit = useBodyLimit || '1mb';
        this.defaultBody = useDefaultBody === undefined ? true : !!useDefaultBody;
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

        this.engine = {};
        this.workers = [];
        this.server = useServer;
    }

    call(method: string, path: string, ...handlers: Array<THandler | THandler[]>) {
        let fns = handlers.length === 1 ? handlers : findFns(handlers);
        let obj = toPathx(path, method === 'ALL');
        if (obj !== void 0) {
            if (obj.key) {
                this.routes[method + obj.key] = { params: obj.params, handlers: fns };
            } else {
                if (this.routes[method] === void 0) this.routes[method] = [];
                this.routes[method].push({ ...obj, handlers: fns });
            }
        } else this.routes[method + path] = { handlers: fns };;
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
                if (arg === '/' || arg === '') this.midds = this.midds.concat(findFns(args));
                else this.pmidds[arg] = [modPath(arg)].concat(findFns(args));
            }
        }
        else if (typeof larg === 'object' && larg.c_routes) addRoutes.call(this, arg, args, larg.c_routes);
        else if (typeof larg === 'object' && larg.engine) {
            let obj = getEngine(arg);
            this.engine[obj.ext] = obj;
        }
        else if (Array.isArray(larg)) {
            let el: any, i = 0, len = larg.length;
            for (; i < len; i++) {
                el = larg[i];
                if (typeof el === 'object' && el.c_routes) addRoutes.call(this, arg, args, el.c_routes);
                else if (typeof el === 'function') this.midds.push(el);
            };
        }
        else this.midds = this.midds.concat(findFns(args));
        return this;
    }

    private requestListener(req: Request, res: Response) {
        let url = parseurl(req),
            obj = this.getRoute(req.method, url.pathname, this.notFound), i = 0,
            next: (err?: any) => void = (err?: any) => {
                if (err === void 0) {
                    let ret: Promise<any>;
                    try {
                        ret = preNext(obj.handlers[i++], req, res, next);
                    } catch (error) {
                        next(error);
                        return;
                    }
                    if (ret) {
                        if (typeof ret.then === 'function') return sendPromise(ret, res, next);
                        res.send(ret);
                    }
                } else this.error(err, req, res, next);

            };
        response(res, this.engine);
        request(req, url, obj.params, this.parsequery);
        if (req.method === 'GET' || req.method === 'HEAD') next();
        else finalHandler(req, res, this.bodyLimit, this.parsequery, this.debugError, this.defaultBody, next);
    }

    withCluster(...args: any) {
        let opts: any = { numCPUs: os.cpus().length }, cb = args[0];
        if (typeof args[0] === 'object') {
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
        server.setTimeout(this.serverTimeout);
        server.on('request', (req: Request, res: Response) => {
            this.requestListener(req, res);
        });
        server.listen(port, ...args);
    }
}

export default Application;