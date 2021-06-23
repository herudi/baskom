const baskom = require('baskom');
const app = baskom();

app.use({ engine: 'nunjucks', ext: '.html' });

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

