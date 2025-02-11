const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../database/db');
const authQueries = require('../database/queries/auth.queries');
const userQueries = require('../database/queries/user.queries');
const { sendResetEmail } = require('../utils/email');
const { logger } = require('../helpers/logger');

// Helper function to generate tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' } // Default to 15 minutes
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    return { accessToken, refreshToken, refreshTokenHash };
};

// Helper function to validate email format
const isValidEmail = (email) => {
    return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Registration
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if username or email already exists
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

        // Hash password and create user
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
        logger.info('User registered successfully.');
    } catch (err) {
        logger.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username
        const user = await pool.query(userQueries.findUserByUsername, [username]);
        if (!user.rows.length || !(await bcrypt.compare(password, user.rows[0].password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens and store refresh token
        const { accessToken, refreshToken, refreshTokenHash } = generateTokens(user.rows[0]);
        await pool.query(
            authQueries.createRefreshToken,
            [user.rows[0].id, refreshTokenHash, process.env.JWT_REFRESH_EXPIRES_IN || '7d']
        );

        res.json({ accessToken, refreshToken, expiresIn: 900 }); // 900 seconds = 15 minutes
    } catch (err) {
        logger.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        // Hash the refresh token and find it in the database
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const storedToken = await pool.query(authQueries.findRefreshToken, [refreshTokenHash]);

        // Validate refresh token
        if (!storedToken.rows.length || new Date(storedToken.rows[0].expires_at) < new Date()) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Generate new tokens and revoke the old refresh token
        const { accessToken, refreshToken: newRefreshToken, refreshTokenHash: newHash } =
            generateTokens(storedToken.rows[0]);

        await pool.query('BEGIN');
        await pool.query(authQueries.revokeRefreshToken, [refreshTokenHash]);
        await pool.query(
            authQueries.createRefreshToken,
            [storedToken.rows[0].id, newHash, process.env.JWT_REFRESH_EXPIRES_IN || '7d']
        );
        await pool.query('COMMIT');

        res.json({ accessToken, refreshToken: newRefreshToken, expiresIn: 900 });
    } catch (err) {
        await pool.query('ROLLBACK');
        logger.error('Refresh token error:', err);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        // Revoke the refresh token
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await pool.query(authQueries.revokeRefreshToken, [refreshTokenHash]);

        res.json({ message: 'Successfully logged out' });
    } catch (err) {
        logger.error('Logout error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body;

        // Find user by username
        const user = await pool.query(userQueries.findUserByUsername, [username]);
        if (user.rows.length) {
            // Revoke all user tokens and generate a reset token
            await pool.query(authQueries.revokeAllUserTokens, [user.rows[0].id]);
            const resetToken = jwt.sign(
                { email: user.rows[0].email },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            // Send reset email
            await sendResetEmail(user.rows[0].email, resetToken);
        }

        res.json({ message: 'If the username exists, a reset link has been sent to its associated email' });
    } catch (err) {
        logger.error('Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Verify the reset token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await pool.query(userQueries.findUserByEmail, [decoded.email]);

        if (!user.rows.length) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        // Hash the new password and update the user
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(userQueries.updateUserPassword, [hashedPassword, decoded.email]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        logger.error('Reset password error:', err);
        res.status(500).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router;