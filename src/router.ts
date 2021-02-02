import { NextFunction, Request, Response, THandler } from "./types";
import { findBase } from "./utils";

function addMidd(url: string, mid1: any, mid2: any[], nf: (req: Request, res: Response, next?: NextFunction) => void, fns: any[]) {
    let pfx = findBase(url);
    if (mid1[pfx]) fns = mid1[pfx].concat(fns);
    if (mid2.length) fns = mid2.concat(fns);
    return (fns = fns.concat([nf]));
}

export default class Router {
    routes: any;
    c_routes: any[];
    midds: any[];
    pmidds: {};
    constructor() {
        this.routes = {};
        this.c_routes = [];
        this.midds = [];
        this.pmidds = {};
    }

    call(method: string, path: string, ...handlers: Array<THandler | THandler[]>) {
        this.c_routes.push({ method, path, handlers });
        return this;
    }
    getRoute(method: string, url: string, notFound: any) {
        let params = {}, handlers = [];
        if (this.routes[method + url]) {
            let obj = this.routes[method + url];
            if (obj.m) handlers = obj.handlers;
            else {
                handlers = addMidd(url, this.pmidds, this.midds, notFound, obj.handlers);
                this.routes[method + url] = { m: true, handlers };
            }
        } else {
            let key = '';
            // many user call http://qwerty.com/user/param/. unfortunately.
            if (url.lastIndexOf('/') === (url.length - 1)) {
                let _key = url.slice(0, -1);
                key = _key.substring(0, _key.lastIndexOf('/'));
            }
            else key = url.substring(0, url.lastIndexOf('/'));
            if (this.routes[method + key + '/:p']) {
                let obj = this.routes[method + key + '/:p'];
                params[obj.params] = url.substring(url.lastIndexOf('/') + 1);
                if (obj.m) handlers = obj.handlers;
                else {
                    handlers = addMidd(url, this.pmidds, this.midds, notFound, obj.handlers);
                    this.routes[method + key + '/:p'] = { m: true, params: obj.params, handlers };
                }
            } else {
                if (this.routes['ALL'] !== undefined) {
                    if (this.routes[method] === undefined) this.routes[method] = [];
                    this.routes[method] = this.routes[method].concat(this.routes['ALL']);
                }
                let i = 0, j = 0, obj: any = {}, routes = this.routes[method] || [], matches = [], len = routes.length, nf;
                while (i < len) {
                    obj = routes[i];
                    if (obj.pathx && obj.pathx.test(url)) {
                        nf = false;
                        if (obj.m) handlers = obj.handlers;
                        else {
                            handlers = addMidd(url, this.pmidds, this.midds, notFound, obj.handlers);
                            this.routes[method][i] = { m: true, params: obj.params, handlers, pathx: obj.pathx };
                        }
                        if (obj.params) {
                            matches = obj.pathx.exec(url);
                            while (j < obj.params.length) params[obj.params[j]] = matches[++j] || null;
                            if (params['wild']) params['wild'] = params['wild'].split('/');
                        }
                        break;
                    }
                    i++;
                }
                if (nf === undefined) handlers.push(notFound);
            }
        }
        return { params, handlers };
    }
    all(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.call('ALL', path, ...handlers);
    }
    get(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.call('GET', path, ...handlers);
    }
    post(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.call('POST', path, ...handlers);
    }
    put(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.call('PUT', path, ...handlers);
    }
    delete(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.call('DELETE', path, ...handlers);
    }
    patch(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.call('PATCH', path, ...handlers);
    }
    head(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.call('HEAD', path, ...handlers);
    }
    options(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.call('OPTIONS', path, ...handlers);
    }
}
