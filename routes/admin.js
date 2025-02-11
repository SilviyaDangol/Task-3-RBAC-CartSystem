const router = require('express').Router();
const { pool } = require('../database/db');
const userQueries = require('../database/queries/user.queries');
const productQueries = require('../database/queries/product.queries');
const { authenticate, authorize } = require('../middleware/auth');

// User Management
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.query(userQueries.getAllUsers);
        res.json(result.rows);
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

module.exports = router;