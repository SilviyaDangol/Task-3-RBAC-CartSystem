const jwt = require('jsonwebtoken');
const { pool } = require('../database/db');
const userQueries = require('../database/queries/user.queries');

exports.authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const accessToken = authHeader.split(' ')[1];
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

        const user = await pool.query(userQueries.findUserById, [decoded.userId]);
        if (!user.rows.length) throw new Error('User not found');

        req.user = user.rows[0];
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

exports.authorize = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }
    next();
};