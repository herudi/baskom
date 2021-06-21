import { IncomingMessage, ServerResponse } from "http";

export interface IApp {
    useDebugError?: boolean;
    useBodyLimit?: number | string;
    useParseQueryString?: any;
    useDefaultBody?: boolean;
    useServer?: any;
    useServerTimeout?: number;
}

export interface HttpRequest extends IncomingMessage {
    _parsedUrl: {
        _raw: string;
        href: string;
        path: string;
        pathname: string;
        query: string | null;
        search: string | null;
    };
    body?: { [key: string]: any };
    params: { [key: string]: any };
    query: { [key: string]: any };
    path: string;
    search: string | null;
    originalUrl: string;
    getCookies: (decode?: boolean) => Record<string, string>;
    [key: string]: any;
}

export interface HttpResponse extends ServerResponse {
    code(status: number): this;
    status(status: number): this;
    type(contentType: string): this;
    json(data: { [key: string]: any } | null): void;
    send(data: any): void;
    render(pathfile: string, param: any, option: any): void;
    render(pathfile: string, param: any): void;
    render(pathfile: string, ...args: any): void;
    redirect(url: string, status?: number): void;
    sendFile(filepath: string, etag?: boolean): void;
    download(filepath: string): void;
    set(name: { [key: string]: any } | string, value?: string | number | string[] | number[]): this;
    header(name: { [key: string]: any } | string, value?: string | number | string[] | number[]): this;
    get(name: string): void;
    locals: any;
    cookie: (name: string, value: any, options?: Cookie) => this;
    clearCookie: (name: string, options?: Cookie) => void;
    [key: string]: any;
}

export type NextFunction = (err?: any) => any;

export type Handler<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
    > = (
        req: Req,
        res: Res,
        next: NextFunction
    ) => any;

export type Handlers<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
    > = Array<Handler<Req, Res> | Handler<Req, Res>[]>;

export type TEHandler = (
    error: Error,
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
) => any;

export type TErrorResponse = {
    statusCode: number;
    name: string;
    message: string;
    debug?: { [key: string]: any } | undefined;
}

export type Cookie = {
    expires?: Date;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    other?: string[];
    encode?: boolean;
};


