module.exports = {
    createProduct: `
    INSERT INTO products (name, price)
    VALUES ($1, $2)
    RETURNING *
  `,
    updateProduct: `
    UPDATE products
    SET name = $1, price = $2
    WHERE id = $3
    RETURNING *
  `,
    deleteProduct: 'DELETE FROM products WHERE id = $1',
    getProductById: 'SELECT * FROM products WHERE id = $1'
};