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

const queryAsync = (text, params) => {
    return pool.query(text, params);
};

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
app.post('/api/create_table2', async (req, res) => {
    const { division, layername, layertype, columns } = req.body;

    // Validate required fields
    if (!division || !layername || !layertype || !columns || !Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({ message: 'Missing or invalid required fields.' });
    }

    // Validate layertype (must be a valid geometry type)
    const validGeometryTypes = ['POINT', 'LINESTRING', 'POLYGON', 'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON'];
    if (!validGeometryTypes.includes(layertype.toUpperCase())) {
        return res.status(400).json({ message: 'Invalid layer type. Must be a valid geometry type.' });
    }

    const formid = 'fid_' + Date.now();
    console.log('Generated Form ID:', formid);

    try {
        // Insert into layer_name table
        const sqlTable = `
        INSERT INTO layer_name (formid, division, layername, layertype, ts) 
        VALUES ($1, $2, $3, $4, NOW())
      `;
        console.log('Executing query:', sqlTable);
        console.log('Query parameters:', [formid, division, layername, layertype]);
        await queryAsync(sqlTable, [formid, division, layername, layertype]);

        // Create the dynamic table
        const createTable = `
        CREATE TABLE "${formid}" (
          id SERIAL PRIMARY KEY, 
          refid TEXT, 
          geom GEOMETRY(${layertype}, 4326), 
          ts TIMESTAMP DEFAULT NOW(), 
          style TEXT
        )
      `;
        console.log('Executing query:', createTable);
        await queryAsync(createTable);

        // Insert columns into layer_column table and alter the dynamic table
        const insertColumns = [];
        const alterTable = [];

        columns.forEach((column, index) => {
            console.log('Processing column:', column);

            const colId = `${formid}_${index}`;
            const colType = column.column_type === 'file' ? 'TEXT' : column.column_type.toUpperCase(); // Ensure type is uppercase

            // Validate column type (must be a valid SQL type)
            const validColumnTypes = ['TEXT', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATE', 'TIMESTAMP'];
            if (!validColumnTypes.includes(colType)) {
                throw new Error(`Invalid column type: ${colType}`);
            }

            // Insert into layer_column table
            insertColumns.push(
                queryAsync(
                    `INSERT INTO layer_column (formid, col_id, col_name, col_type, col_desc) 
             VALUES ($1, $2, $3, $4, $5)`,
                    [formid, colId, column.name, colType, column.description]
                )
            );

            // Add column to the dynamic table
            alterTable.push(`ADD COLUMN "${colId}" ${colType}`);
        });

        // Execute all column inserts
        await Promise.all(insertColumns);

        // Alter the dynamic table to add columns
        if (alterTable.length > 0) {
            const alterTableQuery = `ALTER TABLE "${formid}" ${alterTable.join(', ')}`;
            console.log('Executing query:', alterTableQuery);
            await queryAsync(alterTableQuery);
        }

        // Return success response
        res.status(200).json({ formid });
    } catch (error) {
        console.error('Error creating table:', error);
        res.status(500).json({ message: 'An error occurred while creating the table.', error: error.message });
    }
});

module.exports = app;