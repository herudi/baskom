import UserService from "./UserService";
import { Router } from 'baskom';

const service = new UserService();
class UserController extends Router {
    constructor() {
        super();
        this.get('/user', (req, res) => {
            console.log(req.user);
            return service.findAll();
        })

        this.get('/user/:id', (req, res) => {
            return service.findById(req.params.id);
        })
    }
}

export default new UserController();