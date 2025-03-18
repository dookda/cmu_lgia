const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Pool } = require('pg');
require("dotenv").config();

const app = express();

// Replace these with your actual credentials and secrets.
const LINE_CLIENT_ID = process.env.LINE_CHANNEL_ID;
const LINE_CLIENT_SECRET = process.env.LINE_CHANNEL_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_SECRET = 'your_session_secret';
const REDIRECT_URI = 'http://localhost:3000/auth/line/callback';

console.log('LINE_CLIENT_ID:', process.env.LINE_CHANNEL_ID);

// PostgreSQL connection pool configuration
const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME,
    port: process.env.PG_PORT
});

// Middleware setup.
app.use(cookieParser());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


// Middleware setup.
app.use(cookieParser());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// STEP 1: Redirect user to LINE's authorization endpoint.
app.get('/authen/line', (req, res) => {
    const state = 'some_random_state'; // In production, generate and validate a random state value.
    const scope = encodeURIComponent('profile openid email');
    const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${process.env.LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${scope}`;
    res.redirect(authUrl);
});

// STEP 2 & 3: Handle callback and exchange code for tokens.
app.get('/auth/line/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.redirect('/login.html');
    }

    // Prepare URL-encoded data for token exchange.
    const data = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: process.env.LINE_CHANNEL_ID,
        client_secret: process.env.LINE_CHANNEL_SECRET,
    });

    try {
        // Exchange the authorization code for tokens.
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        });
        const tokenData = await tokenResponse.json();
        console.log('Token response:', tokenData);

        if (!tokenResponse.ok) {
            throw new Error(`Failed to fetch access token: ${tokenResponse.statusText}`);
        }

        console.log('decoded:', tokenData);
        const decoded = jwt.decode(tokenData.id_token);
        const client = await pool.connect();
        let user;

        try {
            const { rows } = await client.query(
                'SELECT * FROM tb_user WHERE userid = $1',
                [decoded.sub]
            );
            if (rows.length > 0) {
                user = rows[0];
            } else {
                // Insert new user into the database.
                const displayName = decoded.name || 'Unknown';
                const email = decoded.email || null;
                const insertQuery = `INSERT INTO tb_user (userid, username, email)
                                    VALUES ($1, $2, $3)
                                    RETURNING * `;
                const result = await client.query(insertQuery, [decoded.sub, displayName, email]);
                user = result.rows[0];
            }
        } finally {
            client.release();
        }

        const appToken = jwt.sign({
            id: user.id,
            line_id: user.line_id,
            displayName: user.display_name,
        }, JWT_SECRET, { expiresIn: '1m' });

        res.cookie('jwt', appToken, { httpOnly: true, secure: false }); // Use secure: true when serving over HTTPS.
        res.redirect('/authen/profile.html');
    } catch (err) {
        console.error('Error during LINE token exchange or DB operation:', err);
        res.redirect('/authen/login.html');
    }
});

function authenticateJWT(req, res, next) {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.redirect('/authen/login.html');
            }
            req.user = decoded;
            next();
        });
    } else {
        res.redirect('/authen/login.html');
    }
}

// Protect the static profile page using JWT verification.
app.get('/authen/profile.html', authenticateJWT, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '/authen/profile.html'));
});

// Logout: Clear the JWT cookie.
app.get('/authen/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/authen/login.html');
});

module.exports = app;
