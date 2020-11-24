const express = require('express');

express()
    .get('/', (req, res) => {
        res.send('Base');
    })
    .get('/json/:name', (req, res) => {
        res.send({ name: req.params.name });
    })
    .get('/hello', (req, res) => {
        res.send('hello');
    })
    .listen(3000);