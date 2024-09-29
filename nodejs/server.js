const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// static files
app.use('/', express.static('www'));

// api
app.use(require('./service/api'));

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/');
});