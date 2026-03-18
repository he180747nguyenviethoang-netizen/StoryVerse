import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for a user
 * @param {Object} payload - Data to include in the token (userId, role, etc.)
 * @returns {string} - Signed JWT token
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Verify a JWT token
 * @param {string} token - Token to verify
 * @returns {Object} - Decoded payload
 */
export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
