const baskom = require('../../lib');
const bodyParser = require('body-parser');

const app = baskom({
    useDefaultBody: false
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
 
// parse application/json
app.use(bodyParser.json());

app.post('/user', (req, res) => {
    console.log(req.body);
    res.code(201);
    return 'User Created';
})

app.listen(3000, () => {
    console.log('Running ' + 3000);
});