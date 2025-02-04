const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const fs = require('fs');
const csvParser = require('csv-parser');
const multer = require('multer');
const { Pool } = require('pg');

const mysql = require('mysql2/promise');

require('dotenv').config();

const pg = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME,
    port: process.env.PG_PORT
});

// connect to mysql
const my = mysql.createPool({
    host: process.env.MY_HOST,
    user: process.env.MY_USER,
    password: process.env.MY_PASSWORD,
    database: process.env.MY_NAME,
    port: process.env.MY_PORT
});

const JWT_SECRET = 'lgiadev';
app.use(bodyParser.json());
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        const { division, layername, layertype } = req.body;
        await parseAndInsertData(req.file.path, division, layername, layertype);

        res.send('File is being processed.');
    } catch (error) {
        console.error(error);
    }

});

const parseAndInsertData = async (filePath, division, layername, layertype) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    await insertDataIntoDB(results, division, layername, layertype);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => reject(error));
    });
};

const queryAsync = (sql) => new Promise((resolve, reject) => {
    pg.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
    });
});

const insertDataIntoDB = async (data, division, layername, layertype) => {
    try {
        const formid = `fid_${Date.now()}`;
        const keys = Object.keys(data[0]);
        const columns = keys.map((columnName, index) => {
            const isLatitude = ['ละติจูด', 'lattitude', 'lat'].includes(columnName);
            const isLongitude = ['ลองจิจูด', 'longitude', 'long'].includes(columnName);
            const columnType = isLatitude || isLongitude ? 'numeric' : 'text';
            const columnId = isLatitude ? 'lat' : isLongitude ? 'lng' : `${formid}_${index}`;

            return { column_name: columnName, column_type: columnType, column_id: columnId };
        });

        await queryAsync(`INSERT INTO layer_name (formid, division, layername, layertype, ts) VALUES ('${formid}', '${division}', '${layername}', '${layertype}', now())`);
        await queryAsync(`CREATE TABLE ${formid} (id SERIAL PRIMARY KEY, refid text, geom GEOMETRY(${layertype}, 4326), ts timestamp default now(), style text)`);

        for (const column of columns) {
            await queryAsync(`INSERT INTO layer_column (formid, col_id, col_name, col_type, col_desc) VALUES ('${formid}', '${column.column_id}', '${column.column_name}', '${column.column_type}', '${column.column_name}')`);
            await queryAsync(`ALTER TABLE ${formid} ADD COLUMN ${column.column_id} ${column.column_type}`);
        }

        const refids = data.map(() => `ref${Date.now()}${Math.random()}`);
        const columnIds = columns.map(c => c.column_id);
        const valuesToInsert = data.map((row, rowIndex) => `('${refids[rowIndex]}', ${columnIds.map(cId => {
            const key = Object.keys(row).find(key => columns.find(c => c.column_name === key && c.column_id === cId));
            const value = row[key];
            return columns.find(c => c.column_id === cId).column_type === 'numeric' && (value === '' || value == null) ? 0 : `'${value}'`;
        }).join(', ')})`);

        await queryAsync(`INSERT INTO ${formid} (refid, ${columnIds.join(', ')}) VALUES ${valuesToInsert.join(', ')}`);

        const doColumnsExist = await checkColumnsExist(formid, ['lat', 'lng']);
        if (doColumnsExist) {
            const { rows } = await queryAsync(`SELECT * FROM ${formid} WHERE lat > 0 AND lng > 0`);
            // console.log(rows);
            if (rows.length > 0) {
                await queryAsync(`UPDATE ${formid} SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326) WHERE lat > 0 AND lng > 0`);
            }
        }
    } catch (err) {
        console.error(err);
    }
};

const checkColumnsExist = async (tableName, columns) => {
    const columnExistenceResults = await Promise.all(columns.map(column => queryAsync(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='${tableName}' AND column_name='${column}')`)));
    return columnExistenceResults.every(result => result.rows[0].exists);
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log(token);
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.post('/api/register', async (req, res) => {
    const { username, email, division, password } = req.body;
    try {
        const sqlCheckUser = 'SELECT username FROM tb_user WHERE username = $1';
        const user = await pg.query(sqlCheckUser, [username]);
        const auth = 'user';

        if (user.rows.length != 0) {
            console.log(user.rows);
            return res.status(200).send('existing user');
        } else {
            console.log('new user');
            const hash = await bcrypt.hash(password, 10);
            const sqlInsertUser = 'INSERT INTO tb_user (username, email, division, pass, auth, ts) VALUES ($1, $2, $3, $4, $5, now())';
            const params = [username, email, division, hash, auth];
            await pg.query(sqlInsertUser, params);
            res.status(201).send('User registered');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const sql = 'SELECT auth, pass, division FROM tb_user WHERE username = $1';
        const result = await pg.query(sql, [username]);
        const data = result.rows[0];
        if (!data) {
            return res.status(400).send('Cannot find user');
        }
        if (await bcrypt.compare(password, data.pass)) {
            const payload = {
                username: username,
            };
            const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ status: 'success', username: username, auth: data.auth, division: data.division, accessToken: accessToken });
        } else {
            res.status(405).send('ชื่อหรือรหัสผ่านไม่ถูกต้อง');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send();
    }
});

app.post('/api/verify_token', authenticateToken, (req, res) => {
    res.status(200).json({
        status: 'success',
        message: "You're accessing a protected route",
        // user: req.user
    });
});

const myQuery = async (sql, params = []) => {
    try {
        const [results,] = await my.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

app.post('/api/get_moo', async (req, res) => {
    try {
        const sql = `SELECT distinct hhmoo, hhban 
        FROM person_household 
        WHERE hhlat is not null AND hhlng is not null
        ORDER by hhmoo`;
        const result = await myQuery(sql, []);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred.');
    }
});

app.post('/api/get_household', async (req, res) => {
    const { hhmoo } = req.body;
    try {
        const sql = `SELECT * 
        FROM person_household 
        WHERE hhmoo = ${hhmoo} AND hhlat is not null AND hhlng is not null`;
        const result = await myQuery(sql, []);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred.');
    }
});

app.post('/api/searchmoohousehold', async (req, res) => {
    const { hhmoo, hhno } = req.body;
    try {
        const sql = `SELECT *
        FROM person_household 
        WHERE hhmoo = ${hhmoo} AND hhno = '${hhno}' AND hhlat is not null AND hhlng is not null`;
        const result = await myQuery(sql, []);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred.');
    }
});

app.post('/api/create_table', async (req, res) => {
    const { division, layername, layertype, columes } = req.body;
    const formid = 'fid_' + Date.now();

    try {
        const sqlTable = `INSERT INTO layer_name (formid, division, layername, layertype, ts) 
                          VALUES ($1, $2, $3, $4, now())`;
        await queryAsync(sqlTable, [formid, division, layername, layertype]);
        const createTable = `CREATE TABLE ${formid} (
                                id SERIAL PRIMARY KEY, 
                                refid TEXT, 
                                geom GEOMETRY(${layertype}, 4326), 
                                ts TIMESTAMP, 
                                style TEXT
                             )`;
        await queryAsync(createTable);
        const insertColumns = [];
        const alterTable = [];

        columes.forEach((column, index) => {
            const colId = `${formid}_${index}`;
            const colType = column.column_type === 'file' ? 'TEXT' : column.column_type;
            insertColumns.push(queryAsync(
                `INSERT INTO layer_column (formid, col_id, col_name, col_type, col_desc) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [formid, colId, column.column_name, column.column_type, column.column_desc]
            ));
            alterTable.push(`ADD COLUMN ${colId} ${colType}`);
        });

        await Promise.all(insertColumns);
        if (alterTable.length) {
            const alterTableQuery = `ALTER TABLE ${formid} ${alterTable.join(', ')}`;
            await queryAsync(alterTableQuery);
        }

        res.status(200).json({ formid });
    } catch (error) {
        console.error('Error creating table:', error);
        res.status(500).send('An error occurred while creating the table.');
    }
});

app.post('/api/get_layer_description', async (req, res) => {
    const { formid } = req.body;

    try {
        const sql = `SELECT * FROM layer_name WHERE formid = '${formid}'`;
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

app.post('/api/load_column_description', async (req, res) => {
    const { formid } = req.body;

    try {
        const sql = `SELECT * FROM layer_column WHERE formid = '${formid}'`;
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

app.post('/api/load_layer', async (req, res) => {
    try {
        const { formid } = req.body;
        const sql = `SELECT *, ST_AsGeoJSON(geom) as geojson FROM ${formid} ORDER BY ts DESC`;
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

app.post('/api/load_layer_by_id', async (req, res) => {
    try {
        const { formid, id } = req.body;
        const sql = `SELECT *, ST_AsGeoJSON(geom) as geojson FROM ${formid} WHERE id = ${id}`;
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

app.post('/api/count_layer_by_formid', async (req, res) => {
    const { formid, groupby, type, col_id } = req.body;

    try {
        let sqlCountDay;
        let sqlCountMonth;
        let sqlCountYear;

        console.log(formid, groupby, type, col_id);

        if (type == 'count') {
            sqlCountDay = `WITH tb(d)as (SELECT date(ts) as d FROM ${formid} )
            SELECT count(d) AS val, d AS dt FROM tb
            GROUP BY d`;

            sqlCountMonth = `WITH tb(d) AS (
                SELECT DATE_TRUNC('month', ts) as d FROM ${formid}
            )
            SELECT COUNT(d) AS val, to_char(d, 'YYYY-MM') AS dt  
            FROM tb
            GROUP BY d
            ORDER BY d ASC`;

            sqlCountYear = `WITH tb(d) AS (
                SELECT DATE_TRUNC('year', ts) as d FROM ${formid}
            )
            SELECT COUNT(d) AS val, d AS dt 
            FROM tb
            GROUP BY d
            ORDER BY d ASC`;
        } else if (type == 'sum') {
            sqlCountDay = `WITH tb(d, dat) as (SELECT date(ts) as d, ${col_id} as dat FROM ${formid} )
            SELECT sum(dat) AS val, d AS dt FROM tb
            GROUP BY d`;

            sqlCountMonth = `WITH tb(d, dat) AS (
                SELECT DATE_TRUNC('month', ts) as d, ${col_id} as dat FROM ${formid}
            )
            SELECT SUM(dat) AS val, to_char(d, 'YYYY-MM') AS dt 
            FROM tb
            GROUP BY d
            ORDER BY d ASC`;

            sqlCountYear = `WITH tb(d, dat) AS (
                SELECT DATE_TRUNC('year', ts) as d, ${col_id} as dat FROM ${formid}
            )
            SELECT SUM(dat) AS val, d AS dt 
            FROM tb
            GROUP BY d
            ORDER BY d ASC`;
        }

        if (groupby == 'day' && groupby != '' && groupby != undefined && groupby != null) {
            const { rows } = await pg.query(sqlCountDay);
            res.status(200).json(rows);
        } else if (groupby == 'month' && groupby != '' && groupby != undefined && groupby != null) {
            const { rows } = await pg.query(sqlCountMonth);
            res.status(200).json(rows);
        } else if (groupby == 'year' && groupby != '' && groupby != undefined && groupby != null) {
            const { rows } = await pg.query(sqlCountYear);
            res.status(200).json(rows);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

app.post('/api/summarize_layer', async (req, res) => {
    const { formid } = req.body;
    try {
        const sql = `SELECT * FROM layer_column WHERE formid = '${formid}'`;
        const result1 = await pg.query(sql);
        const columns = result1.rows.map(row =>
            row.col_type == 'numeric' ? `SUM(${row.col_id}) as ${row.col_id}` : `COUNT(${row.col_id}) as ${row.col_id}`
        ).join(', ');

        const withSql = `WITH tb AS (
                SELECT *, DATE_TRUNC('month', ts) AS d FROM ${formid}
            )
            SELECT  to_char(d, 'YYYY-MM') AS dt, ${columns}
            FROM tb
            GROUP BY d;`;

        const result2 = await pg.query(withSql);
        res.status(200).json(result2.rows);
    } catch (error) {
        console.error(error);
    }
});

app.post('/api/save_layer', async (req, res) => {
    const { formid, geojson, dataarr } = req.body;
    const dataArr = JSON.parse(dataarr);
    const refid = 'ref' + Date.now();

    try {
        const insertSql = `INSERT INTO ${formid} (refid, geom, ts) VALUES ($1, ST_GeomFromGeoJSON($2), now()) RETURNING *`;
        const { rows } = await pg.query(insertSql, [refid, geojson]);

        const updateFields = [];
        const updateValues = [];
        dataArr.forEach((e, idx) => {
            if (e.value.length > 0) {
                updateFields.push(`${e.name} = $${idx + 3}`);
                updateValues.push(e.value === '' ? 0 : e.value);
            }
        });

        if (updateFields.length > 0) {
            const updateSql = `UPDATE ${formid} SET ${updateFields.join(', ')} WHERE refid = $1`;
            await pg.query(updateSql, [refid, ...updateValues]);
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error saving layer data:', error);
        res.status(500).send('An error occurred while saving the layer data.');
    }
});


app.post('/api/update_layer', async (req, res) => {
    const { formid, id, geojson, dataarr } = req.body;
    const dataArr = JSON.parse(dataarr);
    try {
        for (const e of dataArr) {
            if (e.value.length > 0) {
                const updateSql = `UPDATE ${formid} SET ${e.name} = '${e.value == '' ? 0 : e.value}' WHERE id = '${id}'`;
                await pg.query(updateSql);
            }
        }
        res.status(200).json({ status: 'updated' });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

app.post('/api/list_layer', async (req, res) => {
    try {
        const sql = `SELECT * FROM layer_name`;
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

app.post('/api/list_layer_by_division', async (req, res) => {
    const { auth, division } = req.body;
    console.log(auth, division);
    try {
        let sql;
        if (auth == 'admin') {
            sql = `SELECT * FROM layer_name`;
        } else if (auth == 'user') {
            res.status(200).json({ rows: [] });
        } else {
            sql = `SELECT * FROM layer_name WHERE division = '${division}'`;
        }
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

app.post('/api/delete_row', async (req, res) => {
    const { formid, id } = req.body;
    // console.log(formid, id);
    try {
        const sql = `DELETE FROM ${formid} WHERE id = ${id}`;
        await pg.query(sql);
        res.status(200).json({ status: 'deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
});

app.post('/api/delete_layer', async (req, res) => {
    const { formid } = req.body;
    try {
        const sqlLayerName = `DELETE FROM layer_name WHERE formid = '${formid}'`;
        await pg.query(sqlLayerName);

        const sqlLayerColumn = `DELETE FROM layer_column WHERE formid = '${formid}'`;
        await pg.query(sqlLayerColumn);

        const dropTable = `DROP TABLE ${formid}`;
        await pg.query(dropTable);
        res.status(200).json({ status: 'deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
})

app.post('/api/update_style', async (req, res) => {
    const { formid, layerid, layerstyle } = req.body;

    if (!formid || !layerstyle) {
        res.status(400).send('formid and layerstyle are required');
        return;
    }

    try {
        const sql = `UPDATE ${formid} SET style = '${layerstyle}' WHERE id = '${layerid}'`;
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
});

const getLastColumn = async (formid) => {
    const sql = `SELECT col_id FROM layer_column WHERE formid = '${formid}' ORDER BY col_id`;
    const { rows } = await pg.query(sql);
    const ll = rows.map(row => Number(row.col_id.split('_')[2]));
    const max = Math.max(...ll);
    return max + 1;
}

app.post('/api/add_column', async (req, res) => {
    const { formid, col_name, col_type, col_desc } = req.body;
    try {
        const col_id = formid + '_' + await getLastColumn(formid);
        const sql = `INSERT INTO layer_column (formid, col_id, col_name, col_type, col_desc) 
                    VALUES ('${formid}', '${col_id}', '${col_name}', '${col_type}', '${col_desc}')`;
        const { rows } = await pg.query(sql);

        const alterTable = `ALTER TABLE ${formid} ADD COLUMN ${col_id} ${col_type == 'file' ? 'text' : col_type}`;
        await pg.query(alterTable);
        res.status(200).json({ status: 'added' });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }

});

app.post('/api/load_column', async (req, res) => {
    const { formid } = req.body;
    try {
        const sql = `SELECT * FROM layer_column WHERE formid = '${formid}'`;
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
});

app.post('/api/delete_column', async (req, res) => {
    const { formid, col_id } = req.body;
    try {
        const sql = `DELETE FROM layer_column WHERE formid = '${formid}' AND col_id = '${col_id}'`;
        await pg.query(sql);

        const alterTable = `ALTER TABLE ${formid} DROP COLUMN ${col_id}`;
        await pg.query(alterTable);
        res.status(200).json({ status: 'deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
});

app.post('/api/update_column', async (req, res) => {
    try {
        const { col_id, col_name } = req.body;
        const sql = `UPDATE layer_column SET col_name = '${col_name}' WHERE col_id = '${col_id}'`;
        console.log(sql);
        await pg.query(sql);
        res.status(200).json({ status: 'updated' });
    } catch (error) {
        console.error(error);
    }
});

app.get('/api/utm2latlng/:x/:y', async (req, res) => {
    const { x, y } = req.params;
    const sql = `SELECT ST_X(ST_Transform(ST_GeomFromText('POINT(${x} ${y})', 32647), 4326)) as lng,
                ST_Y(ST_Transform(ST_GeomFromText('POINT(${x} ${y})', 32647), 4326)) as lat`;
    const { rows } = await pg.query(sql);
    res.status(200).json(rows[0]);
});

app.post('/api/load_by_column_id', async (req, res) => {
    const { formid, columnid } = req.body;
    try {
        const sql = `SELECT distinct ${columnid} FROM ${formid} `;
        console.log(sql);
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
});

app.post('/api/search', async (req, res) => {
    const { formid, columnid, keyword } = req.body;
    try {
        const sql = `SELECT *, ST_AsGeoJSON(geom) as geojson FROM ${formid} WHERE ${columnid} = '${keyword}'`;
        console.log(sql);
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while getting the selected layer.');
    }
});

app.post('/api/listuser', async (req, res) => {
    try {
        const sql = `SELECT id, username, email, division, auth, TO_CHAR(ts, 'DD-MM-YYYY') as ts FROM tb_user`;
        const { rows } = await pg.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
    }
});

app.post('/api/edituser', async (req, res) => {
    const { id, username, email, division, auth } = req.body;
    try {
        const sql = `UPDATE tb_user SET username = '${username}', email = '${email}', division = '${division}', auth = '${auth}' WHERE id = ${id}`;
        const { rows } = await pg.query(sql);
        res.status(200).json({ status: 'updated' });
    } catch (error) {
        console.error(error);
    }
});

app.post('/api/deleteuser', async (req, res) => {
    const { id } = req.body;
    try {
        const sql = `DELETE FROM tb_user WHERE id = ${id}`;
        await pg.query(sql);
        res.status(200).json({ status: 'deleted' });
    } catch (error) {
        console.error(error);
    }
});

module.exports = app;