module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ApprovalLevel', {
    approvalType: {
      type: DataTypes.ENUM(
        'bulk_payment',
        'reversal',
        'fraud_resolution',
        'template_change'
      ),
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amountThreshold: DataTypes.DECIMAL(12, 2) // Minimum amount for this level
  }, {
    associate: (models) => {
      models.ApprovalLevel.belongsToMany(models.User, {
        through: 'ApproverAssignments'
      });
    }
  });
};