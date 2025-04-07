const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// static files
app.use(express.static(path.join(__dirname, 'www')));

console.log('Static files served from:', path.join(__dirname, 'www'));


// api
app.use(require('./service/api'));
app.use(require('./service/apiv2'));
app.use(require('./service/authen'));
app.use(require('./service/qrcode'));
app.use(require('./service/geoapi'));

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'www/v2/register/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'www/v2/login/index.html'));
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/');
});

