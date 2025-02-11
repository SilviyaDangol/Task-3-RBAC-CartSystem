const router = require('express').Router();
const { pool } = require('../database/db');
const userQueries = require('../database/queries/user.queries');
const { authenticate } = require('../middleware/auth');

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update current user profile
router.put('/me', authenticate, async (req, res) => {
    try {
        const { email } = req.body;
        const result = await pool.query(
            userQueries.updateUserEmail,
            [email, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;