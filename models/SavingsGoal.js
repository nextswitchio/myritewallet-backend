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
    status: { 
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active'
    },
    autoDebit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    debitFrequency: DataTypes.ENUM('daily', 'weekly', 'monthly')
  });
};