import { MIME_TYPES, OCTET_TYPE, TYPE } from './constant';
import { JSON_TYPE, TEXT_PLAIN_TYPE, FORM_URLENCODED_TYPE } from "./constant";
import { parse as parsequery } from 'querystring';
import { Request, Response, Runner } from './types';
import * as path from 'path';
import * as fs from 'fs';

function isTypeBodyPassed(header: any, _type) {
    return header[TYPE] && header[TYPE].indexOf(_type) !== -1;
}

export function getParamNames(func: Function) {
    let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    let ARGUMENT_NAMES = /([^\s,]+)/g;
    let fnStr = func.toString().replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
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

export function findBase(path: string) {
    let iof = path.indexOf('/', 1);
    if (iof !== -1) return path.substring(0, iof);
    return path;
}

export function toPathx(str: string | RegExp): any {
    if (str instanceof RegExp) return str;
    let buildopts = (p: string) => `(?:${p})?`;
    let def_rgx = `/([^/]+?)`;
    let params = [];
    let arr = str.split(`/`);
    arr[0] || arr.shift();
    let patterns = [];
    for (let i = 0; i < arr.length; i++) {
        let el = arr[i];
        let fchar = el[0];
        let lchar = el[el.length - 1];
        if (fchar === `*`) {
            params.push(`wild`);
            patterns.push(`/(.*)`);
        } else if (fchar === `:`) {
            let in_opt = lchar === `?`;
            let in_arr = el.substring(1, in_opt ? el.length - 1 : el.length)
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
    }
    let pathx = new RegExp(`^` + patterns.join('') + `/?$`, `i`);
    return { params, pathx };
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

function asyncWrapFn(handler: any) {
    return async function (req: Request, res: Response, run: Runner) {
        try {
            let fn = await handler(req, res, run);
            if (fn) {
                if (typeof fn === 'string') res.end(fn);
                else res.json(fn);
            };
        } catch (err) {
            run(err);
        }
    }
}

function wrapFn(handler: any) {
    return function (req: Request, res: Response, run: Runner) {
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
    }
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
    return isAsync ? asyncWrapFn(handler) : wrapFn(handler);
};

function asyncWrapErrorFn(handler: any) {
    return async function (err: any, req: Request, res: Response, run: Runner) {
        try {
            let fn = await handler(err, req, res, run);
            if (fn) {
                if (typeof fn === 'string') res.end(fn);
                else res.json(fn);
            };
        } catch (err) {
            run(err);
        }
    }
}

function wrapErrorFn(handler: any) {
    return function (err: any, req: Request, res: Response, run: Runner) {
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
    }
}

export function wrapError(handler: any) {
    const isAsync = handler.constructor.name === "AsyncFunction";
    return isAsync ? asyncWrapErrorFn(handler) : wrapErrorFn(handler);
};

export function finalHandler(req: Request, res: Response, limit: number | string, qs_parse: any, useDebugError: boolean, defaultBody: boolean, method: any, cb: Function) {
    if (method === 'GET') return cb();
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        if (!defaultBody) return cb();
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
        } else {
            cb();
        }
    } else {
        cb();
    }
}

function parsebytes(arg: string | number) {
    let sizeList = { b: 1, kb: 1 << 10, mb: 1 << 20, gb: 1 << 30, tb: Math.pow(1024, 4), pb: Math.pow(1024, 5) }
    if (typeof arg === 'number') {
        return arg;
    }
    let arr = (/^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i).exec(arg);
    let val: any;
    let unt = 'b';
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

export function defaultRenderEngine(obj: {
    name: string;
    engine: any;
    header: any;
    options?: any;
}) {
    return function (res: Response, source: any, ...args: any) {
        try {
            let result: any,
                engine = obj.engine,
                name = obj.name,
                header = obj.header,
                file = fs.readFileSync(source, 'utf8');
            let type = header['content-type'] || header['Content-Type'] || res.getHeader(TYPE) || 'text/html';
            header[TYPE] = type;
            const renderOrCompile = (type: string) => {
                if (type === 'compile') {
                    let compile = engine.compile(file.toString());
                    result = compile(...args, obj.options);
                } else {
                    result = engine.render(file.toString(), ...args, obj.options);
                }
            }
            if (name === 'handlebars' || name === 'hbs') renderOrCompile('compile');
            else if (name === 'pug') renderOrCompile('compile');
            else if (name === 'vash') renderOrCompile('compile');
            else if (name === 'ejs') renderOrCompile('render');
            else if (name === 'mustache') renderOrCompile('render');
            else if (name === 'nunjucks') {
                result = engine.render(source, ...args, obj.options);
            } else {
                if (engine.render !== undefined && engine.compile !== undefined) {
                    renderOrCompile('render');
                    if (typeof result !== 'string') renderOrCompile('compile');
                }
                else if (engine.render !== undefined) renderOrCompile('render'); 
                else if (engine.compile !== undefined) renderOrCompile('compile');
            }
            if (typeof result !== 'string') {
                return res.code(404).send('View engine not supported... please add custom render');
            }
            res.writeHead(res.statusCode, header);
            return res.send(result);
        } catch (error) {
            return res.send(error || 'Something went wrong');
        }

    }

}

