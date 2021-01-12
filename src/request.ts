import { Request } from "./types";

function request(req: Request, url: any, params: any, parse: any){
    req.originalUrl = req.originalUrl || req.url;
    req.params = params;
    req.path = url.pathname;
    req.query = parse(url.query);
    req.search = url.search;
}

export default request;