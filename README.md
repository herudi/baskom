# Baskom js

[![npm version](https://img.shields.io/badge/npm-0.2.5-blue.svg)](https://npmjs.org/package/baskom) 
[![License](https://img.shields.io/:license-mit-blue.svg)](http://badges.mit-license.org)
[![download-url](https://img.shields.io/npm/dm/baskom.svg)](https://npmjs.org/package/baskom)

Fast and fun nodejs framework with easy to use.
> Try with 1000+ route, your app still fast with baskom. [benchmark](https://github.com/herudi/baskom/tree/main/benchmark)

## Features

- Small (just ~40kb installed).
- Robust routing.
- Support middleware like express (you can use express middleware like multer, body-parser,  express-validator, serve-static and many more).
- Support popular template engine (ejs, handlebars, pug, jsx and more).
- Support custom server for (ssr framework) [Nextjs](https://nextjs.org/), [Nuxtjs](https://nuxtjs.org/), [Sapper](https://sapper.svelte.dev/) and more. [See Example](https://github.com/herudi/baskom/tree/master/example)

## Requerement
Nodejs v6.x or higher

## Installation

```bash
$ npm i baskom
//or
$ yarn add baskom
```

## Usage
```js

const baskom = require('baskom');

const app = baskom();

app.get('/user', _ => 'baskom');
app.post('/user', (req) => ({ body: req.body }));

// or

app.get('/user2', (req, res) => {
    res.send('baskom');
});
app.post('/user2', (req, res) => {
    res.json({ body: req.body });
});

app.listen(3000, () => {
    console.log('> Running on ' + 3000);
});
    
```
METHODS => GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, ALL.
```js
app[METHODS](path, ...handlers);
```
Using Response (http.ServerResponse)
```js
// send text
res.send('test');
// send json
res.send({ name: 'test' });
// send json
res.json({ name: 'test' });
// send with status code
res.code(201).send('Created');
// same send status code
res.status(201).send('Created');
// send html
res.type('html').send('<h1>Home</h1>');
// send file
res.sendFile(__dirname + '/test.png');
res.sendFile(pathfile, cache?);
// download
res.download(__dirname + '/test.txt');
// redirect
res.redirect('/something');
// render view engine
res.render('test', {
    name: 'yourname'
});
res.header({
    'Content-Type': 'text/html',
    'More': 'more'
});
res.set('Content-Type', 'text/html');
res.get('Content-Type');
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

function mid1(req, res, next){
    req.foo = 'foo';
    next();
}

function mid2(req, res, next){
    req.bar = 'bar';
    next();
}

const app = baskom();

app.use(mid1);

app.get('/foobar', mid2, (req, res) => {
    return `${req.foo} ${req.bar}`;
});

app.listen(3000, () => {
    console.log('> Running on ' + 3000);
});
```
Middleware role : 
```js
...
app.use(mid1, mid2);
app.use([mid1, mid2]);
app[METHODS](path, mid1, mid2, handler);
app[METHODS](path, [mid1, mid2], handler);
...
```

## Example Using Config

```js

const baskom = require('baskom');
const low = require('low-http-server');
const qs = require('qs');

const app = baskom({
    useServer: low({}),             /* default native http server node */
    useParseQueryString: qs.parse,  /* default native parse querystring node */
    useDebugError: true,            /* default false */
    useBodyLimit: '1mb',            /* default '1mb' */
    useDefaultBody: true,           /* default true (if using express body-parser please set to false) */
    useServerTimeout: 3000          /* number value timeout server */
});
...

```

## Router
Simple Router
```js

const baskom = require('baskom');

const app = baskom();
const router = baskom.router();

router.get('/user/:name', (req, res) => {
    return { name: req.params.name };
});

app.use('/api/v1', router);

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
        this.get('/user/:name', (req, res) => {
            return { name: req.params.name };
        })
    }
}

module.exports = new UserRoute();

...

// index.js
app.use('/api/v1', UserRoute);

```
Router role :
```js
// single router
app.use(router);
// multi router
app.use([router, router2]);
// single router + middleware
app.use(mid1, mid2, router);
// multi router + middleware
app.use(mid1, mid2, [router, router2]);
// single router with prefix path
app.use(path, router);
// multi router with prefix path
app.use(path, [router, router2]);
// single router with prefix path + middleware
app.use(path, mid1, mid2, router);
// multi router with prefix path + middleware
app.use(path, mid1, mid2, [router, router2]);

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
app.use('*', (req, res, next) => {
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
> Note : If multiple engine please give extension on res.render.

[See example template engine](https://github.com/herudi/baskom/tree/master/example/using-template-engine)

```js
const baskom = require('baskom');

const app = baskom();

// simple
app.use({ engine: 'ejs' });
// no cache
app.use({ engine: 'ejs', cache: false });
// using extension
app.use({ engine: 'handlebars', ext: '.hbs' });
// with express-react-views
app.use({ engine: require('express-react-views').createEngine(), ext: '.jsx' });
// or custom render
app.use({
    engine: 'dustjs-linkedin',
    ext: '.dust',
    render: (res, source, ...args) => {
        let file = fs.readFileSync(source, 'utf8');
        require('dustjs-linkedin').renderSource(file.toString(), ...args, (err, html) => {
            if (err) throw new Error('err render');
            res.type('text/html').send(html);
        });
    }
});

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
### Template Engine Role
```js
app.use({
    engine: 'ejs',    /* engine module name  */
    ext: '.ejs',      /* extension of engine template (optional). */
    cache: false,     /* simple cache (default true) */
    render: fn(),     /* custom render */
    basedir: 'views', /* default in folder views */
    name: 'ejs',      /* if engine declare require('ejs'), name is required */
})
```

## Using Simple Cluster
```js
const baskom = require('baskom');
const app = baskom();

app.get('/test-cluster', (req, res) => {
    return 'test';
});

app.withCluster(() => {
    app.listen(3000)
});

// or
// app.withCluster({ numCPUs: 8 }, () => {
//     app.listen(3000)
// });

```

## Serve Static Assets
Must install serve-static or sirv (example using serve-static)
```bash
npm i serve-static
// or
yarn add serve-static
```
```js
const baskom = require('baskom');
const serveStatic = require('serve-static');

baskom()
    // in folder public or whatever
    .use('/assets', serveStatic('public'))
    // static assets available => http://localhost:3000/assets/yourfile.ext
    .listen(3000, () => {
        console.log('Running ' + 3000);
    });
```

## What Next ?
[See example](https://github.com/herudi/baskom/tree/master/example)

## License

[MIT](LICENSE)

