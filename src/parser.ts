import { JSON_TYPE, TEXT_PLAIN_TYPE, FORM_URLENCODED_TYPE } from "./constant";
import { isTypeBodyPassed } from "./utils";
import { parse as native_parseurl } from 'url';
import { parse as parsequery } from 'querystring';
import { IParseBody, Request, Response, Runner } from './types';

export function parsebody({ limit, qs_parse }: IParseBody = {}) {
    return function (req: Request, res: Response, run: Runner) {
        let dismethod = 'GET,DELETE';
        let header = req.headers;
        if (dismethod.indexOf(req.method) === -1 && (
            isTypeBodyPassed(header, JSON_TYPE) ||
            isTypeBodyPassed(header, TEXT_PLAIN_TYPE) ||
            isTypeBodyPassed(header, FORM_URLENCODED_TYPE)
        )) {
            let data = [];
            let error = null;
            let lmt = parsebytes(limit || '1mb');
            let urlencode_parse = qs_parse || parsequery;
            req.on('data', (chunk: Buffer) => {
                let len = req.headers['content-length'] || Buffer.byteLength(chunk);
                try {
                    if (len > lmt) {
                        throw new Error('Body is too large');
                    } else {
                        data.push(chunk);
                    }
                }
                catch (err) {
                    error = err;
                }
            }).on('end', () => {
                if (error) {
                    run(error);
                } else {
                    let str = Buffer.concat(data).toString();
                    let body = null;
                    if (isTypeBodyPassed(header, JSON_TYPE)) {
                        body = JSON.parse(str);
                    } else if (isTypeBodyPassed(header, TEXT_PLAIN_TYPE)) {
                        body = str;
                    } else if (isTypeBodyPassed(header, FORM_URLENCODED_TYPE)) {
                        body = urlencode_parse(str);
                    }
                    req._body = true;
                    req.body = body;
                    run();
                }
            });
        }
        else {
            run();
        }

    }
}

function parsebytes(arg: string | number) {
    let sizeList = { b: 1, kb: 1 << 10, mb: 1 << 20, gb: 1 << 30, tb: Math.pow(1024, 4), pb: Math.pow(1024, 5) }
    if (typeof arg === 'number') {
        return arg;
    }
    let arr = (/^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i).exec(arg);
    let val: any;
    let unt = 'b';
    if (!arr) {
        val = parseInt(val, 10);
        unt = 'b';
    } else {
        val = parseFloat(arr[1]);
        unt = arr[4].toLowerCase();
    }
    return Math.floor(sizeList[unt] * val);
}

export function parseurl(req: Request) {
    let url = req.url;
    let parsed = req._parsedUrl;
    if (parsed && parsed._raw === url) return parsed;
    parsed = native_parseurl(url);
    parsed._raw = url;
    return (req._parsedUrl = parsed);
}