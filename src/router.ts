import { THandler, TRoutes } from "./types";

const PUSH = Array.prototype.push;

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
        let params = {}, handlers = [], nf: any;
        if (this.routes[method + path]) {
            PUSH.apply(handlers, this.routes[method + path]);
            nf = false;
        } else {
            let key = '';
            if (path.lastIndexOf('/') === (path.length - 1)) {
                let _key = path.slice(0, -1);
                key = _key.substring(0, _key.lastIndexOf('/'));
            }
            else key = path.substring(0, path.lastIndexOf('/'));
            if (this.routes[method + key + '/:p']) {
                let obj = this.routes[method + key + '/:p'];
                let param = path.substring(path.lastIndexOf('/') + 1);
                params = { [obj.params]: param };
                PUSH.apply(handlers, obj.handlers);
                nf = false;
            } else {
                if (this.routes['ALL'] !== void 0) {
                    if (this.routes[method] === void 0) this.routes[method] = [];
                    this.routes[method] = this.routes[method].concat(this.routes['ALL']);
                }
                let i = 0, j = 0, el: TRoutes, routes = this.routes[method] || [], matches = [], len = routes.length;
                while (i < len) {
                    el = routes[i];
                    if (el.pathx.test(path)) {
                        nf = false;
                        if (el.params) {
                            matches = el.pathx.exec(path);
                            while (j < el.params.length) params[el.params[j]] = matches[++j] || null;
                            if (params['wild']) params['wild'] = params['wild'].split('/');
                        }
                        PUSH.apply(handlers, el.handlers);
                        break;
                    }
                    i++;
                }
            }

        }
        handlers.push(notFound);
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
