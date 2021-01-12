import { IncomingMessage, ServerResponse } from "http";

export interface IApp {
    useDebugError?: boolean;
    useBodyLimit?: number | string;
    useParseQueryString?: any;
    useDefaultBody?: boolean;
    useServer?: any;
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
    type(type: string): this;
    json(data: any): void;
    send(data: any): void;
    render(pathfile: string, param: any, option: any): void;
    render(pathfile: string, param: any): void;
    render(pathfile: string, ...args: any): void;
    redirect(path: string): void;
    sendFile(data: any): void;
    download(data: any): void;
    set(name: string, value: string): this;
    get(name: string): void;
    locals: any;
    [key: string]: any;
}

export type NextFunction = (err?: any) => any;

export type TRoutes = {
    params: any[];
    pathx: RegExp;
    handlers: any[];
};

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


