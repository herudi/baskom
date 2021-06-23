import { MIME_TYPES, OCTET_TYPE, JSON_TYPE, TEXT_PLAIN_TYPE, FORM_URLENCODED_TYPE, CONTENT_TYPE, SERIALIZE_COOKIE_REGEXP } from './constant';
import { NextFunction, TErrorResponse, Cookie, HttpResponse, HttpRequest } from './types';
import * as pathnode from 'path';
import { CONTENT_LENGTH } from './constant';
import * as fs from 'fs';
import * as _util from 'util';

const encoder = new _util.TextEncoder();
const decoder = new _util.TextDecoder();

type TSizeList = {
    b: number;
    kb: number;
    mb: number;
    gb: number;
    tb: number;
    pb: number;
    [key: string]: any;
};

type TMapEngine = {
    handlebars: string;
    vash: string;
    nunjucks: string;
    mustache: string;
    [key: string]: any;
};

type TDefaultEngineParam = {
    name: string;
    engine: any;
    etag?: boolean;
    settings: { [key: string]: any };
    options?: { [key: string]: any };
}

export function findFns(arr: any[]) {
    let ret: any[] = [], i = 0, len = arr.length;
    for (; i < len; i++) {
        if (Array.isArray(arr[i])) {
            ret = ret.concat(findFns(arr[i]));
        } else if (typeof arr[i] === 'function') {
            ret.push(arr[i]);
        }
    }
    return ret;
}

function isTypeBodyPassed(header: any, _type: string) {
    return header[CONTENT_TYPE.toLowerCase()] && header[CONTENT_TYPE.toLowerCase()].indexOf(_type) !== -1;
}

export function getParamNames(func: Function) {
    let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
        ARGUMENT_NAMES = /([^\s,]+)/g,
        fnStr = func.toString().replace(STRIP_COMMENTS, ''),
        result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null) result = [];
    return result;
}

export function getError(err: any, useDebugError: boolean = false, req?: HttpRequest): TErrorResponse {
    let code = err.code || err.status || err.statusCode || 500;
    if (typeof code !== "number") code = 500;
    let debug: { [key: string]: any } | undefined;
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

export function findBase(pathname: string) {
    let iof = pathname.indexOf('/', 1);
    if (iof !== -1) return pathname.substring(0, iof);
    return pathname;
}

export function getEngine(arg: any) {
    if (arg.etag === void 0) arg.etag = false;
    let defaultDir = pathnode.join(pathnode.dirname((require as any).main.filename || (process as any).mainModule.filename), 'views'),
        ext = arg.ext,
        basedir = pathnode.resolve(arg.basedir || defaultDir),
        render = arg.render;
    if (render === void 0) {
        let engine = (typeof arg.engine === 'string' ? require(arg.engine) : arg.engine);
        if (typeof engine === 'object' && engine.renderFile !== void 0) {
            engine = engine.renderFile;
        }
        let _name = arg.name || (typeof arg.engine === 'string' ? arg.engine : 'html');
        ext = ext || ('.' + _name);
        if (_name === 'nunjucks') {
            engine.configure(basedir, arg);
        }
        render = defaultRenderEngine({
            engine,
            name: _name,
            etag: arg.etag,
            options: arg.options,
            settings: { views: basedir }
        })
    }
    return { ext, basedir, render };
}

export function modPath(prefix: string) {
    return function (req: HttpRequest, res: HttpResponse, next: NextFunction) {
        req.url = (req.url as string).substring(prefix.length) || '/';
        req.path = req.path ? req.path.substring(prefix.length) || '/' : '/';
        next();
    }
}

const isObj = (n: any) => n.constructor === Object;
const isArr = (n: any) => Array.isArray(n);
const isBool = (n: any) => n === "true" || n === "false";
const isNum = (n: any) => !isNaN(parseFloat(n)) && isFinite(n);
const mutValue = (n: any) => {
    if (typeof n === "undefined" || n === "") return null;
    if (isNum(n)) return parseFloat(n);
    if (isBool(n)) return n === 'true';
    if (isArr(n)) return mutArr(n);
    if (isObj(n)) return mutObj(n);
    return n;
}
const mutArr = (arr: any[], i = 0) => {
    let ret = [] as any[];
    let len = arr.length;
    while (i < len) {
        ret[i] = mutValue(arr[i]);
        i++;
    }
    return ret;
}
export const mutObj = (obj: any) => {
    let ret = {} as any, value;
    for (const k in obj) {
        value = mutValue(obj[k]);
        if (value !== null) ret[k] = value;
    }
    return ret;
}

export function toPathx(path: string | RegExp, isAll: boolean) {
    if (path instanceof RegExp) return { params: null, pathx: path };
    let trgx = /\?|\*|\./;
    if (!trgx.test(path) && isAll === false) {
        let len = (path.match(/\/:/gi) || []).length;
        if (len === 0) return;
        if (len === 1) {
            let arr = path.split('/:');
            if (arr[arr.length - 1].indexOf('/') === -1) return { params: arr[1], key: arr[0] + '/:p', pathx: null };
        }
    };
    let params: any[] | string | null = [], pattern = '', strReg = '/([^/]+?)', strRegQ = '(?:/([^/]+?))?';
    if (trgx.test(path)) {
        let arr = path.split('/'), obj: string | any[], el: string, i = 0;
        arr[0] || arr.shift();
        for (; i < arr.length; i++) {
            obj = arr[i];
            el = obj[0];
            if (el === '*') {
                params.push('wild');
                pattern += '/(.*)';
            } else if (el === ':') {
                let isQuest = obj.indexOf('?') !== -1, isExt = obj.indexOf('.') !== -1;
                if (isQuest && !isExt) pattern += strRegQ;
                else pattern += strReg;
                // if (isExt) pattern += (isQuest ? '?' : '') + '\\' + obj.substring(obj.indexOf('.'));
                if (isExt) {
                    let _ext = obj.substring(obj.indexOf('.'));
                    let _pattern = pattern + (isQuest ? '?' : '') + '\\' + _ext;
                    _pattern = _pattern.replace(strReg + '\\' + _ext, '/([\\w-]+' + _ext + ")");
                    pattern = _pattern;
                }
            } else pattern += '/' + obj;
        };
    } else pattern = path.replace(/\/:[a-z_-]+/gi, strReg);
    let pathx = new RegExp(`^${pattern}/?$`, 'i'), matches = path.match(/\:([a-z_-]+)/gi);
    if (!params.length) params = matches && matches.map((e: string) => e.substring(1));
    else {
        let newArr = matches ? matches.map((e: string) => e.substring(1)) : [];
        params = newArr.concat(params);
    }
    return { params, pathx };
}

export function finalHandler(
    req: HttpRequest,
    next: NextFunction,
    limit: number | string,
    qs_parse: any,
    defaultBody: boolean
) {
    if (defaultBody === false) {
        return next();
    };
    let method = req.method;
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        let header = req.headers;
        if (isTypeBodyPassed(header, JSON_TYPE) ||
            isTypeBodyPassed(header, TEXT_PLAIN_TYPE) ||
            isTypeBodyPassed(header, FORM_URLENCODED_TYPE)) {
            let chunks: Uint8Array[] | Buffer[] = [], error: null = null;
            req.on('data', (buf: Buffer) => {
                let lmt = parsebytes(limit), len = Buffer.byteLength(buf);
                try {
                    if (len > lmt) throw new Error('Body is too large. max limit ' + limit);
                    else chunks.push(buf);
                } catch (err) {
                    error = err;
                }
            }).on('end', () => {
                if (error) return next(error);
                if (!chunks.length) return next();
                let str = Buffer.concat(chunks).toString();
                let body = undefined;
                if (isTypeBodyPassed(header, JSON_TYPE) && !req._body) {
                    try {
                        body = JSON.parse(str);
                        req._body = req._body !== false;
                    } catch (err) {
                        return next(err);
                    }
                } else if (isTypeBodyPassed(header, FORM_URLENCODED_TYPE) && !req._body) {
                    try {
                        body = mutObj(qs_parse(str));
                        req._body = req._body !== false;
                    } catch (err) {
                        return next(err);
                    }
                }
                req.body = body || {};
                next();
            });
        } else next();
    } else next();
}

function parsebytes(arg: string | number) {
    let sizeList: TSizeList = { b: 1, kb: 1 << 10, mb: 1 << 20, gb: 1 << 30, tb: Math.pow(1024, 4), pb: Math.pow(1024, 5) }
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
    str = pathnode.extname(str).substring(1);
    str = str ? str.toLowerCase() : '3rt';
    return types[str] || OCTET_TYPE;
};

const mapEngine: TMapEngine = {
    'handlebars': 'compile',
    'vash': 'compile',
    'nunjucks': 'renderSource',
    'mustache': 'render'
}

export function defaultRenderEngine(obj: TDefaultEngineParam) {
    return function (res: HttpResponse, source: string, ...args: any) {
        let result: any,
            engine = obj.engine,
            name = obj.name,
            header: { [key: string]: any } = {},
            file = fs.readFileSync(source, 'utf8');
        header[CONTENT_TYPE] = res.getHeader(CONTENT_TYPE) || 'text/html; charset=utf-8';
        if (obj.options) args.push(obj.options);
        if (!args.length) args.push({ settings: obj.settings });
        else Object.assign(args[0], { settings: obj.settings });
        if (typeof engine === 'function') {
            engine(source, ...args, (err: Error, out: string) => {
                if (err) throw err;
                let { mtime, size } = fs.statSync(source);
                header["Last-Modified"] = mtime.toUTCString();
                header[CONTENT_LENGTH] = '' + Buffer.byteLength(out);
                if (obj.etag === true) {
                    header["ETag"] = `W/"${size}-${mtime.getTime()}"`;
                    if (getReqHeaders(res)) {
                        let reqHeaders = getReqHeaders(res);
                        if (reqHeaders['if-none-match'] === header["ETag"]) {
                            res.code(304).end();
                            return;
                        }
                    }
                }
                res.set(header).end(out);
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
            let { mtime, size } = fs.statSync(source);
            header[CONTENT_LENGTH] = '' + Buffer.byteLength(result);
            header["Last-Modified"] = mtime.toUTCString();
            if (obj.etag === true) {
                header["ETag"] = `W/"${size}-${mtime.getTime()}"`;
                if (getReqHeaders(res)) {
                    let reqHeaders = getReqHeaders(res);
                    if (reqHeaders['if-none-match'] === header["ETag"]) {
                        res.code(304).end();
                        return;
                    }
                }
            }
            return res.set(header).send(result);
        }

    }

}

export function getReqHeaders(res: HttpResponse) {
    if ((res as any).socket.parser && (res as any).socket.parser.incoming) {
        let { headers } = (res as any).socket.parser.incoming;
        return headers;
    }
    return void 0;
}

export function serializeCookie(
    name: string,
    value: string,
    cookie: Cookie = {},
) {
    if (!SERIALIZE_COOKIE_REGEXP.test(name)) {
        throw new TypeError("name is invalid");
    }
    if (value !== "" && !SERIALIZE_COOKIE_REGEXP.test(value)) {
        throw new TypeError("value is invalid");
    }
    cookie.encode = !!cookie.encode;
    if (cookie.encode) {
        let enc = encoder.encode(value);
        value = Buffer.from(enc.toString()).toString('base64');
    }
    let ret = `${name}=${value}`;

    if (name.startsWith("__Secure")) {
        cookie.secure = true;
    }
    if (name.startsWith("__Host")) {
        cookie.path = "/";
        cookie.secure = true;
        delete cookie.domain;
    }
    if (cookie.secure) {
        ret += `; Secure`;
    }
    if (cookie.httpOnly) {
        ret += `; HttpOnly`;
    }
    if (typeof cookie.maxAge === "number" && Number.isInteger(cookie.maxAge)) {
        ret += `; Max-Age=${cookie.maxAge}`;
    }
    if (cookie.domain) {
        if (!SERIALIZE_COOKIE_REGEXP.test(cookie.domain)) {
            throw new TypeError("domain is invalid");
        }
        ret += `; Domain=${cookie.domain}`;
    }
    if (cookie.sameSite) {
        ret += `; SameSite=${cookie.sameSite}`;
    }
    if (cookie.path) {
        if (!SERIALIZE_COOKIE_REGEXP.test(cookie.path)) {
            throw new TypeError("path is invalid");
        }
        ret += `; Path=${cookie.path}`;
    }
    if (cookie.expires) {
        if (typeof cookie.expires.toUTCString !== "function") {
            throw new TypeError("expires is invalid");
        }
        ret += `; Expires=${cookie.expires.toUTCString()}`;
    }
    if (cookie.other) {
        ret += `; ${cookie.other.join("; ")}`;
    }
    return ret;
}

function tryDecode(str: string) {
    try {
        const dec = Buffer.from(str, 'base64').toString('ascii');
        const uin = Uint8Array.from(dec.split(',') as any);
        return decoder.decode(uin) || str;
    } catch (error) {
        return str;
    }
}

export function getReqCookies(req: HttpRequest, decode?: boolean, i = 0) {
    const str = req.headers['cookie'];
    if (!str) return {};
    const ret = {} as Record<string, string>;
    const arr = str.split(";");
    const len = arr.length;
    while (i < len) {
        const [key, ...oriVal] = arr[i].split("=");
        let val = oriVal.join("=");
        ret[key.trim()] = decode ? tryDecode(val) : val;
        i++;
    }
    return ret;
}

function needPatch(data: any, keys: any, value: any) {
    if (keys.length === 0) {
        return value;
    }
    let key = keys.shift();
    if (!key) {
        data = data || [];
        if (Array.isArray(data)) {
            key = data.length;
        }
    }
    let index = +key;
    if (!isNaN(index)) {
        data = data || [];
        key = index;
    }
    data = data || {};
    let val = needPatch(data[key], keys, value);
    data[key] = val;
    return data;
}

function myParse(arr: any[]) {
    let obj = arr.reduce((red: any, [field, value]: any) => {
        if (red.hasOwnProperty(field)) {
            if (Array.isArray(red[field])) {
                red[field] = [...red[field], value];
            } else {
                red[field] = [red[field], value];
            }
        } else {
            let [_, prefix, keys] = field.match(/^([^\[]+)((?:\[[^\]]*\])*)/);
            if (keys) {
                keys = Array.from(keys.matchAll(/\[([^\]]*)\]/g), (m: any) => m[1]);
                value = needPatch(red[prefix], keys, value);
            }
            red[prefix] = value;
        }
        return red;
    }, {});
    return obj;
}

export function parseQuery(query: string) {
    if (query === null) return {};
    let data = new URLSearchParams("?" + query);
    return myParse(Array.from(data.entries()));
}
