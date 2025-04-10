module.exports = (sequelize, DataTypes) => {
  const ApprovalLevel = sequelize.define('ApprovalLevel', {
    approvalType: {
      type: DataTypes.ENUM(
        'bulk_payment',
        'reversal',
        'fraud_resolution',
        'template_change'
      ),
      allowNull: false,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amountThreshold: {
      type: DataTypes.DECIMAL(12, 2), // Minimum amount for this level
      allowNull: true,
      validate: {
        min: 0,
      },
    },
  });

  // Associations
  ApprovalLevel.associate = (models) => {
    ApprovalLevel.belongsToMany(models.User, {
      through: 'ApproverAssignments',
      as: 'approvers',
    });
    ApprovalLevel.hasMany(models.ApprovalFlow, {
      foreignKey: 'approvalLevelId',
      as: 'approvalFlows',
    });
  };

  // Hooks
  ApprovalLevel.beforeCreate(async (approvalLevel) => {
    if (!approvalLevel.approvalType || !approvalLevel.level) {
      throw new Error('Approval type and level are required');
    }
  });

  // Methods
  ApprovalLevel.prototype.isEligibleForApproval = function (amount) {
    if (this.amountThreshold === null) {
      return true; // No threshold set, always eligible
    }
    return parseFloat(amount) >= parseFloat(this.amountThreshold);
  };

  return ApprovalLevel;
};