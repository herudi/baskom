import * as path from 'path';
import * as fs from 'fs';
import { STATUS_CODES } from "http";
import { CONTENT_LENGTH, JSON_CHARSET, OCTET_TYPE, TYPE } from "./constant";
import { Response } from './types';

function response(res: Response) {
    res.code = function (code: number) {
        this.statusCode = code;
        return this;
    };
    res.type = function (type: string) {
        this.setHeader(TYPE, type);
        return this;
    };
    res.json = function (data: any) {
        let code = this.statusCode || 200;
        data = JSON.stringify(data);
        this.writeHead(code, {
            [TYPE]: JSON_CHARSET,
            [CONTENT_LENGTH]: Buffer.byteLength(data)
        });
        this.end(data);
    };
    res.send = function (data: any) {
        if (typeof data === 'string') this.end(data);
        else if (typeof data === 'object') this.json(data);
        else this.end(data || STATUS_CODES[this.statusCode]);
    };
    res.sendFile = function (data: any) {
        this.setHeader(TYPE, this.getHeader(TYPE) || OCTET_TYPE);
        if (typeof data === 'string') {
            let fStream = fs.createReadStream(data);
            fStream.pipe(this);
        } else {
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
    }
}
export default response;