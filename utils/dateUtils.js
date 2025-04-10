const moment = require('moment');

module.exports = {
  /**
   * Get the current date and time in ISO format.
   * @returns {string} - The current date and time in ISO format.
   */
  getCurrentISODate: () => {
    return new Date().toISOString();
  },

  /**
   * Format a date into a readable string.
   * @param {Date|string} date - The date to format.
   * @param {string} format - The desired format (default: 'YYYY-MM-DD HH:mm:ss').
   * @returns {string} - The formatted date string.
   */
  formatDate: (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    return moment(date).format(format);
  },

  /**
   * Add or subtract time from a date.
   * @param {Date|string} date - The base date.
   * @param {number} amount - The amount of time to add or subtract.
   * @param {string} unit - The unit of time (e.g., 'days', 'hours', 'minutes').
   * @returns {Date} - The updated date.
   */
  adjustDate: (date, amount, unit) => {
    return moment(date).add(amount, unit).toDate();
  },

  /**
   * Calculate the difference between two dates.
   * @param {Date|string} date1 - The first date.
   * @param {Date|string} date2 - The second date.
   * @param {string} unit - The unit of time to measure the difference (e.g., 'days', 'hours').
   * @returns {number} - The difference between the two dates in the specified unit.
   */
  dateDifference: (date1, date2, unit = 'days') => {
    return moment(date1).diff(moment(date2), unit);
  },

  /**
   * Check if a date is in the past.
   * @param {Date|string} date - The date to check.
   * @returns {boolean} - True if the date is in the past, false otherwise.
   */
  isPastDate: (date) => {
    return moment(date).isBefore(moment());
  },

  /**
   * Check if a date is in the future.
   * @param {Date|string} date - The date to check.
   * @returns {boolean} - True if the date is in the future, false otherwise.
   */
  isFutureDate: (date) => {
    return moment(date).isAfter(moment());
  },

  /**
   * Check if a date has expired based on the current time.
   * @param {Date|string} expiryDate - The expiration date to check.
   * @returns {boolean} - True if the date has expired, false otherwise.
   */
  isExpired: (expiryDate) => {
    return moment().isAfter(moment(expiryDate));
  },

  /**
   * Get the start of a specific time unit (e.g., day, month, year).
   * @param {Date|string} date - The base date.
   * @param {string} unit - The time unit (e.g., 'day', 'month', 'year').
   * @returns {Date} - The start of the specified time unit.
   */
  getStartOf: (date, unit) => {
    return moment(date).startOf(unit).toDate();
  },

  /**
   * Get the end of a specific time unit (e.g., day, month, year).
   * @param {Date|string} date - The base date.
   * @param {string} unit - The time unit (e.g., 'day', 'month', 'year').
   * @returns {Date} - The end of the specified time unit.
   */
  getEndOf: (date, unit) => {
    return moment(date).endOf(unit).toDate();
  },

  /**
   * Generate an expiration date based on the current time.
   * @param {number} minutes - The number of minutes until expiration.
   * @returns {Date} - The expiration date.
   */
  generateExpiryDate: (minutes = 15) => {
    return moment().add(minutes, 'minutes').toDate();
  }
};