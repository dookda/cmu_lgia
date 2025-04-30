const express = require('express');
const querystring = require('querystring');
const session = require('express-session');
const { Pool } = require('pg');
const app = express();
const path = require('path');

app.use(express.json());

const bcrypt = require('bcryptjs');

// Configuration
const config = {
    channelId: process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    // callbackUrl: 'http://localhost:3000/auth/line/callback',
    callbackUrl: 'http://119.59.103.171:3000/auth/line/callback',
    scope: 'profile openid email'
};

const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME,
    port: process.env.PG_PORT
});

// Middleware
app.use(session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: false
}));

const ensureAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.json({
            success: false,
            message: 'Unauthorized'
        });
    }
    next();
}

const ensureAuthenticatedForPage = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/v2/dashboard');
    }
    next();
}

async function upsertUser(userProfile) {
    const query = `
        INSERT INTO tb_user (userid, displayname, picture_url, auth, created_at, updated_at, ts)
        VALUES ($1, $2, $3, 'user', NOW(), NOW(), NOW())
        ON CONFLICT (userid)
        DO UPDATE SET
            displayname = EXCLUDED.displayname,
            picture_url = EXCLUDED.picture_url,
            updated_at = NOW()
        RETURNING *;
    `;

    const values = [
        userProfile.userId,
        userProfile.displayName,
        userProfile.pictureUrl
    ];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

// Login route
app.get('/auth/login', (req, res) => {
    try {
        const state = Math.random().toString(36).substring(7);
        req.session.state = state;

        const authUrl = 'https://access.line.me/oauth2/v2.1/authorize?' + querystring.stringify({
            response_type: 'code',
            client_id: config.channelId,
            redirect_uri: config.callbackUrl,
            state: state,
            scope: config.scope
        });

        res.redirect(authUrl);

    } catch (error) {
        console.error('Error loading profile:', error);
        res.json({
            success: false,
            message: 'Error loading profile'
        });
    }
});

// Callback route
app.get('/auth/line/callback', async (req, res) => {
    const { code, state } = req.query;

    if (state !== req.session.state) {
        return res.status(401).send('Invalid state parameter');
    }

    try {
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: config.callbackUrl,
                client_id: config.channelId,
                client_secret: config.channelSecret
            })
        });

        if (!tokenResponse.ok) {
            throw new Error('Token exchange failed');
        }

        const { access_token } = await tokenResponse.json();

        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        if (!profileResponse.ok) {
            throw new Error('Profile fetch failed');
        }

        const userProfile = await profileResponse.json();

        const profile = await upsertUser(userProfile);

        const userResult = await pool.query(
            `SELECT * FROM tb_user 
            WHERE userid = $1 
            AND provider = 'line'`,
            [profile.userid]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = userResult.rows[0];

        req.session.user = {
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            auth: profile.auth,
            devision: user.division,
        };

        res.redirect('/v2/dashboard');
    } catch (error) {
        console.error('Authentication error:', error.message);
        res.redirect('/authen/?error=auth_failed');
    }
});

app.get('/auth/profile/:auth', ensureAuthenticated, (req, res) => {
    try {
        const { auth } = req.params;
        const userAuth = req.session.user.auth;

        const rolePermissions = {
            admin: ['admin'],
            editor: ['admin', 'editor']
        };

        const allowedRoles = rolePermissions[auth] || [];
        const isAuthorized = allowedRoles.includes(userAuth);

        res.status(200).json({
            success: true,
            user: req.session.user,
            auth: isAuthorized
        });
    }
    catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading profile'
        });
    }
});

app.get('/auth/profiledetail', ensureAuthenticated, async (req, res) => {
    try {
        const sql = `SELECT userid as userId, displayname as displayName, picture_url as pictureUrl, auth, division FROM tb_user WHERE userid = $1;`;
        const values = [req.session.user.userId];
        const data = await pool.query(sql, values);
        console.log(data.rows[0]);
        res.status(200).json({
            success: true,
            user: data.rows[0]
        });
    }
    catch (error) {
        console.error('Error loading profile:', error);
        res.json({
            success: false,
            message: 'Error loading profile'
        });
    }
});

// Logout route
app.get('/auth/logout', (req, res) => {
    try {
        req.session.destroy();
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Error logging out:', error);
        res.json({
            success: false,
            message: 'Error logging out'
        });
    }
});

app.get('/auth/debug-session', (req, res) => {
    res.json(req.session);
});

app.post('/auth/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    try {
        const checkQuery = `
            SELECT username, email 
            FROM tb_user 
            WHERE username = $1 OR email = $2
        `;
        const checkResult = await pool.query(checkQuery, [username, email]);

        if (checkResult.rows.length > 0) {
            const existingUser = checkResult.rows[0];
            if (existingUser.username === username && existingUser.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Both username and email นี้ถูกใช้แล้ว'
                });
            } else if (existingUser.username === username) {
                return res.status(400).json({
                    success: false,
                    message: 'Username นี้ถูกใช้แล้ว'
                });
            } else if (existingUser.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email นี้ถูกใช้แล้ว'
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userid = `fid_${Date.now()}`;
        const picture_url = './../images/avatar/admin.png'
        const insertQuery = `
            INSERT INTO tb_user 
            (userid, username, displayname, pass, picture_url, email, provider, auth, created_at, updated_at, ts)
            VALUES ($1, $2, $2, $3, $4, $5, 'local', 'user', NOW(), NOW(), NOW())
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [userid, username, hashedPassword, picture_url, email]);

        res.status(201).json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

app.post('/auth/local/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Missing credentials'
        });
    }

    try {
        const userResult = await pool.query(
            `SELECT * FROM tb_user 
            WHERE username = $1 
            AND provider = 'local'`,  // ← THIS IS CRUCIAL
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = userResult.rows[0];

        if (!user.pass) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication method'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.pass);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        req.session.user = {
            userId: user.userid,
            displayName: user.displayname,
            pictureUrl: user.picture_url,
            auth: user.auth,
            division: user.division,
        };

        res.json({
            success: true,
            message: 'Logged in successfully'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, './../www/v2/register/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, './../www/v2/login/index.html'));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
});

module.exports = app;