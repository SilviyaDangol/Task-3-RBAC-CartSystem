const router = require('express').Router();
const { pool } = require('../database/db');
const cartQueries = require('../database/queries/cart.queries');
const { authenticate } = require('../middleware/auth');

// Get cart contents
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await pool.query(cartQueries.getCartByUser, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add item to cart
router.post('/', authenticate, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        // Verify product exists
        const product = await pool.query(
            'SELECT id FROM products WHERE id = $1',
            [product_id]
        );

        if (!product.rows.length) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Add to cart
        const result = await pool.query(cartQueries.addToCart, [
            req.user.id,
            product_id,
            quantity
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update cart item quantity
router.put('/:itemId', authenticate, async (req, res) => {
    try {
        const { quantity } = req.body;
        const result = await pool.query(cartQueries.updateCartItem, [
            quantity,
            req.params.itemId,
            req.user.id  // Ensures user owns the cart item
        ]);

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove item from cart
router.delete('/:itemId', authenticate, async (req, res) => {
    try {
        await pool.query(cartQueries.removeFromCart, [
            req.params.itemId,
            req.user.id  // Security check
        ]);
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;