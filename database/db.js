const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});
create_user_table =` CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL, 
            password_hash VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) DEFAULT 'user'
        )`
create_product_table = `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

create_cart_table = `CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )`

create_refreshToken_table  = ` CREATE TABLE IF NOT EXISTS refresh_tokens(
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) on DELETE CASCADE,
            token_hash VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            revoked BOOLEAN DEFAULT false
        )`
create_user_id_index = `
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
        ON refresh_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_carts_user_id
        ON carts(user_id)
        `
async function initializeDatabase(){
    try{
        // create table if not exists
        await pool.query(create_user_table)
        await pool.query(create_product_table )
        await pool.query(create_refreshToken_table)
        await pool.query(create_cart_table )
        await pool.query(create_user_id_index )

        console.log('Database initialized successfully.')
    } catch(err){
        console.error('Database initialized failed',err)
    }
}
// unNecessary right now but still
setInterval(async () => {
    try{
        await pool.query(`
        DELETE FROM  refresh_tokens
        WHERE expires_at < NOW()    OR  revoked = true
        `)
        console.log("Token cleanup succesful")
    }catch(err){
        console.error('Token cleanup failed:', err);
    }
}, 360000000)
module.exports = {pool, initializeDatabase};