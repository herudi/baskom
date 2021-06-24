import { IncomingMessage } from "http";


export class HttpRequest extends IncomingMessage {
    _parsedUrl!: {
        _raw: string;
        href: string;
        path: string;
        pathname: string;
        query: string | null;
        search: string | null;
    };
    body!: { [key: string]: any };
    params!: { [key: string]: any };
    query!: { [key: string]: any };
    path!: string;
    search!: string | null;
    originalUrl!: string;
    getCookies!: (decode?: boolean) => Record<string, string>;
    [key: string]: any;
}