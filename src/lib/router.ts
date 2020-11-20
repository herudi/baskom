import { toPathx, wrap } from "./utils";

export default class Router {
    routes: any[];
    get: (path: string, ...args: any) => any;
    post: (path: string, ...args: any) => any;
    put: (path: string, ...args: any) => any;
    delete: (path: string, ...args: any) => any;
    patch: (path: string, ...args: any) => any;
    head: any;
    options: any;
    connect: any;
    trace: any;
    all: (path: string, ...args: any) => any;
    constructor() {
        this.routes = [];
        this.get = this.on.bind(this, 'GET');
        this.post = this.on.bind(this, 'POST');
        this.put = this.on.bind(this, 'PUT');
        this.delete = this.on.bind(this, 'DELETE');
        this.patch = this.on.bind(this, 'PATCH');
        this.head = this.on.bind(this, 'HEAD');
        this.options = this.on.bind(this, 'OPTIONS');
        this.connect = this.on.bind(this, 'CONNECT');
        this.trace = this.on.bind(this, 'TRACE');
        this.all = this.on.bind(this, 'ALL');
    }


    private on(method: string, path: string, ...args: any[]) {
        let handlers = [], j = 0, i = 0;
        for (; i < args.length; i++) {
            let arg = args[i];
            if (Array.isArray(arg)) {
                for (; j < arg.length; j++) {
                    handlers.push(wrap(arg[j]));
                }
            } else {
                handlers.push(wrap(arg));
            }
        }
        let el = toPathx(path);
        this.routes.push({ ...el, method, path, handlers });
        return this;
    }

    getRoute(method: string, path: string, notFound: any) {
        let i = 0, j = 0, el: any, routes = this.routes;
        let matches = [], params = {}, handlers = [], len = routes.length;
        while (i < len) {
            el = routes[i];
            if ((method === el.method || el.method === 'HEAD' || el.method === 'ALL') && el.pathx.test(path)) {
                if (el.params.length > 0) {
                    matches = el.pathx.exec(path);
                    while (j < el.params.length) {
                        params[el.params[j]] = matches[++j] || null;
                    }
                }
                handlers = handlers.concat(el.handlers);
            }
            ++i;
        }
        handlers.push(notFound);
        return { params, handlers };
    }
}
