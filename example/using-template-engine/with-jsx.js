const baskom = require('baskom');
const app = baskom();

app.use({ engine: require('express-react-views').createEngine(), ext: '.jsx' });

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

