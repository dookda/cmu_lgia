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

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/');
});

