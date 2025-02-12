const router = require('express').Router();
const { pool } = require('../database/db');
const userQueries = require('../database/queries/user.queries');
const productQueries = require('../database/queries/product.queries');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require("bcryptjs");

// User Management
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.query(userQueries.getAllUsers);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const{username, password, email,role} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(`INSERT INTO users (username, email, password_hash, role)  VALUES ($1, $2, $3, $4)`, [username, email, hashedPassword,role]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/users/:userId', authenticate, authorize('admin'), async (req, res) => {
    try {
        await pool.query(userQueries.deleteUser, [req.params.userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Product Management
router.post('/products', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name, price } = req.body;
        const result = await pool.query(
            productQueries.createProduct,
            [name, price]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/products/:productId', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name, price } = req.body;
        const result = await pool.query(
            productQueries.updateProduct,
            [name, price, req.params.productId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/products/:productId', authenticate, authorize('admin'), async (req, res) => {
    try {
        await pool.query(productQueries.deleteProduct, [req.params.productId]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/oneTimeSetup', async (req, res) => {
    // If user with role count is 0, create a default admin user
    try {
        const result = await pool.query("SELECT COUNT(id) from users WHERE role='admin' ");
        if (parseInt(result.rows[0]['count']) === 0) {
            const {adminUsername, adminPassword} = req.body;
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await pool.query(`INSERT INTO users (username, email, password_hash, role)  VALUES ($1, $2, $3, 'admin')`, [adminUsername, adminUsername, hashedPassword]);
            res.json({ message: 'Setup complete' });
        } else {
            res.status(403).json({ error: "OneTimeSetup already completed" });
        }
        console.log(result.rows[0]['count'])

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;