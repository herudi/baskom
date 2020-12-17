import * as path from 'path';
import * as fs from 'fs';
import { STATUS_CODES } from "http";
import { JSON_CHARSET, OCTET_TYPE, TYPE } from "./constant";
import { Response } from './types';
import { getMimeType } from './utils';

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
        this.setHeader(TYPE, type);
        return this;
    };
    res.json = function (data: any) {
        data = JSON.stringify(data);
        this.setHeader(TYPE, JSON_CHARSET);
        this.end(data);
    };
    res.send = function (data: any) {
        if (typeof data === 'string') this.end(data);
        else if (typeof data === 'object') this.json(data);
        else this.end(data || STATUS_CODES[this.statusCode]);
    };
    res.sendFile = function (data: any) {
        if (typeof data === 'string') {
            this.setHeader(TYPE, this.getHeader(TYPE) || getMimeType(data));
            let fStream = fs.createReadStream(data);
            fStream.pipe(this);
        } else {
            this.setHeader(TYPE, this.getHeader(TYPE) || OCTET_TYPE);
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
    res.render = function (pathfile, ...args) {
        let idx = pathfile.indexOf('.');
        let obj: any = {};
        if (idx !== -1) {
            let ext = pathfile.substring(idx);
            obj = engine[ext];
        } else {
            obj = engine[Object.keys(engine)[0]];
        }
        pathfile = path.extname(pathfile) !== '' ? pathfile : pathfile + obj.ext;
        if (obj.basedir !== '' || obj.basedir !== null) {
            pathfile = obj.basedir + '/' + pathfile;
        }
        return obj.render(res, pathfile, ...args);
    };
}
export default response;