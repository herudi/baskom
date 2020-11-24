const baskom = require('../../lib');
const ejs = require('ejs');

const app = baskom();

app.use({ engine: ejs, ext: '.ejs' });

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

