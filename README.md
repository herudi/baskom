# Baskom js

[![npm version](https://img.shields.io/badge/npm-0.1.5-blue.svg)](https://npmjs.org/package/baskom) 
[![License](https://img.shields.io/:license-mit-blue.svg)](http://badges.mit-license.org)
[![download-url](https://img.shields.io/npm/dm/baskom.svg)](https://npmjs.org/package/baskom)

Fast and lightweight nodejs framework with easy to use.
> Inspired by [Express](https://github.com/expressjs/express) and [Polka](https://github.com/lukeed/polka)

## Features

- Fast (50% ~ 60% faster than Express).
- Small (just ~40kb installed).
- Support popular template engine (ejs, handlebars, pug, jsx and more).
- Express like and LOVE (you can use express middleware like multer, express-validator, serve-static and many more).
- Support custom server for (ssr framework) [Nextjs](https://nextjs.org/), [Nuxtjs](https://nuxtjs.org/), [Sapper](https://sapper.svelte.dev/) and more. [See Example](https://github.com/herudi/baskom/tree/master/example)

## Requerement
Nodejs v6.x or higher

## Installation

```bash
$ npm install baskom
//or
$ yarn add baskom
```

## Usage
```js

const baskom = require('baskom');

const app = baskom();

app.get('/simple', (req, res) => {
    return 'test';
});

app.get('/send', (req, res) => {
    res.send('test');
});

app.get('/json', (req, res) => {
    res.json({ name: 'herudi' });
});

app.listen(3000, () => {
    console.log('> Running on ' + 3000);
});
    
```
Method available => GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, CONNECT, TRACE, ALL.
```js
app[METHODS](path, ...handlers);
```
Using Response (http.ServerResponse)
```js
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
// and more
```

Using Request (http.IncomingMessage)
```js
// body
req.body
// query => /path?name=john
req.query
// params => /path/:name/:date
req.params
// other
req.originalUrl
req.search
req._parsedUrl
req._body
// and more
```
For typescript see [example using ts](https://github.com/herudi/baskom/tree/master/example/using-ts)

## Middleware
```js

const baskom = require('baskom');

function mid1(req, res, run){
    req.foo = 'foo';
    run();
}

function mid2(req, res, run){
    req.bar = 'bar';
    run();
}

const app = baskom();

app.use(mid1);

app.get('/simple', mid2, (req, res) => {
    return 'test';
});

app.listen(3000, () => {
    console.log('> Running on ' + 3000);
});
```
Middleware support : 
```js
...
app.use(mid1, mid2);
app.use([mid1, mid2]);
app.[METHODS](path, mid1, mid2, handler);
app.[METHODS](path, [mid1, mid2], handler);
...
```

## Example Using Config

```js

const baskom = require('baskom');
const qs = require('qs');
const parseurl = require('parseurl');

const app = baskom({
    useCluster: true, /* default false or no clustering */
    useParseQueryString: qs.parse,
    useParseUrl: parseurl,
    useDebugError: true,
    useBodyLimit: '1mb',
    useDefaultBody: true
});
...

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
Need to install 
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
app.post('/sign', (req, res) => {
    try {
        let data = authUser();
        if (!data) {
            throw new baskom.UnauthorizedError('Unauthorized 401');
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
    return err.message || 'something';
    // or auto get error
    // return app.getError(err, req, res);
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
Note : If multiple engine please give extension on res.render.

[See example template engine](https://github.com/herudi/baskom/tree/master/example/using-template-engine)

```js
const baskom = require('baskom');

const app = baskom();

app.use({ engine: 'ejs' });
// or
// app.use({ engine: 'handlebars', ext: '.hbs' });
// or
// app.use({ 
//     engine: require('eta').renderFile, 
//     ext: '.eta',
//     set: {
//         'view cache': true
//     }
// });
// or custom
// app.use({
//     engine: 'dustjs-linkedin',
//     ext: '.dust',
//     render: (res, source, ...args) => {
//         let file = fs.readFileSync(source, 'utf8');
//         require('dustjs-linkedin').renderSource(file.toString(), ...args, (err, html) => {
//             if (err) throw new Error('err render');
//             res.type('text/html').send(html);
//         });
//     }
// });

app.get('/hello', (req, res) => {
    res.render('hello', {
        name: 'John Doe'
    });
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

