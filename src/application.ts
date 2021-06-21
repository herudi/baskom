import * as http from 'http';
import * as cluster from 'cluster';
import * as os from 'os';
import Router from './router';
import {
    getParamNames,
    finalHandler,
    getError,
    toPathx,
    getEngine,
    modPath,
    getReqCookies,
    parseQuery
} from './utils';
import response from './response';
import {
    Handler,
    Handlers,
    HttpRequest,
    HttpResponse,
    IApp,
    NextFunction,
    TEHandler,
    TErrorResponse
} from './types';

class Application<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
    > extends Router<Req, Res> {
    #parsequery: any;
    #debugError: boolean;
    #bodyLimit: string | number;
    #engine: { [key: string]: any };
    #workers: any[];
    #defaultBody: boolean;
    #server: any;
    #serverTimeout: number;
    constructor({
        useServer,
        useServerTimeout,
        useParseQueryString,
        useDebugError,
        useBodyLimit,
        useDefaultBody
    }: IApp = {}) {
        super();
        this.#debugError = !!useDebugError;
        this.#serverTimeout = useServerTimeout || 0;
        this.#bodyLimit = useBodyLimit || '1mb';
        this.#defaultBody = useDefaultBody !== false;
        this.#parsequery = useParseQueryString || parseQuery;
        this.lookup = this.lookup.bind(this);
        this.#engine = {};
        this.#workers = [];
        this.#server = useServer;
    }
    #sendPromise = async (
        handler: Promise<Handler>,
        res: Res,
        next: NextFunction,
        isWrapError: boolean = false
    ) => {
        try {
            let ret = await handler;
            if (!ret) return;
            res.send(ret);
        } catch (err) {
            if (isWrapError) {
                const obj = getError(err, this.#debugError);
                return res.code(obj.statusCode).json(obj);
            }
            next(err);
        }
    }
    #onNotFound: Handler = (req, res, next) => {
        return res.code(404).json({
            statusCode: 404,
            name: 'NotFoundError',
            message: `Route ${req.method}${req.url} not found`
        })
    };
    #onError: TEHandler = (err, req, res, next) => {
        const obj = getError(err, this.#debugError, req);
        return res.code(obj.statusCode).json(obj);
    }
    #wrapError = (handler: TEHandler): TEHandler => {
        return (err, req, res, next) => {
            let ret: Promise<any>;
            try {
                ret = handler(err, req, res, next);
            } catch (err) {
                return this.#onError(err, req, res, next);
            }
            if (ret) {
                if (typeof ret.then === 'function') {
                    return this.#sendPromise(ret, res as Res, next, true);
                }
                res.send(ret);
            };
        };
    };
    #findFns = (arr: any[]) => {
        let ret: any[] = [], i = 0, len = arr.length;
        for (; i < len; i++) {
            if (Array.isArray(arr[i])) {
                ret = ret.concat(this.#findFns(arr[i]));
            } else if (typeof arr[i] === 'function') {
                ret.push(arr[i]);
            }
        }
        return ret;
    }
    #addRoutes = (arg: string, args: any[], routes: any[]) => {
        let prefix = '', midds = this.#findFns(args), i = 0, len = routes.length;
        if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') prefix = arg;
        for (; i < len; i++) {
            let el = routes[i];
            el.handlers = midds.concat(el.handlers);
            this.call(el.method, prefix + el.path, ...el.handlers);
        }
    }
    #preNext = (
        cb: Handler,
        req: Req,
        res: Res,
        next: NextFunction
    ) => {
        if (res.finished === true || res.writableEnded === true) return;
        return cb(req, res, next);
    }
    #parseUrl = (req: Req) => {
        let str = req.url as string;
        let url = req._parsedUrl || {};
        if (url._raw === str) return;
        let pathname = str,
            query = null,
            search = null,
            i = 0,
            len = str.length;
        while (i < len) {
            if (str.charCodeAt(i) === 0x3f) {
                pathname = str.substring(0, i);
                query = str.substring(i + 1);
                search = str.substring(i);
                break;
            }
            i++;
        }
        url.path = url._raw = url.href = str;
        url.pathname = pathname;
        url.query = query;
        url.search = search;
        req._parsedUrl = url;
    };
    #requestListener = (req: Req, res: Res, i = 0) => {
        this.#parseUrl(req);
        const obj = this.getRoute(
            (req.method as string),
            req._parsedUrl.pathname,
            this.#onNotFound
        );
        const next: NextFunction = (err?: any) => {
            if (err) return this.#onError(err, req, res, next);
            let ret: any;
            try {
                ret = this.#preNext(obj.handlers[i++], req, res, next);
            } catch (error) {
                return next(error);
            }
            if (ret) {
                if (typeof ret.then === 'function') {
                    return this.#sendPromise(ret, res, next);
                }
                res.send(ret);
            }
        };
        req.originalUrl = (req.originalUrl || req.url) as string;
        req.params = obj.params;
        req.path = req._parsedUrl.pathname;
        req.query = this.#parsequery(req._parsedUrl.query);
        req.search = req._parsedUrl.search;
        req.body = req.body || {};
        req.getCookies = (b?: boolean) => getReqCookies(req, b);
        response(res, this.#engine);
        if (req.method === 'GET' || req.method === 'HEAD') return next();
        finalHandler(
            req,
            next,
            this.#bodyLimit,
            this.#parsequery,
            this.#defaultBody
        );
    }

    call(method: string, path: string, ...handlers: Handlers<Req, Res>) {
        let fns = this.#findFns(handlers);
        let obj = toPathx(path, method === 'ALL');
        if (obj !== void 0) {
            if (obj.key) {
                this.routes[method + obj.key] = {
                    params: obj.params,
                    handlers: fns
                };
            } else {
                if (this.routes[method] === void 0) {
                    this.routes[method] = [];
                }
                this.routes[method].push({
                    ...obj,
                    handlers: fns
                });
            }
        } else {
            this.routes[method + path] = { handlers: fns };;
        }
        return this;
    }

    getError(err: Error, req: Req, res: Res): TErrorResponse {
        let data = getError(err, this.#debugError, req);
        res.code(data.statusCode);
        return data;
    }

    use(prefix: string, routers: Router[]): this;
    use(prefix: string, router: Router): this;
    use(router: Router): this;
    use(router: Router[]): this;
    use(middleware: Handler<Req, Res>, routers: Router[]): this;
    use(middleware: Handler<Req, Res>, router: Router): this;
    use(middleware: Handler<Req, Res> | TEHandler): this;
    use(...middlewares: Handlers<Req, Res>): this;
    use(prefix: string, middleware: Handler<Req, Res>, routers: Router[]): this;
    use(prefix: string, middleware: Handler<Req, Res>, router: Router): this;
    use(prefix: string, middleware: Handler<Req, Res>): this;
    use(prefix: string, ...middlewares: Handlers<Req, Res>): this;
    use(...args: any): this;
    use(...args: any) {
        let arg = args[0], larg = args[args.length - 1], len = args.length;
        if (len === 1 && typeof arg === 'function') {
            let params = getParamNames(arg), fname = params[0];
            if (fname === 'err' || fname === 'error' || params.length === 4) {
                this.#onError = this.#wrapError(arg);
            } else {
                this.midds.push(arg);
            }
        } else if (typeof arg === 'string' && typeof larg === 'function') {
            if (arg === '*') {
                this.#onNotFound = larg;
            } else {
                if (arg === '/' || arg === '') {
                    this.midds = this.midds.concat(this.#findFns(args));
                } else {
                    this.pmidds[arg] = [modPath(arg)].concat(this.#findFns(args));
                }
            }
        } else if (typeof larg === 'object' && larg.c_routes) {
            this.#addRoutes(arg, args, larg.c_routes);
        } else if (typeof larg === 'object' && larg.engine) {
            let obj = getEngine(arg);
            this.#engine[obj.ext] = obj;
        } else if (Array.isArray(larg)) {
            let el: any, i = 0, len = larg.length;
            for (; i < len; i++) {
                el = larg[i];
                if (typeof el === 'object' && el.c_routes) {
                    this.#addRoutes(arg, args, el.c_routes);
                } else if (typeof el === 'function') {
                    this.midds.push(el);
                }
            };
        } else {
            this.midds = this.midds.concat(this.#findFns(args));
        }
        return this;
    }

    withCluster(config: { numCPUs: number }, callback: () => void): void;
    withCluster(callback: () => void): void;
    withCluster(...args: any): void;
    withCluster(...args: any) {
        let opts: { numCPUs: number } = { numCPUs: os.cpus().length }, cb = args[0];
        if (typeof args[0] === 'object') {
            opts = args[0];
            cb = args[1];
        }
        if (cluster.isMaster) {
            for (let i = 0; i < opts.numCPUs; i++) this.#workers.push(cluster.fork());
            cluster.on('exit', () => {
                cluster.fork();
                this.#workers.push(cluster.fork());
            });
        } else cb();
    }

    lookup(req: Req, res: Res): void;
    lookup(req: any, res: any): void;
    lookup(req: Req, res: Res) {
        this.#requestListener(req, res);
    }

    listen(port: number, hostname?: string, callback?: (err?: Error) => void): void;
    listen(port: number, callback: (err?: Error) => void): void;
    listen(port: number, ...args: any): void;
    listen(port: number = 3000, ...args: any) {
        const server = this.#server || http.createServer();
        if (server.setTimeout) server.setTimeout(this.#serverTimeout);
        server.on('request', (req: Req, res: Res) => {
            this.#requestListener(req, res);
        });
        server.listen(port, ...args);
    }
}

export default Application;