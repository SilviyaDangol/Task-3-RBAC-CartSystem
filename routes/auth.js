const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../database/db');
const authQueries = require('../database/queries/auth.queries');
const userQueries = require('../database/queries/user.queries');
const { sendResetEmail } = require('../utils/email');

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    return { accessToken, refreshToken, refreshTokenHash };
};

// Registration
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!email || email.length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json(
                { error: 'Email is invalid' });
        }


        const [usernameExists, emailExists] = await Promise.all([
            pool.query(userQueries.checkUsernameExists, [username]),
            pool.query(userQueries.checkEmailExists, [email])
        ]);

        if (usernameExists.rows[0].exists) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        if (emailExists.rows[0].exists) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            userQueries.createUser,
            [username, email, hashedPassword]
        );

        res.status(201).json({
            id: result.rows[0].id,
            username: result.rows[0].username,
            email: result.rows[0].email
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await pool.query(userQueries.findUserByUsername, [username]);

        if (!user.rows.length || !(await bcrypt.compare(password, user.rows[0].password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const { accessToken, refreshToken, refreshTokenHash } = generateTokens(user.rows[0]);
        await pool.query(
            authQueries.createRefreshToken,
            [user.rows[0].id, refreshTokenHash, process.env.JWT_REFRESH_EXPIRES_IN]
        );

        res.json({ accessToken, refreshToken, expiresIn: 900 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const storedToken = await pool.query(authQueries.findRefreshToken, [refreshTokenHash]);

        if (!storedToken.rows.length || new Date(storedToken.rows[0].expires_at) < new Date()) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const { accessToken, refreshToken: newRefreshToken, refreshTokenHash: newHash } =
            generateTokens(storedToken.rows[0]);

        await pool.query('BEGIN');
        await pool.query(authQueries.revokeRefreshToken, [refreshTokenHash]);
        await pool.query(
            authQueries.createRefreshToken,
            [storedToken.rows[0].id, newHash, process.env.JWT_REFRESH_EXPIRES_IN]
        );
        await pool.query('COMMIT');

        res.json({ accessToken, refreshToken: newRefreshToken, expiresIn: 900 });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(401).json({ error: err.message });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await pool.query(authQueries.revokeRefreshToken, [refreshTokenHash]);
        res.json({ message: 'Successfully logged out' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await pool.query(userQueries.findUserByUsername, [username]);

        if (user.rows.length) {
            await pool.query(authQueries.revokeAllUserTokens, [user.rows[0].id]);
            const resetToken = jwt.sign(
                { email: user.rows[0].email },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            await sendResetEmail(user.rows[0].email, resetToken);
        }

        res.json({ message: 'If the username exists, a reset link has been sent to its associated email' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await pool.query(userQueries.findUserByEmail, [decoded.email]);
        if (!user.rows.length) return res.status(400).json({ error: 'Invalid token' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(userQueries.updateUserPassword, [hashedPassword, decoded.email]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;