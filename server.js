const express = require('express');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const cartRoutes = require('./routes/cart');
const{authenticate, authorize} = require('./middleware/auth');
const { initializeDatabase } = require('./database/db');
require('dotenv').config();


initializeDatabase().then(() => {
    console.log('Database ready');
});

const app = express();
app.use(express.json());

//Routes
app.use('/auth', authRoutes);
app.use('/admin', authenticate, authorize('admin'), adminRoutes);
app.use('/users', userRoutes)
app.use('/cart',authenticate, cartRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Listening on port: " + PORT));