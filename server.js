const express = require('express');
const cors = require('cors');



const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const cartRoutes = require('./routes/cart');
const{authenticate, authorize} = require('./middleware/auth');
const { initializeDatabase } = require('./database/db');
const { logger } = require('./helpers/logger.js');
require('dotenv').config();

console.log(typeof logger)
initializeDatabase().then(() => {
    logger.debug('Initializing database...');
});

const app = express();
app.use(express.json());
app.use(cors());
//Routes
app.use('/auth', authRoutes);
app.use('/admin', authenticate, authorize('admin'), adminRoutes);
app.use('/users', userRoutes)
app.use('/cart',authenticate, cartRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Listening on port: " + PORT));