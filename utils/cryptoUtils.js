const crypto = require('crypto');

module.exports = {
  /**
   * Hash a string using SHA-256.
   * @param {string} data - The string to hash.
   * @returns {string} - The hashed string in hexadecimal format.
   */
  hashSHA256: (data) => {
    if (typeof data !== 'string' || data.length === 0) {
      throw new Error('Invalid input. Data must be a non-empty string.');
    }
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  /**
   * Generate a random cryptographic key.
   * @param {number} length - The length of the key in bytes (default: 32).
   * @returns {string} - The generated key in hexadecimal format.
   */
  generateRandomKey: (length = 32) => {
    if (!Number.isInteger(length) || length <= 0) {
      throw new Error('Invalid key length. Length must be a positive integer.');
    }
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Encrypt data using AES-256-CBC.
   * @param {string} data - The plaintext data to encrypt.
   * @param {string} key - The encryption key (32 bytes in hexadecimal format).
   * @param {string} iv - The initialization vector (16 bytes in hexadecimal format).
   * @returns {string} - The encrypted data in base64 format.
   */
  encryptAES256: (data, key, iv) => {
    if (typeof data !== 'string' || data.length === 0) {
      throw new Error('Invalid input. Data must be a non-empty string.');
    }
    if (typeof key !== 'string' || key.length !== 64) {
      throw new Error('Invalid key. Key must be a 32-byte hexadecimal string.');
    }
    if (typeof iv !== 'string' || iv.length !== 32) {
      throw new Error('Invalid IV. IV must be a 16-byte hexadecimal string.');
    }

    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  },

  /**
   * Decrypt data using AES-256-CBC.
   * @param {string} encryptedData - The encrypted data in base64 format.
   * @param {string} key - The decryption key (32 bytes in hexadecimal format).
   * @param {string} iv - The initialization vector (16 bytes in hexadecimal format).
   * @returns {string} - The decrypted plaintext data.
   */
  decryptAES256: (encryptedData, key, iv) => {
    if (typeof encryptedData !== 'string' || encryptedData.length === 0) {
      throw new Error('Invalid input. Encrypted data must be a non-empty string.');
    }
    if (typeof key !== 'string' || key.length !== 64) {
      throw new Error('Invalid key. Key must be a 32-byte hexadecimal string.');
    }
    if (typeof iv !== 'string' || iv.length !== 32) {
      throw new Error('Invalid IV. IV must be a 16-byte hexadecimal string.');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },

  /**
   * Generate a cryptographic HMAC using SHA-256.
   * @param {string} data - The data to hash.
   * @param {string} secret - The secret key for the HMAC.
   * @returns {string} - The HMAC in hexadecimal format.
   */
  generateHMAC: (data, secret) => {
    if (typeof data !== 'string' || data.length === 0) {
      throw new Error('Invalid input. Data must be a non-empty string.');
    }
    if (typeof secret !== 'string' || secret.length === 0) {
      throw new Error('Invalid secret. Secret must be a non-empty string.');
    }
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }
};