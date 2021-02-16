import { IncomingMessage, ServerResponse } from "http";

export interface IApp {
    useDebugError?: boolean;
    useBodyLimit?: number | string;
    useParseQueryString?: any;
    useDefaultBody?: boolean;
    useServer?: any;
    useServerTimeout?: number;
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
    code(code: number): this;
    status(code: number): this;
    type(contentType: string): this;
    json(data: { [key: string]: any } | null): void;
    send(data: any): void;
    render(pathfile: string, param: any, option: any): void;
    render(pathfile: string, param: any): void;
    render(pathfile: string, ...args: any): void;
    redirect(path: string): void;
    sendFile(filepath: string, cache?: boolean): void;
    download(filepath: string): void;
    set(name: any, value?: string | number | string[] | number[]): this;
    header(name: any, value?: string | number | string[] | number[]): this;
    get(name: string): void;
    locals: any;
    [key: string]: any;
}

export type NextFunction = (err?: any) => any;

export type THandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => any;

export type TEHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => any;

export type TErrorResponse = {
    statusCode: number;
    name: string;
    message: string;
    debug?: { [key: string]: any } | undefined;
}


