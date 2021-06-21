import App from "./application";
import Router from "./router";
import { 
    Controller, 
    Get, 
    Post, 
    Wares, 
    Header, 
    Put,
    All,
    Delete,
    Head,
    Inject,
    Patch,
    Status,
    Options,
    addControllers
} from "./controllers";
import { IApp } from "./types";
import { 
    BadRequestError, 
    UnprocessableEntityError, 
    BaskomError, 
    ForbiddenError, 
    UnauthorizedError, 
    NotFoundError, 
    MethodNotAllowedError, 
    InternalServerError 
} from './error';

const baskom = ({ 
    useServer, 
    useServerTimeout, 
    useParseQueryString, 
    useDebugError, 
    useBodyLimit, 
    useDefaultBody 
}: IApp = {}) => new App({ 
    useServer, 
    useParseQueryString, 
    useDebugError, 
    useBodyLimit, 
    useDefaultBody, 
    useServerTimeout 
});
baskom.router = () => new Router();
baskom.Router = Router;
baskom.Application = App;

// Error
baskom.BaskomError = BaskomError;
baskom.BadRequestError = BadRequestError;
baskom.UnauthorizedError = UnauthorizedError;
baskom.ForbiddenError = ForbiddenError;
baskom.NotFoundError = NotFoundError;
baskom.MethodNotAllowedError = MethodNotAllowedError;
baskom.UnprocessableEntityError = UnprocessableEntityError;
baskom.InternalServerError = InternalServerError;

// decorators
baskom.Controller = Controller;
baskom.Get = Get;
baskom.Post = Post;
baskom.Wares = Wares;
baskom.Header = Header;
baskom.Put = Put;
baskom.All = All;
baskom.Delete = Delete;
baskom.Head = Head;
baskom.Inject = Inject;
baskom.Patch = Patch;
baskom.Status = Status;
baskom.Options = Options;
baskom.addControllers = addControllers;

export = baskom;
// export default baskom;