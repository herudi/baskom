const baskom = require('baskom');
const fs = require('fs');
const app = baskom();

app.use({
    engine: 'dustjs-linkedin',
    ext: '.dust',
    render(res, source, ...args) {
        let file = fs.readFileSync(source, 'utf8');
        this.engine.renderSource(file.toString(), ...args, (err, html) => {
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

