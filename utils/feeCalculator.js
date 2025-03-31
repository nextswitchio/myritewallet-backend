module.exports = {
  calculateFee: (amount) => {
    amount = parseFloat(amount);
    if (amount < 5000) return amount * 0.05;
    if (amount < 10000) return amount * 0.10;
    return amount * 0.20;
  },

  applyFee: (amount) => {
    const fee = this.calculateFee(amount);
    return {
      amount: amount + fee,
      fee,
      grossAmount: amount
    };
  }
};