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

const queryAsync = (text, params) => {
    return pool.query(text, params);
};

app.post('/api/v2/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        const { division, layername, layertype } = req.body;
        await parseAndInsertData(req.file.path, division, layername, layertype);

        res.send('File is being processed.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

const parseAndInsertData = async (filePath, division, layername, layertype) => {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    })
        .then(results => insertDataIntoDB(results, division, layername, layertype))
        .catch(error => { throw error; });
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
        const isLatitude = ['ละติจูด', 'lattitude', 'lat'].includes(columnName);
        const isLongitude = ['ลองจิจูด', 'longitude', 'long'].includes(columnName);
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
                const value = row[key];
                return columns.find(c => c.column_id === cId).column_type === 'numeric' && (value === '' || value == null) ? 0 : value;
            });
            return `('${refids[rowIndex]}', ${values.map(v => `'${v}'`).join(', ')})`;
        });

        await queryAsync(
            `INSERT INTO ${formid} (refid, ${columnIds.join(', ')}) VALUES ${valuesToInsert.join(', ')}`
        );

        const doColumnsExist = await checkColumnsExist(formid, ['lat', 'lng']);
        if (doColumnsExist) {
            const { rows } = await queryAsync(`SELECT * FROM ${formid} WHERE lat > 0 AND lng > 0`);
            if (rows.length > 0) {
                await queryAsync(`UPDATE ${formid} SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326) WHERE lat > 0 AND lng > 0`);
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

// Get all divisions
app.get("/api/v2/divisions", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, division_name, created_at FROM divisions ORDER BY id ASC");
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
            "INSERT INTO divisions (division_name) VALUES ($1) RETURNING *",
            [division_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete a division by ID
app.delete("/api/v2/divisions/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("DELETE FROM divisions WHERE id = $1 RETURNING *", [id]);

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
        const sql = `SELECT *, ST_AsGeoJSON(geom) as geojson FROM ${formid} ORDER BY ts DESC`;
        const { rows } = await pool.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

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

module.exports = app;