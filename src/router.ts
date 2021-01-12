import { NextFunction, Request, Response, THandler, TRoutes } from "./types";

const _PUSH = Array.prototype.push;

export default class Router {
    routes: any;
    c_routes: any[];
    constructor() {
        this.routes = {};
        this.c_routes = [];
    }

    call(method: string, path: string, ...handlers: Array<THandler | THandler[]>) {
        this.c_routes.push({ method, path, handlers });
        return this;
    }
    getRoute(method: string, path: string, notFound: any) {
        if (this.routes['ALL'] !== void 0) {
            if (this.routes[method] === void 0) this.routes[method] = [];
            this.routes[method] = this.routes[method].concat(this.routes['ALL']);
        }
        let i = 0, j = 0, el: TRoutes, routes = this.routes[method] || [], matches = [], params = {}, handlers = [], len = routes.length, nf: any;
        while (i < len) {
            el = routes[i];
            if (el.pathx.test(path)) {
                nf = false;
                if (el.params) {
                    matches = el.pathx.exec(path);
                    while (j < el.params.length) params[el.params[j]] = matches[++j] || null;
                    if (params['wild']) params['wild'] = params['wild'].split('/');
                }
                _PUSH.apply(handlers, el.handlers);
                break;
            }
            i++;
        }
        if (notFound) handlers.push(notFound);
        else {
            handlers.push((req: Request, res: Response, next: NextFunction) => {
                return res.code(404).json({
                    statusCode: 404,
                    name: 'NotFoundError',
                    message: `Route ${method}${path} not found`
                })
            });
        }
        return { params, handlers, nf };
    }
    all(path: string, ...handlers: Array<THandler | THandler[]>) {
        return this.call('ALL', path, ...handlers);
    }
    get(path: string, ...handlers: Array<THandler | THandler[]>) {
        return this.call('GET', path, ...handlers);
    }
    post(path: string, ...handlers: Array<THandler | THandler[]>) {
        return this.call('POST', path, ...handlers);
    }
    put(path: string, ...handlers: Array<THandler | THandler[]>) {
        return this.call('PUT', path, ...handlers);
    }
    delete(path: string, ...handlers: Array<THandler | THandler[]>) {
        return this.call('DELETE', path, ...handlers);
    }
    patch(path: string, ...handlers: Array<THandler | THandler[]>) {
        return this.call('PATCH', path, ...handlers);
    }
    head(path: string, ...handlers: Array<THandler | THandler[]>) {
        return this.call('HEAD', path, ...handlers);
    }
    options(path: string, ...handlers: Array<THandler | THandler[]>) {
        return this.call('OPTIONS', path, ...handlers);
    }
}
