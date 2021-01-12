const baskom = require('../../lib');

const app = baskom();

app.get('/user', (req, res) => {
    // findUser is not defined
    findUser();
    return { statusCode: 200, message: 'Success' };
});

app.get('/user/:id', (req, res) => {
    try {
        // findUserId is not defined
        findUserId();
        return { statusCode: 200, message: 'Success' };
    } catch (error) {
        throw error;
    }
});

// Error Handling
app.use((err, req, res) => {
    let code = err.code || err.status || err.statusCode || 500;
    let obj = {
        statusCode: code,
        name: err.name,
        message: err.message
    };
    res.code = code;
    return obj;
})

// Not Found Error Handling
app.use('*', (req, res) => {
    let obj = {
        statusCode: 404,
        name: 'NotFoundError',
        message: 'Not Found'
    };
    res.code = 404;
    return obj;
})

app.listen(3000, () => {
    console.log('Running ' + 3000);
});