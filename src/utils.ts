import { MIME_TYPES, OCTET_TYPE, TYPE, JSON_TYPE, TEXT_PLAIN_TYPE, FORM_URLENCODED_TYPE } from './constant';
import { parse as parsequery } from 'querystring';
import { Request, Response, Runner } from './types';
import * as path from 'path';
import * as fs from 'fs';

function isTypeBodyPassed(header: any, _type) {
    return header[TYPE] && header[TYPE].indexOf(_type) !== -1;
}

export function getParamNames(func: Function) {
    let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
        ARGUMENT_NAMES = /([^\s,]+)/g,
        fnStr = func.toString().replace(STRIP_COMMENTS, ''),
        result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null) result = [];
    return result;
}

function onError(err: any, res: Response, useDebugError: boolean) {
    let obj: any = getError(err, useDebugError);
    res.statusCode = obj.statusCode;
    obj = JSON.stringify(obj);
    return res.end(obj);
}

export function getError(err: any, useDebugError: boolean = false, req?: Request) {
    let code = err.code || err.status || err.statusCode || 500;
    if (typeof code !== "number") code = 500;
    let debug: any;
    if (useDebugError && err.stack) {
        let stack = err.stack.split('\n');
        stack.shift();
        stack = stack
            .filter((line: string | string[]) => line.indexOf('node_modules') === -1)
            .map((line: string) => line.trim());
        debug = {
            stack,
            request: req ? {
                method: req.method,
                uri: req.originalUrl || req.url,
                body: req.body,
                headers: req.headers || req.header
            } : undefined
        }
    }
    return {
        statusCode: code,
        name: err.name || 'UnknownError',
        message: err.message || 'Something went wrong',
        debug
    };
}

export function generalError(useDebugError = false) {
    return (err: any, req: Request, res: Response, run: Runner) => onError(err, res, useDebugError);
}

export function findBase(pathname: string) {
    let iof = pathname.indexOf('/', 1);
    if (iof !== -1) return pathname.substring(0, iof);
    return pathname;
}

export function findArgs(arr: any, ifFn?: boolean) {
    let _arr = [];
    for (let i = 0; i < arr.length; i++) {
        if (ifFn) {
            if (typeof arr[i] === 'function') _arr.push(wrap(arr[i]));
        } else _arr.push(wrap(arr[i]));
    }
    return _arr;
}

export function toPathx(str: string) {
    let buildopts = (p: string) => `(?:${p})?`,
        def_rgx = `/([^/]+?)`,
        params = [],
        arr = str.split(`/`);
    arr[0] || arr.shift();
    let patterns = [],
        len = arr.length,
        i = 0,
        el: string | string[],
        fchar: string,
        lchar: string,
        in_opt: boolean,
        in_arr: string | string[];
    while (i < len) {
        el = arr[i];
        fchar = el[0];
        lchar = el[el.length - 1];
        if (fchar === `*`) {
            params.push(`wild`);
            patterns.push(`/(.*)`);
        } else if (fchar === `:`) {
            in_opt = lchar === `?`;
            in_arr = el.substring(1, in_opt ? el.length - 1 : el.length)
            if (in_arr[in_arr.length - 1] === `)`) {
                let match = in_arr.match(/^([^(]+)(\(.+\))$/);
                if (match) {
                    params.push(match[1]);
                    let in_pattern = `/` + match[2];
                    patterns.push(in_opt ? buildopts(in_pattern) : in_pattern);
                }
            }
            params.push(in_arr);
            patterns.push(in_opt ? buildopts(def_rgx) : def_rgx);
        } else {
            patterns.push(`/` + el);
        }
        i++;
    }
    return { params, pathx: new RegExp(`^` + patterns.join('') + `/?$`, `i`) };
}

export function parseurl(req: Request) {
    let str = req.url, url = req._parsedUrl;
    if (url && url._raw === str) return url;
    let pathname = str, query = null, search = null, i = 1, len = str.length;
    while (i < len) {
        if (str.charCodeAt(i) === 0x3f) {
            pathname = str.substring(0, i);
            query = str.substring(i + 1);
            search = str.substring(i);
            break;
        }
        ++i;
    }
    url = {};
    url.path = url._raw = url.href = str;
    url.pathname = pathname;
    url.query = query;
    url.search = search;
    return (req._parsedUrl = url);
}

async function withPromise(handler: any, res: Response, run: Runner) {
    try {
        let fn = await handler;
        if (typeof fn === 'string') res.end(fn);
        else res.json(fn);
    } catch (err) {
        run(err);
    }
}

export function wrap(handler: any) {
    const isAsync = handler.constructor.name === "AsyncFunction";
    return isAsync ? async function (req: Request, res: Response, run: Runner) {
        try {
            let fn = await handler(req, res, run);
            if (fn) {
                if (typeof fn === 'string') res.end(fn);
                else res.json(fn);
            };
        } catch (err) {
            run(err);
        }
    } : function (req: Request, res: Response, run: Runner) {
        try {
            let fn = handler(req, res, run);
            if (fn) {
                if (typeof fn === 'string') res.end(fn);
                else if (typeof fn.then === 'function') return withPromise(fn, res, run);
                else res.json(fn);
            };
        } catch (err) {
            run(err);
        }
    };
};

export function wrapError(handler: any) {
    const isAsync = handler.constructor.name === "AsyncFunction";
    return isAsync ? async function (err: any, req: Request, res: Response, run: Runner) {
        try {
            let fn = await handler(err, req, res, run);
            if (fn) {
                if (typeof fn === 'string') res.end(fn);
                else res.json(fn);
            };
        } catch (err) {
            run(err);
        }
    } : function (err: any, req: Request, res: Response, run: Runner) {
        try {
            let fn = handler(err, req, res, run);
            if (fn) {
                if (typeof fn === 'string') res.end(fn);
                else if (typeof fn.then === 'function') return withPromise(fn, res, run);
                else res.json(fn);
            };
        } catch (err) {
            run(err);
        }
    };
};

export function finalHandler(req: Request, res: Response, limit: number | string, qs_parse: any, useDebugError: boolean, defaultBody: boolean, method: any, cb: () => void) {
    let i = 0;
    if (method === 'GET') cb();
    else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        if (!defaultBody) {
            cb();
            return;
        };
        let header = req.headers;
        if (isTypeBodyPassed(header, JSON_TYPE) ||
            isTypeBodyPassed(header, TEXT_PLAIN_TYPE) ||
            isTypeBodyPassed(header, FORM_URLENCODED_TYPE)
        ) {
            let data = [];
            let error = null;
            let lmt = parsebytes(limit);
            let urlencode_parse = qs_parse || parsequery;
            req.on('data', (chunk: Buffer) => {
                let len = req.headers['content-length'] || Buffer.byteLength(chunk);
                try {
                    if (len > lmt) {
                        throw new Error('Body is too large');
                    } else {
                        data.push(chunk);
                    }
                } catch (err) {
                    error = err;
                }
            }).on('end', () => {
                if (error) return onError(error, res, useDebugError);
                let str = Buffer.concat(data).toString();
                let body = null;
                if (isTypeBodyPassed(header, JSON_TYPE)) {
                    try {
                        body = JSON.parse(str);
                    } catch (err) {
                        return onError(err, res, useDebugError);
                    }
                } else if (isTypeBodyPassed(header, TEXT_PLAIN_TYPE)) {
                    body = str;
                } else if (isTypeBodyPassed(header, FORM_URLENCODED_TYPE)) {
                    try {
                        body = urlencode_parse(str);
                    } catch (err) {
                        return onError(err, res, useDebugError);
                    }
                }
                req._body = true;
                req.body = body;
                cb();
            });
        } else cb();
    } else cb();
}

function parsebytes(arg: string | number) {
    let sizeList = { b: 1, kb: 1 << 10, mb: 1 << 20, gb: 1 << 30, tb: Math.pow(1024, 4), pb: Math.pow(1024, 5) }
    if (typeof arg === 'number') return arg;
    let arr = (/^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i).exec(arg), val: any, unt = 'b';
    if (!arr) {
        val = parseInt(val, 10);
        unt = 'b';
    } else {
        val = parseFloat(arr[1]);
        unt = arr[4].toLowerCase();
    }
    return Math.floor(sizeList[unt] * val);
}

export function getMimeType(str: string) {
    let types = MIME_TYPES;
    str = path.extname(str).substring(1);
    str = str ? str.toLowerCase() : '3rt';
    return types[str] || OCTET_TYPE;
};

const mapEngine = {
    'handlebars': 'compile',
    'vash': 'compile',
    'nunjucks': 'renderSource',
    'mustache': 'render'
}

export function defaultRenderEngine(obj: {
    name: string;
    engine: any;
    header: any;
    settings: any;
    options?: any;
}) {
    return function (res: Response, source: any, ...args: any) {
        let result: any,
            engine = obj.engine,
            name = obj.name,
            header = obj.header,
            file = fs.readFileSync(source, 'utf8');
        header['Content-Type'] = header['Content-Type'] || header[TYPE] || res.getHeader(TYPE) || res.getHeader('Content-Type') || 'text/html; charset=utf-8';
        if (obj.options) args.push(obj.options);
        if (!args.length) args.push({ settings: obj.settings });
        else Object.assign(args[0], { settings: obj.settings });
        if (typeof engine === 'function') {
            engine(source, ...args, (err: any, out: any) => {
                if (err) throw err;
                res.writeHead(res.statusCode, header);
                res.end(out);
            });
        } else {
            const renderOrCompile = (type: string) => {
                if (type === 'compile') {
                    let compile = engine.compile(file.toString(), {
                        filename: source
                    });
                    result = compile(...args);
                } 
                else if (type === 'render') result = engine.render(file.toString(), ...args);
                else if (type === 'renderSource') result = engine.render(source, ...args);
            }
            if (mapEngine[name] !== undefined) renderOrCompile(mapEngine[name]);
            else {
                if (engine.render !== undefined && engine.compile !== undefined) {
                    renderOrCompile('render');
                    if (typeof result !== 'string') renderOrCompile('compile');
                }
                else if (engine.render !== undefined) renderOrCompile('render');
                else if (engine.compile !== undefined) renderOrCompile('compile');
            }
            if (typeof result !== 'string') {
                throw new Error('View engine not supported... please add custom render');
            }
            res.writeHead(res.statusCode, header);
            return res.send(result);
        }

    }

}

