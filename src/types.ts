import { HttpRequest } from './http_request';
import { HttpResponse } from './http_response';

export interface AppOptions {
    useDebugError?: boolean;
    useBodyLimit?: number | string;
    useParseQueryString?: any;
    useDefaultBody?: boolean;
    useServer?: any;
    useServerTimeout?: number;
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


