const baskom = require('../../lib');

const app = baskom();

app.use(baskom.body());
// or using option
// app.use(baskom.body({ limit: '100kb' }));

app.post('/user', (req, res) => {
    console.log(req.body);
    res.code = 201;
    return 'User Created';
})

app.listen(3000, () => {
    console.log('Running ' + 3000);
});