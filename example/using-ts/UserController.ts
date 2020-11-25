import UserService from "./UserService";
import { Request, Response } from 'baskom/lib/types';
import { Router } from 'baskom';

const service = new UserService();
class UserController extends Router {
    constructor() {
        super();
        this.get('/user', (req: Request, res: Response) => {
            console.log(req.user);
            return service.findAll();
        })

        this.get('/user/:id', (req: Request, res: Response) => {
            return service.findById(req.params.id);
        })
    }
}

export default new UserController();