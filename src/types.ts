import { IncomingMessage, ServerResponse } from "http";

export interface IApp {
    useParseUrl?: any;
    useDebugError?: boolean;
    useParseQueryString?: any
}

export interface Request extends IncomingMessage {
    _body?: boolean;
    _parsedUrl?: any;
    body?: any;
    params?: any;
    query?: any;
    search?: any;
    originalUrl?: any;
    [key: string]: any;
}

export interface Response extends ServerResponse {
    code: (code: number) => Response;
    type: (type: string) => Response;
    json: (data: any) => any;
    send: (data: any) => any;
    render: (pathfile: string, ...args: any) => any;
    redirect: (path: string) => any;
    sendFile: (data: any) => any;
    download: (data: any) => any;
    locals: any;
    [key: string]: any;
}

export interface Runner extends Function {};

export interface IParseBody {
    limit?: string | number;
    qs_parse?: any;
    method?: string;
}

