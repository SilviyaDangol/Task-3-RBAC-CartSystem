createRefreshToken =    `
INSERT INTO refresh_tokens
(user_id,token_hash,expires_at)
VALUES($1,$2,NOW() + $3)
RETURNING *
`
findRefreshToken =  `
    SELECT users.*, refresh_tokens.expires_at
    FROM refresh_tokens
    JOIN users ON users.id = refresh_tokens.user_id
    WHERE token_hash = $1 AND revoked = false
`
revokeRefreshToken =  `
    UPDATE refresh_tokens
    SET revoked = true
    WHERE token_hash = $1
`
revokeAllUserTokens =  `
    UPDATE refresh_tokens
    SET revoked = true
    WHERE user_id = $1
`
module.exports = {createRefreshToken,
    findRefreshToken, revokeRefreshToken,
    revokeAllUserTokens,}