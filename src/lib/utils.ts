import { TYPE } from './constant';
import { IRes, IRun, IReq } from '../types';

export function isTypeBodyPassed(header: any, _type) {
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
    return (err: any, req: IReq, res: IRes, run: IRun) => {
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
    if (iof !== -1) {
        return path.substring(0, iof);
    }
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

export function asyncWrapFn(handler: any) {
    return async (req: IReq, res: IRes, run: IRun) => {
        try {
            let fn = await handler(req, res, run);
            if (typeof fn === 'string') {
                res.end(fn);
            } else if (typeof fn === 'object') {
                res.json(fn);
            } else {
                return fn;
            }
        } catch (err) {
            run(err);
        }
    };
}

export function wrapFn(handler: any) {
    return (req: IReq, res: IRes, run: IRun) => {
        try {
            let fn = handler(req, res, run);
            if (typeof fn === 'string') {
                res.end(fn);
            } else if (!!fn && typeof fn.then === 'function') {
                return asyncWrapFn(fn);
            } else if (typeof fn === 'object') {
                res.json(fn);
            } else {
                return fn;
            }
        } catch (err) {
            run(err);
        }
    };
}

export function wrap(fn: any) {
    const isAsync = fn.constructor.name === "AsyncFunction";
    return isAsync ? asyncWrapFn(fn) : wrapFn(fn);
}

export function asyncWrapErrorFn(handler: any) {
    return async (err: any, req: IReq, res: IRes, run: IRun) => {
        try {
            let fn = await handler(err, req, res, run);
            res.statusCode = res.code || err.code || err.status || err.statusCode || 500;
            if (typeof fn === 'string') {
                res.end(fn);
            } else if (typeof fn === 'object') {
                res.json(fn);
            } else {
                return fn;
            }
        } catch (err) {
            run(err);
        }
    };
}

export function wrapErrorFn(handler: any) {
    return (err: any, req: IReq, res: IRes, run: IRun) => {
        try {
            let fn = handler(err, req, res, run);
            res.statusCode = res.code || err.code || err.status || err.statusCode || 500;
            if (typeof fn === 'string') {
                res.end(fn);
            } else if (!!fn && typeof fn.then === 'function') {
                return asyncWrapErrorFn(fn);
            } else if (typeof fn === 'object') {
                res.json(fn);
            } else {
                return fn;
            }
        } catch (err) {
            run(err);
        }
    };
}

export function wrapError(fn: any) {
    const isAsync = fn.constructor.name === "AsyncFunction";
    return isAsync ? asyncWrapErrorFn(fn) : wrapErrorFn(fn);
}