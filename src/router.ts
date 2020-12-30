import { Handler, TRoutes } from "./types";
import { toPathx, wrap } from "./utils";

let _push = Array.prototype.push;

export default class Router {
    routes: any[];
    constructor() {
        this.routes = [];
    }

    call(method: string, path: string, ...handlers: Array<Handler | Handler[]>) {
        let fns: Array<Handler | Handler[]> = [], j = 0, i = 0;
        for (; i < handlers.length; i++) {
            let arg = handlers[i];
            if (Array.isArray(arg)) {
                for (; j < arg.length; j++) {
                    fns.push(wrap(arg[j]));
                }
            } else {
                fns.push(wrap(arg));
            }
        }
        let el = toPathx(path);
        this.routes.push({ params: el.params, pathx: el.pathx, method, path, handlers: fns });
        return this;
    }
    getRoute(method: string, path: string, notFound: any) {
        let i = 0, j = 0, el: TRoutes, routes = this.routes,
            matches = [], params = {}, handlers = [], len = routes.length, nf: any;
        while (i < len) {
            el = routes[i];
            if ((el.method === method || el.method === 'ALL') && el.pathx.test(path)) {
                nf = false;
                if (el.params.length > 0) {
                    matches = el.pathx.exec(path);
                    while (j < el.params.length) params[el.params[j]] = matches[++j] || null;
                }
                _push.apply(handlers, el.handlers);
                break;
            }
            i++;
        }
        handlers.push(notFound);
        return { params, handlers, nf };
    }
    connect(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('CONNECT', path, ...args);
    }
    all(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('ALL', path, ...args);
    }
    trace(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('TRACE', path, ...args);
    }
    get(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('GET', path, ...args);
    }
    post(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('POST', path, ...args);
    }
    put(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('PUT', path, ...args);
    }
    delete(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('DELETE', path, ...args);
    }
    patch(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('PATCH', path, ...args);
    }
    head(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('HEAD', path, ...args);
    }
    options(path: string, ...args: Array<Handler | Handler[]>) {
        return this.call('OPTIONS', path, ...args);
    }
}
