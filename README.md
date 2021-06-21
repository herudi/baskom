# Baskom js

[![npm version](https://img.shields.io/badge/npm-1.0.1-blue.svg)](https://npmjs.org/package/baskom) 
[![License](https://img.shields.io/:license-mit-blue.svg)](http://badges.mit-license.org)
[![download-url](https://img.shields.io/npm/dm/baskom.svg)](https://npmjs.org/package/baskom)

Fun nodejs framework with easy to use.

## Features

- Robust routing.
- Middleware Support.
- Controller decorator support.
- Template engine support (ejs, handlebars, pug, jsx and more).

## Requerement
Nodejs v8.x or higher

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
[See Documentation](https://github.com/herudi/baskom/wiki/Baskom-js)
## License

[MIT](LICENSE)

