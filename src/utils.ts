import { MIME_TYPES, OCTET_TYPE, JSON_TYPE, TEXT_PLAIN_TYPE, FORM_URLENCODED_TYPE, CONTENT_TYPE } from './constant';
import { parse as parsequery } from 'querystring';
import { Request, Response, NextFunction, TErrorResponse } from './types';
import * as pathnode from 'path';
import { CONTENT_LENGTH } from './constant';
import * as fs from 'fs';
import { createHash } from 'crypto';

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
    cache?: boolean;
    settings: { [key: string]: any };
    options?: { [key: string]: any };
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

function onError(err: any, res: Response, useDebugError: boolean) {
    let obj: any = getError(err, useDebugError);
    return res.code(obj.statusCode).json(obj);
}

export function getError(err: any, useDebugError: boolean = false, req?: Request): TErrorResponse {
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

export function generalError(useDebugError = false) {
    return (err: any, req: Request, res: Response, next: NextFunction) => onError(err, res, useDebugError);
}

export function findBase(pathname: string) {
    let iof = pathname.indexOf('/', 1);
    if (iof !== -1) return pathname.substring(0, iof);
    return pathname;
}

export function getEngine(arg: any) {
    if (arg.cache === void 0) arg.cache = true;
    let defaultDir = pathnode.join(pathnode.dirname((require as any).main.filename || (process as any).mainModule.filename), 'views'),
        ext = arg.ext,
        basedir = pathnode.resolve(arg.basedir || defaultDir),
        render = arg.render;
    if (render === void 0) {
        let engine = (typeof arg.engine === 'string' ? require(arg.engine) : arg.engine);
        if (typeof engine === 'object' && engine.renderFile !== void 0) engine = engine.renderFile;
        let _name = arg.name || (typeof arg.engine === 'string' ? arg.engine : 'html');
        ext = ext || ('.' + _name);
        if (_name === 'nunjucks') engine.configure(basedir, { autoescape: arg.autoescape || true });
        render = defaultRenderEngine({
            engine,
            name: _name,
            cache: arg.cache,
            options: arg.options,
            settings: { views: basedir }
        })
    }
    return { ext, basedir, render };
}

export function modPath(prefix: string) {
    return function (req: Request, res: Response, next: NextFunction) {
        req.url = (req.url as string).substring(prefix.length) || '/';
        req.path = req.path ? req.path.substring(prefix.length) || '/' : '/';
        next();
    }
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
                if (isExt) pattern += (isQuest ? '?' : '') + '\\' + obj.substring(obj.indexOf('.'));
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

export function parseurl(req: Request) {
    let str: any = req.url, url = req._parsedUrl;
    if (url && url._raw === str) return url;
    let pathname = str, query = null, search = null, i = 0, len = str.length;
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

export async function sendPromise(handler: any, res: Response, next: NextFunction, isWrapError: boolean = false) {
    try {
        let ret = await handler;
        if (!ret) return;
        res.send(ret);
    } catch (err) {
        if (isWrapError) onError(err, res, true);
        else next(err);
    }
}

export function wrapError(handler: any) {
    return function (err: Error, req: Request, res: Response, next: NextFunction) {
        let ret: Promise<any>;
        try {
            ret = handler(err, req, res, next);
        } catch (err) {
            onError(err, res, true);
            return;
        }
        if (ret) {
            if (typeof ret.then === 'function') return sendPromise(ret, res, next, true);
            res.send(ret);
        };
    };
};

export function finalHandler(req: Request, res: Response, limit: number | string, qs_parse: any, useDebugError: boolean, defaultBody: boolean, next: (err?: any) => void) {
    if (defaultBody === false) {
        next();
        return;
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
                if (error) return onError(error, res, useDebugError);
                if (!chunks.length) {
                    next();
                    return;
                }
                let urlencode_parse = qs_parse || parsequery,
                    str = Buffer.concat(chunks).toString(),
                    body = undefined;
                if (isTypeBodyPassed(header, JSON_TYPE)) {
                    try {
                        body = JSON.parse(str);
                    } catch (err) {
                        return onError(err, res, useDebugError);
                    }
                }
                else if (isTypeBodyPassed(header, TEXT_PLAIN_TYPE)) body = str;
                else if (isTypeBodyPassed(header, FORM_URLENCODED_TYPE)) {
                    try {
                        body = urlencode_parse(str);
                    } catch (err) {
                        return onError(err, res, useDebugError);
                    }
                }
                req._body = body !== undefined;
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
    return function (res: Response, source: string, ...args: any) {
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
                let code = res.statusCode;
                header[CONTENT_LENGTH] = '' + Buffer.byteLength(out);
                if (obj.cache === true) {
                    let wobj = wrapCacheFile(res, source, out, header);
                    header = wobj.header;
                    code = wobj.code;
                }
                res.writeHead(code, header);
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
            let code = res.statusCode;
            header[CONTENT_LENGTH] = '' + Buffer.byteLength(result);
            if (obj.cache === true) {
                let wobj = wrapCacheFile(res, source, result, header);
                header = wobj.header;
                code = wobj.code;
            }
            res.writeHead(code, header);
            return res.send(result);
        }

    }

}

export function wrapCacheFile(res: Response, file: string, data: string, header: { [key: string]: any }) {
    let isNotMod = false, code = res.statusCode;
    if ((res as any).socket.parser && (res as any).socket.parser.incoming) {
        let { headers } = (res as any).socket.parser.incoming;
        let { mtime } = fs.statSync(file);
        mtime.setMilliseconds(0);
        const mtimeutc = mtime.toUTCString();
        let chash = createHash('sha1')
            .update(data)
            .digest('base64')
            .substring(0, 27);
        header['ETag'] = `W/"${header[CONTENT_LENGTH].toString(16)}-${chash}"`;
        header['Last-Modified'] = mtimeutc;
        isNotMod = fresh(headers,
            {
                "etag": header['ETag'],
                "last-modified": header['Last-Modified'],
            }
        );
    }
    if (isNotMod) {
        res.removeHeader(CONTENT_TYPE);
        res.removeHeader(CONTENT_LENGTH);
        delete header[CONTENT_LENGTH];
        delete header[CONTENT_TYPE];
        code = 304;
    }
    return { header, code };
}


// this function from https://github.com/jshttp/fresh/blob/master/index.js
/*!
 * fresh
 * Copyright(c) 2012 TJ Holowaychuk
 * Copyright(c) 2016-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

function fresh(reqHeaders: { [key: string]: any }, resHeaders: { [key: string]: any }) {
    const modifiedSince = reqHeaders['if-modified-since'];
    const noneMatch = reqHeaders['if-none-match'];
    if (!modifiedSince && !noneMatch) return false;
    let cacheControl = reqHeaders['cache-control'];
    if (cacheControl && /(?:^|,)\s*?no-cache\s*?(?:,|$)/.test(cacheControl)) return false;
    if (noneMatch && noneMatch !== "*") {
        let etag = resHeaders['etag'];
        if (!etag || checkNoMatch(etag, noneMatch)) return false;
    }
    if (modifiedSince) {
        const lastModified = resHeaders['last-modified'];
        if (!lastModified || !(Date.parse(lastModified) <= Date.parse(modifiedSince))) return false;
    }
    return true
}

function checkNoMatch(etag: string, noneMatch: string) {
    let start = 0, end = 0, i = 0, len = noneMatch.length;
    for (; i < len; i++) {
        switch (noneMatch.charCodeAt(i)) {
            case 0x20 /*   */:
                if (start === end) start = end = i + 1;
                break;
            case 0x2c /* , */:
                if (isEtags(etag, noneMatch.substring(start, end))) return false;
                start = end = i + 1;
                break;
            default:
                end = i + 1;
                break;
        }
    }
    if (isEtags(etag, noneMatch.substring(start, end))) return false;
    return true;
}

function isEtags(etag: string, val: string) {
    return val === etag || val === `W/${etag}` || `W/${val}` === etag;
}