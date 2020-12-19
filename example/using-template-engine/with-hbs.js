const baskom = require('baskom');
const { readFileSync } = require('fs');

const app = baskom();
app.use({ 
    engine: 'handlebars', 
    ext: '.hbs',
    options: {
        partials: {
            footer: () => {
                let file = readFileSync('views/footer.html');
                return file.toString()
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

