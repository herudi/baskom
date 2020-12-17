const baskom = require('baskom');

const app = baskom();
app.use({ 
    engine: 'handlebars', 
    ext: '.hbs',
    options: {
        // testing helper
        helpers: {
            toUpper: function(text) {
                return text.toUpperCase();
            }
        }
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

