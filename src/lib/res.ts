import { TYPE, JSON_CHARSET, OCTET_TYPE, TEXT_PLAIN_TYPE, CONTENT_LENGTH } from './constant';
import * as path from 'path';
import * as fs from 'fs';
import { IRes } from '../types';
import { STATUS_CODES } from 'http';

function res(res: IRes, template: any) {
    res.code = function (code: number) {
        res.statusCode = code;
        return this;
    }
    res.send = (data: any, header?: any) => send(res, data, header);
    res.json = (data: any) => json(res, data);
    res.redirect = (path: string) => redirect(res, path);
    res.download = (pathfile: string, header?: any) => download(res, pathfile, header);
    res.stream = (pathfile: string, header?: any) => stream(res, pathfile, header);
    if (template) {
        res.render = (filename: string, ...args: any) => render(res, template, filename, ...args);
    }
}

function cleanHeader(header: any){
    let el = {}, k: string;
    for (k in header) {
        el[k.toLowerCase()] = header[k];
    }
    return el;
}

function download(res: IRes, pathfile: string, header: any = {}) {
    header = cleanHeader(header);
    let code = res.statusCode || 200;
    let strDis = 'Content-Disposition';
    let contentDis = header[strDis] || header[strDis.toLowerCase()];
    header[strDis] = contentDis || 'attachment; filename=' + path.basename(pathfile);
    res.writeHead(code, header)
    let fStream = fs.createReadStream(pathfile);
    fStream.pipe(res);
}

function stream(res: IRes, pathfile: string, header: any = {}) {
    header = cleanHeader(header);
    res.setHeader(TYPE, header[TYPE] || OCTET_TYPE);
    let fStream = fs.createReadStream(pathfile);
    fStream.pipe(res);
}

function render(res: IRes, obj: any, pathfile: string, ...args: any) {
    pathfile = path.extname(pathfile) !== '' ? pathfile : pathfile + obj.ext;
    if (obj.basedir !== '' || obj.basedir !== null) {
        pathfile = obj.basedir + '/' + pathfile;
    }
    return obj.render(res, pathfile, ...args);
}

function redirect(res: IRes, path: string) {
    let code = res.statusCode === 200 ? 302 : res.statusCode;
    res.writeHead(code, { 'Location': path });
    res.end();
}

function json(res: IRes, data: any) {
    let code = res.statusCode || 200;
    data = JSON.stringify(data);
    res.writeHead(code, {
        [TYPE]: JSON_CHARSET,
        [CONTENT_LENGTH]: Buffer.byteLength(data)
    });
    res.end(data);
}

function send(res: IRes, data: any, header: any = {}) {
    header = cleanHeader(header);
    let code = res.statusCode || 200, ctype = header[TYPE] || res.getHeader(TYPE);
    if (typeof data === 'string') {
        ctype = ctype || TEXT_PLAIN_TYPE;
    } else if (typeof data === 'object') {
        data = JSON.stringify(data);
        ctype = JSON_CHARSET;
    } else if (data instanceof Buffer) {
        ctype = ctype || OCTET_TYPE;
    } else {
        data = data || STATUS_CODES[code];
    }
    header[TYPE] = ctype || TEXT_PLAIN_TYPE;
    header[CONTENT_LENGTH] = Buffer.byteLength(data);
    res.writeHead(code, header);
    res.end(data);
}

export default res;
