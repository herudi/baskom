import { Handler, Handlers, HttpRequest, HttpResponse } from "./types";
import { findBase } from "./utils";

export default class Router<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
    > {
    routes: Record<string, any> = {};
    c_routes: Record<string, any>[] = [];
    midds: Handler[] = [];
    pmidds: Record<string, any> = {};

    #addMidd = (
        url: string,
        midds: any[],
        nf: Handler,
        fns: any[],
        midAsset?: any
    ) => {
        if (midAsset !== void 0) {
            let pfx = findBase(url);
            if (midAsset[pfx]) {
                fns = midAsset[pfx].concat(fns);
            }
        }
        if (midds.length) {
            fns = midds.concat(fns);
        }
        return (fns = fns.concat([nf]));
    }
    call(method: string, path: string, ...handlers: Handlers<Req, Res>) {
        this.c_routes.push({ method, path, handlers });
        return this;
    }
    getRoute(
        method: string,
        url: string,
        notFound: Handler
    ) {
        let params: { [key: string]: any } = {}, handlers: any[] = [];
        if (this.routes[method + url]) {
            let obj = this.routes[method + url];
            if (obj.m) {
                handlers = obj.handlers;
            } else {
                handlers = this.#addMidd(url, this.midds, notFound, obj.handlers);
                this.routes[method + url] = { m: true, handlers };
            }
        } else {
            let key = '';
            // many user call http://qwerty.com/user/param/. unfortunately.
            if (url.lastIndexOf('/') === (url.length - 1)) {
                let _key = url.slice(0, -1);
                key = _key.substring(0, _key.lastIndexOf('/'));
            } else {
                key = url.substring(0, url.lastIndexOf('/'));
            }
            if (this.routes[method + key + '/:p']) {
                let obj = this.routes[method + key + '/:p'];
                params[obj.params] = url.substring(url.lastIndexOf('/') + 1);
                if (obj.m) {
                    handlers = obj.handlers;
                } else {
                    handlers = this.#addMidd(url, this.midds, notFound, obj.handlers);
                    this.routes[method + key + '/:p'] = { m: true, params: obj.params, handlers };
                }
            }
            else {
                let i = 0, j = 0, obj: any = {}, routes = this.routes[method] || [], matches = [], nf = true;
                if (this.routes['ALL']) {
                    routes = routes.concat(this.routes['ALL']);
                }
                let len = routes.length;
                if (len) {
                    while (i < len) {
                        obj = routes[i];
                        if (obj.pathx && obj.pathx.test(url)) {
                            nf = false;
                            handlers = this.#addMidd(url, this.midds, notFound, obj.handlers, this.pmidds);
                            if (obj.params) {
                                matches = obj.pathx.exec(url);
                                while (j < obj.params.length) {
                                    params[obj.params[j]] = matches[++j] || null;
                                }
                                if (params['wild']) {
                                    params['wild'] = params['wild'].split('/');
                                }
                            }
                            break;
                        }
                        i++;
                    }
                }
                if (nf) {
                    handlers = this.#addMidd(url, this.midds, notFound, [], this.pmidds);
                }
            }
        }
        return { params, handlers };
    }
    all(path: string, ...handlers: Handlers<Req, Res>): this {
        return this.call('ALL', path, ...handlers);
    }
    get(path: string, ...handlers: Handlers<Req, Res>): this {
        return this.call('GET', path, ...handlers);
    }
    post(path: string, ...handlers: Handlers<Req, Res>): this {
        return this.call('POST', path, ...handlers);
    }
    put(path: string, ...handlers: Handlers<Req, Res>): this {
        return this.call('PUT', path, ...handlers);
    }
    delete(path: string, ...handlers: Handlers<Req, Res>): this {
        return this.call('DELETE', path, ...handlers);
    }
    patch(path: string, ...handlers: Handlers<Req, Res>): this {
        return this.call('PATCH', path, ...handlers);
    }
    head(path: string, ...handlers: Handlers<Req, Res>): this {
        return this.call('HEAD', path, ...handlers);
    }
    options(path: string, ...handlers: Handlers<Req, Res>): this {
        return this.call('OPTIONS', path, ...handlers);
    }
}
