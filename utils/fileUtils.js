const fs = require('fs');
const path = require('path');

module.exports = {
  /**
   * Check if a file exists.
   * @param {string} filePath - The path to the file.
   * @returns {boolean} - True if the file exists, false otherwise.
   */
  fileExists: (filePath) => {
    return fs.existsSync(filePath);
  },

  /**
   * Read the contents of a file.
   * @param {string} filePath - The path to the file.
   * @param {string} [encoding='utf8'] - The encoding to use when reading the file.
   * @returns {string} - The contents of the file.
   * @throws {Error} - If the file does not exist or cannot be read.
   */
  readFile: (filePath, encoding = 'utf8') => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, encoding);
  },

  /**
   * Write data to a file.
   * @param {string} filePath - The path to the file.
   * @param {string|Buffer} data - The data to write to the file.
   * @param {string} [encoding='utf8'] - The encoding to use when writing the file.
   */
  writeFile: (filePath, data, encoding = 'utf8') => {
    fs.writeFileSync(filePath, data, { encoding });
  },

  /**
   * Delete a file.
   * @param {string} filePath - The path to the file.
   * @throws {Error} - If the file does not exist or cannot be deleted.
   */
  deleteFile: (filePath) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    fs.unlinkSync(filePath);
  },

  /**
   * Get the absolute path of a file.
   * @param {string} relativePath - The relative path to the file.
   * @returns {string} - The absolute path to the file.
   */
  getAbsolutePath: (relativePath) => {
    return path.resolve(relativePath);
  }
};