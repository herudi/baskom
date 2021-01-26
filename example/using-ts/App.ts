import { Application } from 'baskom';
import UserController from './UserController';
import { Request, Response, NextFunction } from 'baskom/lib/types';

export default class App extends Application {
    constructor() {
        super();
        this.use('/api/v1', this.middleware, UserController);
    }

    middleware(req: Request, res: Response, next: NextFunction) {
        req.user = 'herudi';
        next();
    }
}