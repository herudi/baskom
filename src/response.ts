import * as path from 'path';
import * as fs from 'fs';
import { STATUS_CODES } from "http";
import { OCTET_TYPE, CONTENT_LENGTH, CONTENT_TYPE, JSON_TYPE, CHARSET, MIME_TYPES } from "./constant";
import { Response } from './types';
import { getMimeType } from './utils';

function _send(res: Response, data: string, contentType: string) {
    if (res._header) {
        res.end(data);
        return;
    }
    let header: { [key: string]: string } = {}, code = res.statusCode;
    header[CONTENT_TYPE] = contentType;
    header[CONTENT_LENGTH] = '' + Buffer.byteLength(data);
    res.writeHead(code, header);
    res.end(data);
}

function response(res: Response, engine: any) {
    res.code = function (code: number) {
        this.statusCode = code;
        return this;
    };
    res.status = function (code: number) {
        this.statusCode = code;
        return this;
    };
    res.type = function (type: string) {
        this.setHeader(CONTENT_TYPE, MIME_TYPES[type] || type);
        return this;
    };
    res.header = function (name: any, value?: string | number | string[] | number[]) {
        if (typeof name === "object") {
            for (let key in name) this.header(key, name[key]);
            return this;
        };
        value = Array.isArray(value) ? (value as string[]).map(String) : value;
        this.setHeader(name, value as string | string[]);
        return this;
    }
    res.set = function (name: any, value?: string | number | string[] | number[]) {
        this.header(name, value);
        return this;
    };
    res.get = function (name: string) {
        return this.getHeader(name);
    };
    res.json = function (data: { [key: string]: any }) {
        _send(this, JSON.stringify(data), JSON_TYPE + CHARSET);
    };
    res.send = function (data: any) {
        if (typeof data === 'string') this.end(data);
        else if (typeof data.pipe === 'function') {
            this.setHeader(CONTENT_TYPE, this.getHeader(CONTENT_TYPE) || OCTET_TYPE);
            data.pipe(this);
        }
        else if (Buffer.isBuffer(data)) this.type((this.getHeader(CONTENT_TYPE) || 'bin') as string).end(data);
        else if (typeof data === 'object') this.json(data);
        else res.end(data || STATUS_CODES[this.statusCode]);
    };
    res.sendFile = function (filepath: string) {
        this.setHeader(CONTENT_TYPE, this.getHeader(CONTENT_TYPE) || getMimeType(filepath));
        let fStream = fs.createReadStream(filepath);
        fStream.pipe(this);
    };
    res.redirect = function (path: string) {
        let code = this.statusCode === 200 ? 302 : this.statusCode;
        this.writeHead(code, { 'Location': path });
        this.end();
    };
    res.download = function (filepath: string) {
        let content = 'content-disposition';
        this.setHeader(content, this.getHeader(content) || 'attachment; filename=' + path.basename(filepath))
        let fStream = fs.createReadStream(filepath);
        fStream.pipe(this);
    };
    res.render = function (source: string, ...args: any) {
        let idx = source.indexOf('.'),
            obj: any = engine[Object.keys(engine)[0]],
            pathfile = path.join(obj.basedir, source + obj.ext);
        if (idx !== -1) {
            obj = engine[source.substring(idx)];
            pathfile = path.join(obj.basedir, source);
        }
        return obj.render(res, pathfile, ...args);
    };
}
export default response;