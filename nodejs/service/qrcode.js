const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());

// QR code generation endpoint
app.get('/api/qrcode', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: 'Missing URL parameter' });

        const qrDataURL = await QRCode.toDataURL(url);
        res.json({ qrCode: qrDataURL });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

module.exports = app;