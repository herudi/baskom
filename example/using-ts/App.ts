import * as baskom from 'baskom';
import Application from 'baskom/lib/application';
import UserController from './UserController';

export default class App {
    private app: Application;
    constructor() {
        this.app = baskom();
        this.app.use(baskom.body());
        this.app.use('/api/v1', UserController);
    }

    public listen(port: number) {
        this.app.listen(port, () => {
            console.log('Running on port ' + port);
        })
    }
}