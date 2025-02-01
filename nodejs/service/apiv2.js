const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME,
    port: process.env.PG_PORT
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database at:', res.rows[0].now);
    }
});

// Endpoint to handle file uploads
app.post('/api/v2/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { filename, path: filepath } = req.file;

    try {
        // Save file information to the database
        const result = await pool.query(
            'INSERT INTO uploaded_files (filename, filepath) VALUES ($1, $2) RETURNING *',
            [filename, filepath]
        );

        // Process the uploaded file (e.g., parse CSV)
        const fileData = fs.readFileSync(filepath, 'utf8');
        console.log('CSV data:', fileData);

        res.json({ message: 'File uploaded and processed successfully.', file: result.rows[0] });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ message: 'Error uploading file.' });
    }
});

// Endpoint to create a new layer
app.post('/api/v2/create-layer', async (req, res) => {
    const { division, layerName, layerType, columns } = req.body;

    if (!division || !layerName || !layerType || !columns) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        // Save the layer to the database
        const layerResult = await pool.query(
            'INSERT INTO layers (division, layer_name, layer_type) VALUES ($1, $2, $3) RETURNING *',
            [division, layerName, layerType]
        );

        const layerId = layerResult.rows[0].id;

        // Save the columns for the layer
        for (const column of columns) {
            await pool.query(
                'INSERT INTO layer_columns (layer_id, column_name, column_type, column_description) VALUES ($1, $2, $3, $4)',
                [layerId, column.name, column.type, column.description]
            );
        }

        res.json({ message: 'Layer created successfully.', layer: layerResult.rows[0] });
    } catch (err) {
        console.error('Error creating layer:', err);
        res.status(500).json({ message: 'Error creating layer.' });
    }
});

module.exports = app;