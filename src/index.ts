import App from "./application";
import Router from "./router";
import { AppOptions } from "./types";
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
}: AppOptions = {}) => new App({ 
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
baskom.Baskom = App;

// Error
baskom.BaskomError = BaskomError;
baskom.BadRequestError = BadRequestError;
baskom.UnauthorizedError = UnauthorizedError;
baskom.ForbiddenError = ForbiddenError;
baskom.NotFoundError = NotFoundError;
baskom.MethodNotAllowedError = MethodNotAllowedError;
baskom.UnprocessableEntityError = UnprocessableEntityError;
baskom.InternalServerError = InternalServerError;

export = baskom;
// export default baskom;