# Baskom js

[![npm version](https://img.shields.io/badge/npm-0.0.13-blue.svg)](https://npmjs.org/package/baskom) 
[![License](https://img.shields.io/:license-mit-blue.svg)](http://badges.mit-license.org)
[![download-url](https://img.shields.io/npm/dm/baskom.svg)](https://npmjs.org/package/baskom)

The fun nodejs web framework with focus in speed, easy to use and low overhead.
> Inspired by [Express](https://github.com/expressjs/express) and [Polka](https://github.com/lukeed/polka)

## Features

- The Fast (60% faster than Express) [See Benchmark](https://github.com/herudi/baskom/tree/master/benchmark)
- Small (just ~50kb installed with low dependencies).
- Simple and easy to use.
- Express like and LOVE (you can use express middleware style like express-validator, multer and many more).

## Installation

```bash
$ npm install baskom
//or
$ yarn add baskom
```

## Simple Usage
```js

const baskom = require('baskom');

baskom()
    .get('/simple', (req, res) => {
        return 'horayy';
    })
    .get('/send', (req, res) => {
        res.send('horayy');
    })
    .get('/json', (req, res) => {
        res.json({ name: 'herudi' });
    })
    .listen(3000);
    
```

## Usage

```js

const baskom = require('baskom');

baskom()
    .get('/with-status', (req, res) => {
        res.code(201);
        // or
        // res.status(201);
        return 'with-status 201';
    })
    .get('/with-json', (req, res) => {
        return { name: 'herudi' };
    })
    .get('/with-param/:name', (req, res) => {
        return 'name ' + req.params.name;
    })
    .get('/with-async', async (req, res) => {
        let users = await model.findAllUser();
        return { statusCode: 200, data: users };
    })
    .get('/with-promise', (req, res) => {
        return new Promise((resolve, reject) => {
            try {
                resolve("ok");
            } catch (error) {
                reject(error);
            }
        });
    })
    .post('/with-post', (req, res) => {
        console.log(req.body);
        res.code(201);
        return 'Created';
    })
    .get('/with-res', (req, res) => {
        // send text
        res.send('test');
        // send json
        res.send({ name: 'test' });
        // send with status code
        res.code(201).send('Created');
        // send html
        res.type('text/html').send('<h1>Home</h1>');

        // send file stream
        res.sendFile(__dirname + '/test.html');

        // send json
        res.json({ name: 'test' });

        // download
        res.download(__dirname + '/test.txt');

        // redirect
        res.redirect('/something');

        // render view engine
        res.render('test', {
            name: 'yourname'
        });
    })
    .listen(3000, () => {
        console.log('Running ' + 3000);
    });

```
Method available => GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, CONNECT, TRACE, ALL.

For typescript see [example using ts](https://github.com/herudi/baskom/tree/master/example/using-ts)
## Middleware
```js

const baskom = require('baskom');

function foo(req, res, run){
    req.foo = 'foo';
    run();
}

function bar(req, res, run){
    req.bar = 'bar';
    run();
}

baskom()
    .use(foo)
    .get('/baskom', bar, (req, res) => {
        console.log(req.foo)
        console.log(req.bar)
        return 'Horrayy'
    })
    .get('/other', [mid1, mid2], (req, res) => {
        return 'Horrayy'
    })
    .listen(3000, () => {
        console.log('Running ' + 3000);
    });

```

## Body Parser
### baskom, has a built-in body parser by default.

```js

const baskom = require('baskom');

const app = baskom();
// or
// const app = baskom({
//     useBodyLimit: '100kb'
// });

app.post('/user', async (req, res) => {
    await saveUser(req.body);
    res.code(201);
    return 'User Created';
})

app.listen(3000, () => {
    console.log('Running ' + 3000);
});

```

### Using library body parser
use to install 
```bash
npm i body-parser
// or
yarn add body-parser
```
```js

const baskom = require('baskom');
const bodyParser = require('body-parser');

const app = baskom({
    // must set to false
    useDefaultBody: false
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.post('/user', async (req, res) => {
    await saveUser(req.body);
    res.code(201);
    return 'User Created';
})

app.listen(3000, () => {
    console.log('Running ' + 3000);
});

```

## Router
Simple Router
```js

const baskom = require('baskom');

const app = baskom();
const router = baskom.router();

router.get('/test', _ => {
    return { name: 'no name' }
});

router.get('/test/:name', (req, res) => {
    return { name: req.params.name }
});

app.use('/api/v1', router);
// or
// app.use('/api/v1', middleware, router);
// or
// app.use('/api/v1', middleware, [router, router2]);
// or
// app.use(router);

app.listen(3000, () => {
    console.log('Running ' + 3000);
});

```
Example Router Inherit
```js

// UserRoute.js
const { Router } = require('baskom');
class UserRoute extends Router {
    constructor(){
        this.get('/user', (req, res) => {
            return { name: 'user' };
        })
    }
}

module.exports = new UserRoute();

// index.js
app.use('/api/v1', UserRoute);
// or
// app.use('/api/v1', middleware, UserRoute);
// or
// app.use('/api/v1', middleware, [UserRoute, UserRoute2]);
// or
// app.use(UserRoute);

```

## Error Handling

```js
const baskom = require('baskom');

const app = baskom();

// baskom also safe without try and catch block
app.get('/user', (req, res) => {
    let data = findUser();
    if (!data) {
        throw new baskom.NotFoundError('Data Not Found');
    }
    return 'Success';
});

// if you want using try and catch block
app.get('/user2', (req, res) => {
    try {
        let data = findUser();
        if (!data) {
            throw new baskom.NotFoundError('Data Not Found');
        }
        return 'Success';
    } catch(err){
        // your logic if error here
        throw err;
    }
});

// Error Handling
app.use((err, req, res) => {
    res.code(err.code || 500);
    return err.message;
})

// Not Found Route Error Handling
app.use('*', (req, res, run) => {
    res.code(404);
    return 'Url Not found';
})

app.listen(3000, () => {
    console.log('Running ' + 3000);
});

```

## Custom Throw Error
```js

const { BaskomError } = require('baskom');

class PaymentRequiredError extends BaskomError {
    getCode() { return 402 };
    getName() { return 'PaymentRequiredError' };
}

module.exports = PaymentRequiredError;

// usage example
...

if (!payment) {
    throw new PaymentRequiredError('Payment Required Error');
}

...
```

## Template Engine
Example with ejs
```bash
npm install ejs --save
// or
yarn add ejs
```
```js
const baskom = require('baskom');
const ejs = require('ejs');

const app = baskom();

app.use({ engine: ejs, ext: '.ejs' });
// or custom
// app.use({ 
//     engine: ejs, 
//     ext: '.ejs',
//     basedir: 'views',
//     render: (res, filename, ...args) => {
//         ejs.renderFile(filename, ...args, (err, html) => {
//             if (err) throw new Error(err.message || 'Error View Something Went Wrong');
//             res.end(html);
//         });
//     }
// });

app.get('/hello', (req, res) => {
    res.render('hello', {
        name: 'John Doe'
    });
});
app.get('/test', (req, res) => {
    res.render('test');
});

app.get('/redirect', (req, res) => {
    res.redirect('/hello');
});
app.listen(3000, () => {
    console.log('Running ' + 3000);
});
```

## Static Serve Assets
Must install serve-static
```bash
npm install serve-static --save
// or
yarn add serve-static
```
```js
const baskom = require('baskom');
const serveStatic = require('serve-static');

baskom()
    // in folder public or whatever
    // static assets available => http://localhost:3000/assets/yourfile.css
    .use('/assets', serveStatic('public'))
    .get('/hello', async (req, res) => {
        return { name: 'hello' };
    })
    .listen(3000, () => {
        console.log('Running ' + 3000);
    });
```

## What Next ?
[See full documentation](https://github.com/herudi/baskom/wiki/baskom-doc)
<br>
[See example](https://github.com/herudi/baskom/tree/master/example)

## License

[MIT](LICENSE)

