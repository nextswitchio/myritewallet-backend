module.exports = (sequelize, DataTypes) => {
  const ApprovalFlow = sequelize.define('ApprovalFlow', {
    type: {
      type: DataTypes.ENUM(
        'bulk_payment',
        'reversal',
        'fraud_resolution',
        'template_creation'
      ),
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING, // For transaction references
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Associations
  ApprovalFlow.associate = (models) => {
    ApprovalFlow.belongsTo(models.User, {
      as: 'initiator',
      foreignKey: 'initiatorId',
    });
    ApprovalFlow.belongsTo(models.User, {
      as: 'approver',
      foreignKey: 'approverId',
    });
  };

  // Hooks
  ApprovalFlow.beforeCreate(async (approvalFlow) => {
    if (!approvalFlow.type) {
      throw new Error('Approval flow type is required');
    }
  });

  // Methods
  ApprovalFlow.prototype.markAsApproved = async function (transaction) {
    this.status = 'approved';
    this.completedAt = new Date();
    await this.save({ transaction });
  };

  ApprovalFlow.prototype.markAsRejected = async function (transaction) {
    this.status = 'rejected';
    this.completedAt = new Date();
    await this.save({ transaction });
  };

  return ApprovalFlow;
};