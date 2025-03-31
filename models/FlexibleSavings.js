module.exports = (sequelize, DataTypes) => {
  return sequelize.define('FlexibleSavings', {
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    lastWithdrawalAt: DataTypes.DATE,
    withdrawalStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed'),
      defaultValue: 'completed'
    }
  });
};