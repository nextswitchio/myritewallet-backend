module.exports = {
  /**
   * Get an environment variable with a default value.
   * @param {string} key - The name of the environment variable.
   * @param {any} defaultValue - The default value to return if the variable is not set.
   * @returns {string|any} - The value of the environment variable or the default value.
   */
  getEnv: (key, defaultValue = null) => {
    if (process.env[key] === undefined) {
      if (defaultValue === null) {
        throw new Error(`Environment variable "${key}" is not set and no default value was provided.`);
      }
      return defaultValue;
    }
    return process.env[key];
  },

  /**
   * Ensure that required environment variables are set.
   * @param {string[]} keys - An array of required environment variable names.
   * @throws {Error} - If any of the required variables are not set.
   */
  ensureEnv: (keys) => {
    const missingKeys = keys.filter((key) => process.env[key] === undefined);
    if (missingKeys.length > 0) {
      throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
    }
  }
};