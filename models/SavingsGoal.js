module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SavingsGoal', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    targetAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currentAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    targetDate: DataTypes.DATE,
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    autoDebit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    debitFrequency: DataTypes.ENUM('daily', 'weekly', 'monthly')
  });
};