const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');

const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET_KEY = "your_secret_key";

const fs = require('fs');
const csvParser = require('csv-parser');
const xlsx = require('xlsx');

const app = express();
const upload = multer({ dest: 'uploads/' });

const picture = multer({ dest: 'picture/' });

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

function isValidTableName(tableName) {
    return /^[a-zA-Z0-9_]+$/.test(tableName);
}

app.post('/api/v2/uploadpicture', picture.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    // Construct the file URL
    const fileUrl = `/picture/${req.file.filename}`;

    res.json({ success: true, fileUrl });
});

app.post("/api/v2/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const result = await pool.query("SELECT * FROM tb_user WHERE email = $1", [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.pass);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user.id, email: user.email, auth: user.auth }, SECRET_KEY, {
            expiresIn: "1h",
        });

        res.json({ message: "Login successful", token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

const queryAsync = (text, params) => pool.query(text, params);

app.post('/api/v2/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const { division, layername, layertype } = req.body;
        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

        let data;
        if (fileExtension === 'csv') {
            data = await parseCSV(filePath);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            data = await parseExcel(filePath);
        } else {
            return res.status(400).send('Unsupported file type. Only CSV and Excel files are allowed.');
        }

        await insertDataIntoDB(data, division, layername, layertype);

        res.send('File is being processed.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

const parseExcel = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assuming the first sheet is the one to be processed
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
};

const checkColumnsExist = async (tableName, columns) => {
    const { rows } = await queryAsync(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = ANY($2)`,
        [tableName, columns]
    );
    return rows.length === columns.length;
};

const insertDataIntoDB = async (data, division, layername, layertype) => {
    const formid = `fid_${Date.now()}`;
    console.log('Inserting data into DB:', formid, division, layername, layertype);

    const keys = Object.keys(data[0]);
    const columns = keys.map((columnName, index) => {
        const isLatitude = ['lat', 'ละติจูด', 'lattitude', 'lat'].includes(columnName.toLowerCase());
        const isLongitude = ['lng', 'ลองจิจูด', 'longitude', 'long'].includes(columnName.toLowerCase());
        const columnType = isLatitude || isLongitude ? 'numeric' : 'text';
        const columnId = isLatitude ? 'lat' : isLongitude ? 'lng' : `${formid}_${index}`;

        return { column_name: columnName, column_type: columnType, column_id: columnId };
    });

    try {
        await queryAsync(
            `INSERT INTO layer_name (formid, division, layername, layertype, ts) VALUES ($1, $2, $3, $4, now())`,
            [formid, division, layername, layertype]
        );

        await queryAsync(
            `CREATE TABLE ${formid} (id SERIAL PRIMARY KEY, refid text, geom GEOMETRY(${layertype}, 4326), ts timestamp default now(), style text)`
        );

        for (const column of columns) {
            await queryAsync(
                `INSERT INTO layer_column (formid, col_id, col_name, col_type, col_desc) VALUES ($1, $2, $3, $4, $5)`,
                [formid, column.column_id, column.column_name, column.column_type, column.column_name]
            );
            await queryAsync(
                `ALTER TABLE ${formid} ADD COLUMN ${column.column_id} ${column.column_type}`
            );
        }

        const refids = data.map(() => `ref${Date.now()}${Math.random()}`);
        const columnIds = columns.map(c => c.column_id);
        const valuesToInsert = data.map((row, rowIndex) => {
            const values = columnIds.map(cId => {
                const key = Object.keys(row).find(key => columns.find(c => c.column_name === key && c.column_id === cId));
                let value = row[key];

                // Handle latitude and longitude
                if (cId === 'lat' || cId === 'lng') {
                    value = parseFloat(value);
                    if (isNaN(value) || value === 0) {
                        value = null; // Set to NULL if invalid or 0
                    }
                }

                return columns.find(c => c.column_id === cId).column_type === 'numeric' && (value === '' || value == null) ? 0 : value;
            });
            return `('${refids[rowIndex]}', ${values.map(v => v === null ? 'NULL' : `'${v}'`).join(', ')})`;
        });

        await queryAsync(
            `INSERT INTO ${formid} (refid, ${columnIds.join(', ')}) VALUES ${valuesToInsert.join(', ')}`
        );

        const doColumnsExist = await checkColumnsExist(formid, ['lat', 'lng']);
        if (doColumnsExist) {
            const { rows } = await queryAsync(`SELECT * FROM ${formid} WHERE lat IS NOT NULL AND lng IS NOT NULL AND lat != 0 AND lng != 0`);
            if (rows.length > 0) {
                await queryAsync(`UPDATE ${formid} SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326) WHERE lat IS NOT NULL AND lng IS NOT NULL AND lat != 0 AND lng != 0`);
            }
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
};

app.post('/api/v2/create_table', async (req, res) => {
    const { division, layername, layertype, columns } = req.body;
    if (!division || !layername || !layertype || !columns || !Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({ message: 'Missing or invalid required fields.' });
    }
    const validGeometryTypes = ['POINT', 'LINESTRING', 'POLYGON', 'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON'];
    if (!validGeometryTypes.includes(layertype.toUpperCase())) {
        return res.status(400).json({ message: 'Invalid layer type. Must be a valid geometry type.' });
    }
    const formid = 'fid_' + Date.now();

    console.log('Creating table:', formid, division, layername, layertype, columns);

    try {
        const sqlTable = `INSERT INTO layer_name (formid, division, layername, layertype, ts) 
                        VALUES ($1, $2, $3, $4, NOW())`;
        await queryAsync(sqlTable, [formid, division, layername, layertype]);
        const createTable = `CREATE TABLE "${formid}" (
          id SERIAL PRIMARY KEY, 
          refid TEXT, 
          geom GEOMETRY(${layertype}, 4326), 
          ts TIMESTAMP DEFAULT NOW(), 
          style TEXT
        )`;
        await queryAsync(createTable);
        const insertColumns = [];
        const alterTable = [];
        columns.forEach((column, index) => {
            const colId = `${formid}_${index}`;
            const colType = column.column_type === 'file' ? 'TEXT' : column.column_type.toUpperCase();
            const validColumnTypes = ['TEXT', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATE', 'TIMESTAMP'];
            if (!validColumnTypes.includes(colType)) {
                throw new Error(`Invalid column type: ${colType}`);
            }
            insertColumns.push(
                queryAsync(
                    `INSERT INTO layer_column (formid, col_id, col_name, col_type, col_desc) 
                    VALUES ($1, $2, $3, $4, $5)`,
                    [formid, colId, column.column_name, colType, column.column_desc]
                )
            );
            alterTable.push(`ADD COLUMN "${colId}" ${colType}`);
        });
        await Promise.all(insertColumns);
        if (alterTable.length > 0) {
            const alterTableQuery = `ALTER TABLE "${formid}" ${alterTable.join(', ')}`;
            await queryAsync(alterTableQuery);
        }
        res.status(200).json({ formid });
    } catch (error) {
        console.error('Error creating table:', error);
        res.status(500).json({ message: 'An error occurred while creating the table.', error: error.message });
    }
});

app.get('/api/v2/layer_names', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM layer_name');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/v2/layer_names/:gid', async (req, res) => {
    try {
        const gid = parseInt(req.params.gid, 10);
        const { rowCount } = await pool.query(
            'DELETE FROM layer_name WHERE gid = $1',
            [gid]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Get all divisions
app.get("/api/v2/divisions", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, division_name, created_at FROM layer_division ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Add a new division
app.post("/api/v2/divisions", async (req, res) => {
    const { division_name } = req.body;

    if (!division_name) {
        return res.status(400).json({ error: "Division name is required" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO layer_division (division_name) VALUES ($1) RETURNING *",
            [division_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// update division
app.put('/api/v2/divisions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { division_name } = req.body;
        if (!division_name) {
            return res.status(400).json({ error: 'Division name is required' });
        }
        const { rowCount } = await pool.query(
            'UPDATE layer_division SET division_name = $1 WHERE id = $2',
            [division_name, id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Division not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a division by ID
app.delete("/api/v2/divisions/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("DELETE FROM layer_division WHERE id = $1 RETURNING *", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Division not found" });
        }

        res.json({ message: "Division deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});


// Fetch all users
app.get("/api/v2/users", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, email, ts, auth, division FROM tb_user ORDER BY id ASC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Update user
app.put("/api/v2/users/:id", async (req, res) => {
    const { id } = req.params;
    const { username, email, auth, division } = req.body;

    try {
        const result = await pool.query(
            "UPDATE tb_user SET username = $1, email = $2, auth = $3, division = $4 WHERE id = $5 RETURNING *",
            [username, email, auth, division, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User updated successfully", user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete user
app.delete("/api/v2/users/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("DELETE FROM tb_user WHERE id = $1 RETURNING *", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// add user
app.post("/api/v2/users", async (req, res) => {
    const { username, email, password, auth, division } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO tb_user (username, email, pass, ts, auth, division) VALUES ($1, $2, $3, NOW(), $4, $5) RETURNING *",
            [username, email, hashedPassword, auth || "user", division || "N/A"]
        );

        res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/v2/load_layer', async (req, res) => {
    try {
        const { formid } = req.body;
        if (!formid || typeof formid !== 'string') {
            return res.status(400).send('Invalid formid.');
        }

        const columnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 AND column_name != 'geom'
        `;
        const columnsRes = await pool.query(columnsQuery, [formid]);
        const columns = columnsRes.rows.map(row => row.column_name).join(', ');

        const sql = `
            SELECT ${columns}, ST_AsGeoJSON(geom) as geojson 
            FROM ${formid} 
            ORDER BY ts DESC
        `;

        const { rows } = await pool.query(sql);

        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
});

app.get('/api/v2/load_layer/:formid/:refid', async (req, res) => {
    try {
        const { formid, refid } = req.params;
        const columnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 AND column_name != 'geom'
        `;
        const columnsRes = await pool.query(columnsQuery, [formid]);
        const columns = columnsRes.rows.map(row => row.column_name).join(', ');

        const sql = `
            SELECT ${columns}, ST_AsGeoJSON(geom) as geojson 
            FROM ${formid} 
            WHERE refid = $1 
            ORDER BY ts DESC
        `;

        const { rows } = await pool.query(sql, [refid]);

        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
});

app.get('/api/v2/load_layer_description/:formid', async (req, res) => {
    try {
        const { formid } = req.params;
        console.log('formid:', formid);

        const sql = `SELECT * FROM layer_column WHERE formid = $1`;
        const { rows } = await pool.query(sql, [formid]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/v2/update_feature_style', async (req, res) => {
    try {
        const { formid, refid, style } = req.body;

        const sql = `UPDATE ${formid} SET style = $1 WHERE refid = $2`;
        await pool.query(sql, [style, refid]);
        res.status(200).send('Style updated successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while updating the feature style.');
    }
});

app.post('/api/v2/update_layer', async (req, res) => {
    const { formid, changes } = req.body;
    if (!formid || !changes || !Array.isArray(changes)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formid)) {
        return res.status(400).json({ error: 'Invalid table name' });
    }

    try {
        await pool.query('BEGIN');
        for (const change of changes) {
            const { refid, changes: fieldUpdates } = change;
            if (!refid || !fieldUpdates || typeof fieldUpdates !== 'object') {
                throw new Error('Invalid change object: missing refid or changes');
            }

            const updateKeys = Object.keys(fieldUpdates);
            if (updateKeys.length === 0) continue;

            for (const col of updateKeys) {
                if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col)) {
                    throw new Error(`Invalid column name: ${col}`);
                }
            }

            const setClause = updateKeys
                .map((col, idx) => `"${col}" = $${idx + 1}`)
                .join(', ');
            const values = updateKeys.map(col => fieldUpdates[col]);

            values.push(refid);
            const queryText = `UPDATE "${formid}" SET ${setClause} WHERE refid = $${values.length}`;

            await pool.query(queryText, values);
        }

        await pool.query('COMMIT');
        res.status(200).json({ message: 'Layers updated successfully', changes });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating layers:', error);
        res.status(500).json({ error: 'Failed to update layers', details: error.message });
    }
});

app.put('/api/v2/update_feature/:formid/:refid', async (req, res) => {
    const { formid, refid } = req.params;
    const updatedData = req.body;
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formid)) {
        return res.status(400).json({ error: 'Invalid table name' });
    }

    try {
        const cleanedData = {};
        for (const [key, value] of Object.entries(updatedData)) {
            if (value === '') {
                cleanedData[key] = null;
            } else {
                cleanedData[key] = value;
            }
        }

        const setClause = Object.keys(cleanedData)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(', ');

        // Construct the query
        const query = `
            UPDATE ${formid}
            SET ${setClause}
            WHERE refid = $${Object.keys(cleanedData).length + 1}
            RETURNING *
        `;

        // Prepare the values array
        const values = [...Object.values(cleanedData), refid];

        console.log('Generated query:', query);
        console.log('Values:', values);

        // Execute the query
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Feature not found' });
        }

        res.status(200).json({ message: 'Data updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ error: 'Failed to update data' });
    }
});

app.delete('/api/v2/delete_row', async (req, res) => {
    try {
        const { formid, refid } = req.body;
        const sql = `DELETE FROM ${formid} WHERE refid = $1`;
        await pool.query(sql, [refid]);
        res.status(200).json({ message: 'Feature deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while deleting the layer.');
    }
});

app.put('/api/v2/update_feature', async (req, res) => {
    const { formid, refid, geojson, style } = req.body;

    if (!formid || !refid || !geojson) {
        return res.status(400).json({ error: 'Missing required fields: formid, refid, or geojson' });
    }

    if (!isValidTableName(formid)) {
        return res.status(400).json({ error: 'Invalid formid (table name)' });
    }

    try {
        // Update the feature. The geojson string is converted into a PostGIS geometry.
        const query = `
      UPDATE ${formid}
      SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
          style = $2
      WHERE refid = $3
      RETURNING *
    `;
        const values = [geojson, style, refid];

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Feature not found' });
        }

        res.json({
            message: 'Feature updated successfully',
            feature: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating feature:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/v2/delete_feature', async (req, res) => {
    const { formid, refid } = req.body;

    if (!formid || !refid) {
        return res.status(400).json({ error: 'Missing required fields: formid or refid' });
    }

    if (!isValidTableName(formid)) {
        return res.status(400).json({ error: 'Invalid formid (table name)' });
    }

    try {
        const query = `
        DELETE FROM ${formid}
        WHERE refid = $1
        RETURNING *
      `;
        const values = [refid];

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Feature not found' });
        }

        res.json({
            message: 'Feature deleted successfully',
            feature: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting feature:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// create new feature
app.post('/api/v2/create_feature', async (req, res) => {
    const { formid, geojson, style } = req.body;
    const refid = `ref${Date.now()}${Math.random()}`;

    if (!formid || !refid || !geojson) {
        return res.status(400).json({ error: 'Missing required fields: formid, refid, or geojson' });
    }

    if (!isValidTableName(formid)) {
        return res.status(400).json({ error: 'Invalid formid (table name)' });
    }

    try {
        const query = `
      INSERT INTO ${formid} (refid, geom, style)
      VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), $3)
      RETURNING *
    `;
        const values = [refid, geojson, style];

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(500).json({ error: 'Failed to insert feature' });
        }

        res.json({
            message: 'Feature inserted successfully',
            feature: result.rows[0]
        });
    } catch (error) {
        console.error('Error inserting feature:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app;