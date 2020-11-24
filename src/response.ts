import { TYPE, JSON_CHARSET, OCTET_TYPE, CONTENT_LENGTH } from './constant';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from './types';
import { STATUS_CODES } from 'http';

function res(res: Response, template: any) {
    res.code = (code: number) => {
        res.statusCode = code;
        return this;
    }
    res.type = (type: string) => {
        res.setHeader(TYPE, type);
        return this;
    }
    res.json = (data: any) => {
        let code = res.statusCode || 200;
        data = JSON.stringify(data);
        res.writeHead(code, {
            [TYPE]: JSON_CHARSET,
            [CONTENT_LENGTH]: Buffer.byteLength(data)
        });
        res.end(data);
    };
    res.send = (data: any) => {
        if (typeof data === 'string') res.end(data);
        else if (typeof data === 'object') res.json(data);
        else res.end(data || STATUS_CODES[res.statusCode]);
    };
    res.sendFile = (data: any) => {
        res.setHeader(TYPE, res.getHeader(TYPE) || OCTET_TYPE);
        if (typeof data === 'string') {
            let fStream = fs.createReadStream(data);
            fStream.pipe(res);
        } else {
            data.pipe(res);
        }
    };
    res.redirect = (path: string) => {
        let code = res.statusCode === 200 ? 302 : res.statusCode;
        res.writeHead(code, { 'Location': path });
        res.end();
    };
    res.download = (data: any) => {
        let content = 'content-disposition';
        if (typeof data === 'string') {
            res.setHeader(content, res.getHeader(content) || 'attachment; filename=' + path.basename(data))
            let fStream = fs.createReadStream(data);
            fStream.pipe(res);
        } else {
            res.setHeader(content, res.getHeader(content) || 'attachment; filename=no-content-disposition.txt');
            data.pipe(res);
        }
    };
    if (template) {
        res.render = (pathfile: string, ...args: any) => {
            let obj = template;
            pathfile = path.extname(pathfile) !== '' ? pathfile : pathfile + obj.ext;
            if (obj.basedir !== '' || obj.basedir !== null) {
                pathfile = obj.basedir + '/' + pathfile;
            }
            return obj.render(res, pathfile, ...args);
        };
    }
}

export default res;
