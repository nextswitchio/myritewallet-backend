module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    fee: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    type: {
      type: DataTypes.ENUM(
        'deposit',
        'withdrawal',
        'transfer',
        'ajo_contribution',
        'ajo_payout',
        'penalty'
      ),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending'
    },
    reference: {
      type: DataTypes.STRING,
      unique: true
    },
    metadata: DataTypes.JSONB
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Transaction.belongsTo(models.AjoGroup, {
      foreignKey: 'ajoId',
      as: 'ajoGroup'
    });
  };

  return Transaction;
};