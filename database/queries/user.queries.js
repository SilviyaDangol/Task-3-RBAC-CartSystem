module.exports = {
    createUser: `
    INSERT INTO users 
    (username, email, password_hash) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `,

    findUserByUsername: `
    SELECT * FROM users 
    WHERE username = $1
  `,

    findUserByEmail: `
    SELECT * FROM users 
    WHERE email = $1
  `,

    updateUserPassword: `
    UPDATE users 
    SET password_hash = $1 
    WHERE email = $2
  `,

    checkUsernameExists: `
    SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)
  `,

    checkEmailExists: `
    SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)
  `
};