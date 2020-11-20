import { IncomingMessage, ServerResponse } from "http";

export interface IApp {
    useParseUrl?: any;
    useDebugError?: boolean;
    useParseQueryString?: any
}

export interface IReq extends IncomingMessage {
    _body?: boolean;
    _parsedUrl?: any;
    body?: any;
    [key: string]: any;
}

export interface IRes extends ServerResponse {
    json: (data: any) => any;
    code: (code: number) => any;
    send: (data: any, header?: any) => any;
    render: (pathfile: string, ...args: any) => any;
    redirect: (path: string) => any;
    stream: (pathfile: string, mimeType?: string) => any;
    download: (pathfile: string, header?: any) => any;
    [key: string]: any;
}

export interface IRun extends Function {};

export interface IParseBody {
    limit?: string | number;
    qs_parse?: any;
    method?: string;
}

