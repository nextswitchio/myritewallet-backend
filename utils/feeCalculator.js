/**
 * Utility for calculating and applying fees.
 */

// Fee configuration
const FEE_RULES = [
  { max: 5000, rate: 0.05 }, // 5% for amounts less than 5000
  { max: 10000, rate: 0.10 }, // 10% for amounts between 5000 and 10000
  { max: Infinity, rate: 0.20 } // 20% for amounts greater than 10000
];

module.exports = {
  /**
   * Calculate the fee based on the given amount.
   * @param {number} amount - The amount to calculate the fee for.
   * @returns {number} - The calculated fee.
   * @throws {Error} - If the amount is invalid or non-positive.
   */
  calculateFee: (amount) => {
    amount = parseFloat(amount);

    // Validate the input
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}. Amount must be a positive number.`);
    }
    if (!Number.isFinite(amount) || amount > 1e9) {
      throw new Error(`Invalid amount: ${amount}. Amount must be a finite number less than 1 billion.`);
    }

    // Find the applicable fee rule
    const rule = FEE_RULES.find((rule) => amount <= rule.max);
    return amount * rule.rate;
  },

  /**
   * Apply the fee to the given amount.
   * @param {number} amount - The amount to apply the fee to.
   * @returns {object} - An object containing the total amount, fee, and gross amount.
   */
  applyFee: (amount) => {
    const fee = module.exports.calculateFee(amount); // Calculate the fee
    return {
      amount: amount + fee, // Total amount after applying the fee
      fee, // The calculated fee
      grossAmount: amount // The original amount before the fee
    };
  }
};