const jwt = require('jsonwebtoken');

module.exports = {
  /**
   * Generate a JSON Web Token (JWT).
   * @param {object} payload - The payload to include in the token.
   * @param {string} [secret=process.env.JWT_SECRET] - The secret key for signing the token.
   * @param {object} [options={}] - Additional options for the token (e.g., expiresIn).
   * @returns {string} - The generated JWT.
   * @throws {Error} - If the token cannot be generated.
   */
  generateToken: (payload, secret = process.env.JWT_SECRET, options = { expiresIn: '1h' }) => {
    if (!secret) {
      throw new Error('JWT secret is not defined.');
    }
    return jwt.sign(payload, secret, options);
  },

  /**
   * Verify a JSON Web Token (JWT).
   * @param {string} token - The token to verify.
   * @param {string} [secret=process.env.JWT_SECRET] - The secret key for verifying the token.
   * @returns {object} - The decoded payload if the token is valid.
   * @throws {Error} - If the token is invalid or expired.
   */
  verifyToken: (token, secret = process.env.JWT_SECRET) => {
    if (!secret) {
      throw new Error('JWT secret is not defined.');
    }
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      throw new Error(`Invalid or expired token: ${err.message}`);
    }
  },

  /**
   * Decode a JSON Web Token (JWT) without verifying its signature.
   * @param {string} token - The token to decode.
   * @returns {object|null} - The decoded payload or null if the token is invalid.
   */
  decodeToken: (token) => {
    return jwt.decode(token);
  }
};