import baskom from 'baskom';
import Application from 'baskom/lib/application';
import UserController from './UserController';
import { Request, Response, NextFunction } from 'baskom/lib/types';

export default class App {
    private app: Application;
    constructor() {
        this.app = baskom();
        this.app.use('/api/v1', this.middleware, UserController);
    }

    middleware(req: Request, res: Response, next: NextFunction){
        req.user = 'herudi';
        next();
    }

    public listen(port: number) {
        this.app.listen(port, () => {
            console.log('Running on port ' + port);
        })
    }
}