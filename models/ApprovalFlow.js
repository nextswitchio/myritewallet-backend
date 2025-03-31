module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ApprovalFlow', {
    type: {
      type: DataTypes.ENUM(
        'bulk_payment',
        'reversal',
        'fraud_resolution',
        'template_creation'
      ),
      allowNull: false
    },
    reference: DataTypes.STRING, // For transaction references
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    metadata: DataTypes.JSONB,
    completedAt: DataTypes.DATE
  }, {
    associate: (models) => {
      models.ApprovalFlow.belongsTo(models.User, { 
        as: 'initiator',
        foreignKey: 'initiatorId'
      });
      models.ApprovalFlow.belongsTo(models.User, {
        as: 'approver',
        foreignKey: 'approverId'
      });
    }
  });
};