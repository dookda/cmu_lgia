// server.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL configuration
const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME,
    port: process.env.PG_PORT
});

// UTM to Lat/Lng conversion endpoint
app.post('/geoapi/latlng2utm', async (req, res) => {
    try {
        const { easting, northing, zone, hemisphere } = req.body;

        // Validate input
        if (!easting || !northing || !zone || !hemisphere) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Determine SRID based on UTM zone and hemisphere
        const hemispherePrefix = hemisphere.toUpperCase() === 'S' ? 327 : 326;
        const srid = hemispherePrefix * 100 + parseInt(zone);

        // PostGIS query
        const query = ` SELECT 
            ST_X(ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), $3), 4326)) AS lon,
            ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), $3), 4326)) AS lat
        `;

        const { rows } = await pool.query(query, [easting, northing, srid]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Conversion failed' });
        }

        res.json({
            easting: parseFloat(easting),
            northing: parseFloat(northing),
            longitude: parseFloat(rows[0].lon),
            latitude: parseFloat(rows[0].lat)
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app;