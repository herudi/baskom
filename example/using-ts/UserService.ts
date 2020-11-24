
let UserData: any = () => {
    let data = [
        {
            id: 1,
            name: 'Herudi'
        },
        {
            id: 2,
            name: 'Sahimar'
        },
        {
            id: 3,
            name: 'Eha'
        }
    ];
    return new Promise((resolve, reject) => {
        try {
            resolve(data);
        } catch (error) {
            reject(error);
        }
    })
}

export default class UserService {
    constructor() { }

    async findAll() {
        const data = await UserData();
        return {
            statusCode: 200,
            data
        }
    }

    async findById(id: any) {
        let data: any = await UserData();
        data = data.find((el: any) => el.id === parseInt(id));
        return {
            statusCode: 200,
            data
        }
    }
}