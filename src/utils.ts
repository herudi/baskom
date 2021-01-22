import { MIME_TYPES, OCTET_TYPE, TYPE, JSON_TYPE, TEXT_PLAIN_TYPE, FORM_URLENCODED_TYPE } from './constant';
import { parse as parsequery } from 'querystring';
import { Request, Response, NextFunction } from './types';
import * as pathnode from 'path';
import * as fs from 'fs';

function isTypeBodyPassed(header: any, _type: string) {
    return header[TYPE.toLowerCase()] && header[TYPE.toLowerCase()].indexOf(_type) !== -1;
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
    return (err: any, req: Request, res: Response, next: NextFunction) => onError(err, res, useDebugError);
}

export function findBase(pathname: string) {
    let iof = pathname.indexOf('/', 1);
    if (iof !== -1) return pathname.substring(0, iof);
    return pathname;
}

export function getEngine(arg: any) {
    let defaultDir = pathnode.join(pathnode.dirname(require.main.filename || process.mainModule.filename), 'views'),
        _ext = arg.ext,
        _basedir = pathnode.resolve(arg.basedir || defaultDir),
        _render = arg.render;
    if (_render === void 0) {
        let _engine = (typeof arg.engine === 'string' ? require(arg.engine) : arg.engine);
        if (typeof _engine === 'object' && _engine.renderFile !== void 0) _engine = _engine.renderFile;
        let _name = arg.name || (typeof arg.engine === 'string' ? arg.engine : 'html');
        _ext = _ext || ('.' + _name);
        if (_name === 'nunjucks') _engine.configure(_basedir, { autoescape: arg.autoescape || true });
        _render = defaultRenderEngine({
            engine: _engine,
            name: _name,
            options: arg.options,
            header: arg.header || {
                'Content-Type': 'text/html; charset=utf-8'
            },
            settings: {
                views: _basedir,
                ...(arg.set ? arg.set : {})
            }
        })
    }
    return {
        ext: _ext,
        basedir: _basedir,
        render: _render
    };
}

export function modPath(prefix: string) {
    return function (req: Request, res: Response, next: NextFunction) {
        req.url = req.url.substring(prefix.length) || '/';
        req.path = req.path ? req.path.substring(prefix.length) || '/' : '/';
        next();
    }
}

export function toPathx(path: string | RegExp) {
    if (path instanceof RegExp) return { params: null, pathx: path };
    let params = [], pattern = '', strReg = '/([^/]+?)', strRegQ = '(?:/([^/]+?))?';
    if (path.match(/\?|\*|\./gi)) {
        let arr = path.split('/'), obj: string | any[], el: string, i = 0; arr.shift();
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

export async function withPromise(handler: any, res: Response, next: NextFunction, isWrapError: boolean = false) {
    try {
        let fn = await handler;
        if (typeof fn === 'string') res.end(fn);
        else if (typeof fn === 'object') res.json(fn);
        else return fn;
    } catch (err) {
        if (isWrapError) onError(err, res, true);
        else next(err);
    }
}

export function wrapError(handler: any) {
    const isAsync = handler.constructor.name === "AsyncFunction";
    return isAsync ? async function (err: any, req: Request, res: Response, next: NextFunction) {
        try {
            let fn = await handler(err, req, res, next);
            if (fn) {
                if (typeof fn === 'string') res.end(fn);
                else res.json(fn);
            };
        } catch (err) {
            onError(err, res, true);
        }
    } : function (err: any, req: Request, res: Response, next: NextFunction) {
        try {
            let fn = handler(err, req, res, next);
            if (fn) {
                if (typeof fn === 'string') res.end(fn);
                else if (typeof fn.then === 'function') return withPromise(fn, res, next, true);
                else res.json(fn);
            };
        } catch (err) {
            onError(err, res, true);
        }
    };
};

export function finalHandler(req: Request, res: Response, limit: number | string, qs_parse: any, useDebugError: boolean, defaultBody: boolean, method: any, next: (err?: any) => void) {
    if (method === 'GET') next();
    else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        if (!defaultBody) {
            next();
            return;
        };
        let header = req.headers;
        if (isTypeBodyPassed(header, JSON_TYPE) ||
            isTypeBodyPassed(header, TEXT_PLAIN_TYPE) ||
            isTypeBodyPassed(header, FORM_URLENCODED_TYPE)
        ) {
            let chunks = [], error = null;
            req.on('data', (buf: Buffer) => {
                let lmt = parsebytes(limit), len = req.headers['content-length'] || Buffer.byteLength(buf);
                try {
                    if (len > lmt) {
                        throw new Error('Body is too large');
                    } else {
                        chunks.push(buf);
                    }
                } catch (err) {
                    error = err;
                }
            }).on('end', () => {
                if (!chunks.length) {
                    req._body = false;
                    req.body = {};
                    return next();
                }
                if (error) return onError(error, res, useDebugError);
                let urlencode_parse = qs_parse || parsequery, str = Buffer.concat(chunks).toString(), body = null;
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
                req.body = body || {};
                next();
            });
        } else next();
    } else next();
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
    str = pathnode.extname(str).substring(1);
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

