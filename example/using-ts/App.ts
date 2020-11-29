import * as baskom from 'baskom';
import Application from 'baskom/lib/application';
import UserController from './UserController';
import { Request, Response, Runner } from 'baskom/lib/types';

export default class App {
    private app: Application;
    constructor() {
        this.app = baskom();
        this.app.use('/api/v1', this.middleware, UserController);
    }

    middleware(req: Request, res: Response, run: Runner){
        req.user = 'herudi';
        run();
    }

    public listen(port: number) {
        this.app.listen(port, () => {
            console.log('Running on port ' + port);
        })
    }
}