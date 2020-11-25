import App from "./application";
import Router from "./router";
import { IApp } from "./types";

const baskom = ({ useParseQueryString, useParseUrl, useDebugError }: IApp = {}) => new App({ useParseQueryString, useParseUrl, useDebugError });
baskom.router = () => new Router();
baskom.Router = Router;
baskom.body = ({ limit }: { limit?: string | number } = {}) => baskom().parseBody({ limit });
baskom.wrap = (fn: any) => baskom().wrapFn(fn);
export = baskom;
// export default baskom;