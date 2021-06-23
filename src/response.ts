import * as path from 'path';
import * as fs from 'fs';
import { STATUS_CODES } from "http";
import { OCTET_TYPE, CONTENT_LENGTH, CONTENT_TYPE, JSON_TYPE, CHARSET, MIME_TYPES } from "./constant";
import { getMimeType, getReqHeaders, serializeCookie } from './utils';
import { HttpResponse } from './types';

function response(res: HttpResponse, engine: any) {
    res.code = function (code) {
        this.statusCode = code;
        return this;
    };
    res.status = function (code) {
        return this.code(code);
    };
    res.type = function (type) {
        this.setHeader(CONTENT_TYPE, MIME_TYPES[type] || type);
        return this;
    };
    res.header = function (name, value) {
        if (typeof name === "object") {
            for (let key in name) {
                this.header(key, name[key]);
            }
            return this;
        };
        value = Array.isArray(value) ? (value as string[]).map(String) : value;
        this.setHeader(name, value as string | string[]);
        return this;
    }
    res.set = function (name, value) {
        this.header(name, value);
        return this;
    };
    res.get = function (name) {
        return this.getHeader(name);
    };
    res.json = function (data) {
        const _data = JSON.stringify(data);
        this.setHeader(CONTENT_TYPE, JSON_TYPE + CHARSET);
        this.setHeader(CONTENT_LENGTH, '' + Buffer.byteLength(_data));
        res.end(_data);
    };
    res.send = function (data) {
        if (typeof data === 'string') {
            this.end(data);
        } else if (typeof data.pipe === 'function') {
            this.setHeader(CONTENT_TYPE, this.getHeader(CONTENT_TYPE) || OCTET_TYPE);
            data.pipe(this);
        } else if (Buffer.isBuffer(data)) {
            this.type((this.getHeader(CONTENT_TYPE) || 'bin') as string).end(data);
        } else if (typeof data === 'object') {
            if (res.___view) {
                return res.render(res.___view, data);
            }
            this.json(data);
        } else {
            res.end(data || STATUS_CODES[this.statusCode]);
        }
    };
    res.sendFile = function (filepath, etag) {
        let header: { [key: string]: any } = {};
        let { size, mtime } = fs.statSync(filepath);
        header[CONTENT_TYPE] = this.getHeader(CONTENT_TYPE) || getMimeType(filepath);
        header[CONTENT_LENGTH] = size;
        header["Last-Modified"] = mtime.toUTCString();
        if (etag === true) {
            header["ETag"] = `W/"${size}-${mtime.getTime()}"`;
            if (getReqHeaders(res)) {
                let reqHeaders = getReqHeaders(res);
                if (reqHeaders['if-none-match'] === header["ETag"]) {
                    return res.status(304).end();
                }
            }
        }
        let fStream = fs.createReadStream(filepath);
        this.set(header);
        fStream.pipe(this);
    };
    res.redirect = function (url, status) {
        this.set("Location", url).code(status || 302).end();
    };
    res.download = function (filepath) {
        let content = 'content-disposition';
        this.setHeader(
            content,
            this.getHeader(content) || 'attachment; filename=' + path.basename(filepath)
        );
        let fStream = fs.createReadStream(filepath);
        fStream.pipe(this);
    };
    res.render = function (source: any, ...args: any) {
        let idx = source.indexOf('.'),
            obj: any = engine[Object.keys(engine)[0]],
            pathfile = path.join(obj.basedir, source + obj.ext);
        if (idx !== -1) {
            obj = engine[source.substring(idx)];
            pathfile = path.join(obj.basedir, source);
        }
        return obj.render(res, pathfile, ...args);
    };
    res.cookie = function (name, value, _opts = {}) {
        _opts.httpOnly = _opts.httpOnly !== false;
        _opts.path = _opts.path || "/";
        if (_opts.maxAge) {
            _opts.expires = new Date(Date.now() + _opts.maxAge);
            _opts.maxAge /= 1000;
        }
        value = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);
        this.setHeader("Set-Cookie", serializeCookie(name, value, _opts));
        return this;
    };
    res.clearCookie = function (name, _opts = {}) {
        _opts.httpOnly = _opts.httpOnly !== false;
        this.setHeader("Set-Cookie", serializeCookie(
            name, "", { ..._opts, expires: new Date(0) }
        ));
    };
}
export default response;