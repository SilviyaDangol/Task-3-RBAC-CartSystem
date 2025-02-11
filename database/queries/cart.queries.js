module.exports = {
    getCartByUser: `
    SELECT 
      c.id AS cart_item_id,
      p.id AS product_id,
      p.name,
      p.price,
      c.quantity,
      (p.price * c.quantity) AS total_price
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = $1
  `,

    addToCart: `
    INSERT INTO carts (user_id, product_id, quantity)
    VALUES ($1, $2, $3)
    RETURNING *
  `,

    updateCartItem: `
    UPDATE carts
    SET quantity = $1
    WHERE id = $2 AND user_id = $3
    RETURNING *
  `,

    removeFromCart: `
    DELETE FROM carts
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `,

    clearCart: `
    DELETE FROM carts
    WHERE user_id = $1
  `
};