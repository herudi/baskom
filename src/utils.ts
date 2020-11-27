import { TYPE } from './constant';
import { JSON_TYPE, TEXT_PLAIN_TYPE, FORM_URLENCODED_TYPE } from "./constant";
import { parse as parsequery } from 'querystring';
import { IParseBody, Request, Response, Runner } from './types';

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

export function generalError(useDebugError = false) {
    return (err: any, req: Request, res: Response, run: Runner) => {
        let code = err.code || err.status || err.statusCode || 500;
        let stack: any;
        if (useDebugError && err.stack) {
            stack = err.stack.split('\n');
            stack.shift();
            stack = stack
                .filter((line: string | string[]) => line.indexOf('node_modules') === -1)
                .map((line: string) => line.trim());
        }
        let obj: any = {
            statusCode: code,
            name: err.name || 'UnknownError',
            message: err.message || 'Something went wrong',
            stack
        }
        res.statusCode = code;
        return res.end(JSON.stringify(obj));
    }
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
        i++;
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

export function parsebody({ limit, qs_parse }: IParseBody = {}) {
    return function (req: Request, res: Response, run: Runner) {
        let dismethod = 'GET,DELETE';
        let header = req.headers;
        if (dismethod.indexOf(req.method) === -1 && (
            isTypeBodyPassed(header, JSON_TYPE) ||
            isTypeBodyPassed(header, TEXT_PLAIN_TYPE) ||
            isTypeBodyPassed(header, FORM_URLENCODED_TYPE)
        )) {
            let data = [];
            let error = null;
            let lmt = parsebytes(limit || '1mb');
            let urlencode_parse = qs_parse || parsequery;
            req.on('data', (chunk: Buffer) => {
                let len = req.headers['content-length'] || Buffer.byteLength(chunk);
                try {
                    if (len > lmt) {
                        throw new Error('Body is too large');
                    } else {
                        data.push(chunk);
                    }
                }
                catch (err) {
                    error = err;
                }
            }).on('end', () => {
                if (error) {
                    run(error);
                } else {
                    let str = Buffer.concat(data).toString();
                    let body = null;
                    if (isTypeBodyPassed(header, JSON_TYPE)) {
                        body = JSON.parse(str);
                    } else if (isTypeBodyPassed(header, TEXT_PLAIN_TYPE)) {
                        body = str;
                    } else if (isTypeBodyPassed(header, FORM_URLENCODED_TYPE)) {
                        body = urlencode_parse(str);
                    }
                    req._body = true;
                    req.body = body;
                    run();
                }
            });
        }
        else {
            run();
        }

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

