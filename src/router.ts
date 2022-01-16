import { Handler, Handlers } from "./types";
import { findBase } from "./utils";
import { HttpRequest } from './http_request';
import { HttpResponse } from './http_response';

export default class Router<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
    > {
    routes: Record<string, any> = {};
    c_routes: Record<string, any>[] = [];
    midds: Handler[] = [];
    pmidds: Record<string, any> = {};

    #addMidd = (
        midds: Handler[],
        notFound: Handler,
        fns: Handler[],
        url: string = "/",
        midAsset?: { [k: string]: any },
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
        return (fns = fns.concat([notFound]));
    };
    call(method: string, path: string, ...handlers: Handlers<Req, Res>) {
        this.c_routes.push({ method, path, handlers });
        return this;
    }
    getRoute(
        method: string,
        url: string,
        notFound: Handler
    ) {
        let handlers: any[] = [];
        let params: { [key: string]: any } = {};
        if (this.routes[method + url]) {
            let obj = this.routes[method + url];
            if (obj.m) {
                handlers = obj.handlers;
            } else {
                handlers = this.#addMidd(this.midds, notFound, obj.handlers);
                this.routes[method + url] = {
                    m: true,
                    handlers,
                };
            }
            return { params, handlers };
        }
        if (url !== "/" && url[url.length - 1] === "/") {
            let _url = url.slice(0, -1);
            if (this.routes[method + _url]) {
                let obj = this.routes[method + _url];
                if (obj.m) {
                    handlers = obj.handlers;
                } else {
                    handlers = this.#addMidd(this.midds, notFound, obj.handlers);
                    this.routes[method + _url] = {
                        m: true,
                        handlers,
                    };
                }
                return { params, handlers };
            }
        }
        let i = 0;
        let j = 0;
        let obj: any = {};
        let routes = this.routes[method] || [];
        let matches = [];
        let _404 = true;
        if (this.routes["ALL"]) {
            routes = routes.concat(this.routes["ALL"]);
        }
        let len = routes.length;
        while (i < len) {
            obj = routes[i];
            if (obj.pathx && obj.pathx.test(url)) {
                _404 = false;
                if (obj.params) {
                    matches = obj.pathx.exec(url);
                    while (j < obj.params.length) {
                        params[obj.params[j]] = matches[++j] || null;
                    }
                    if (params["wild"]) {
                        params["wild"] = params["wild"].split("/");
                    }
                }
                break;
            }
            i++;
        }
        handlers = this.#addMidd(
            this.midds,
            notFound,
            _404 ? [] : obj.handlers || [],
            url,
            this.pmidds,
        );
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
