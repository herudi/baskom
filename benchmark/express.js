const express = require('express');

express()
    .get('/', (req, res) => {
        res.send('Base');
    })
    .get('/json/:name', (req, res) => {
        res.send({ name: req.params.name });
    })
    .get('/hello/:name', (req, res) => {
        res.send('hello ' + req.params.name);
    })
    .listen(3000);