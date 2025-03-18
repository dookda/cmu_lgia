const express = require('express');
const querystring = require('querystring');
const session = require('express-session');
const { Pool } = require('pg');

const app = express();

// Configuration
const config = {
    channelId: process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    callbackUrl: 'http://localhost:3000/auth/line/callback',
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


function ensureAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/authen/?error=login_required');
    }
    next();
}

async function upsertUser(userProfile) {
    const query = `
        INSERT INTO tb_user (userid, username, picture_url, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (userid)
        DO UPDATE SET
            username = EXCLUDED.username,
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

        await upsertUser(userProfile);

        req.session.user = {
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl
        };

        res.redirect('/authen/profile.html');
    } catch (error) {
        console.error('Authentication error:', error.message);
        res.redirect('/authen/?error=auth_failed');
    }
});

app.get('/auth/profile', ensureAuthenticated, (req, res) => {
    res.json({
        success: true,
        user: req.session.user
    });
});

// Products API endpoint (example data)
app.get('/auth/products', ensureAuthenticated, (req, res) => {
    const products = [
        { id: 1, name: 'Product A', price: 10.99 },
        { id: 2, name: 'Product B', price: 20.49 },
        { id: 3, name: 'Product C', price: 15.00 }
    ];
    res.json({
        success: true,
        products: products
    });
});

// Logout route
app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/authen');
});

app.get('/auth/debug-session', (req, res) => {
    res.json(req.session);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
});

module.exports = app;