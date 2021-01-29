import * as path from 'path';
import * as fs from 'fs';
import { STATUS_CODES } from "http";
import { OCTET_TYPE, CONTENT_LENGTH, CONTENT_TYPE, JSON_TYPE, CHARSET, HTML_TYPE, MIME_TYPES } from "./constant";
import { Response } from './types';
import { getMimeType } from './utils';

function _send(res: Response, data: any, contentType: any) {
    if (res._header) {
        res.end(data);
        return;
    }
    let header = {}, code = res.statusCode;
    header[CONTENT_TYPE] = contentType;
    header[CONTENT_LENGTH] = '' + Buffer.byteLength(data);
    res.writeHead(code, header);
    res.end(data);
}

function response(res: Response, engine: any) {
    res.set = function (name: string, value: string) {
        this.setHeader(name, value);
        return this;
    };
    res.get = function (name: string) {
        return this.getHeader(name);
    };
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
    res.json = function (data: any) {
        data = JSON.stringify(data);
        _send(this, data, JSON_TYPE + CHARSET);
    };
    res.send = function (data: any) {
        if (typeof data === 'string') this.end(data);
        else if (typeof data.pipe === 'function') {
            this.setHeader(CONTENT_TYPE, this.getHeader(CONTENT_TYPE) || OCTET_TYPE);
            data.pipe(this);
        }
        else if (Buffer.isBuffer(data)) this.type(this.getHeader(CONTENT_TYPE) || OCTET_TYPE).end(data);
        else if (typeof data === 'object') this.json(data);
        else res.end(data || STATUS_CODES[this.statusCode]);
    };
    res.sendFile = function (data: any) {
        if (typeof data === 'string') {
            this.setHeader(CONTENT_TYPE, this.getHeader(CONTENT_TYPE) || getMimeType(data));
            let fStream = fs.createReadStream(data);
            fStream.pipe(this);
        } else {
            this.setHeader(CONTENT_TYPE, this.getHeader(CONTENT_TYPE) || OCTET_TYPE);
            data.pipe(this);
        }
    };
    res.redirect = function (path: string) {
        let code = this.statusCode === 200 ? 302 : this.statusCode;
        this.writeHead(code, { 'Location': path });
        this.end();
    };
    res.download = function (data: any) {
        let content = 'content-disposition';
        if (typeof data === 'string') {
            this.setHeader(content, this.getHeader(content) || 'attachment; filename=' + path.basename(data))
            let fStream = fs.createReadStream(data);
            fStream.pipe(this);
        } else {
            this.setHeader(content, this.getHeader(content) || 'attachment; filename=no-content-disposition.txt');
            data.pipe(this);
        }
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