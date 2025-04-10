module.exports = (sequelize, DataTypes) => {
  const FraudCase = sequelize.define('FraudCase', {
    type: {
      type: DataTypes.ENUM(
        'bulk_payment',
        'failed_bulk_payment',
        'large_reversal',
        'vfd_fraud_alert',
        'suspicious_login'
      ),
      allowNull: false,
    },
    riskScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('open', 'investigating', 'resolved'),
      defaultValue: 'open',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  });

  // Associations
  FraudCase.associate = (models) => {
    FraudCase.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    FraudCase.belongsTo(models.Transaction, {
      foreignKey: 'transactionId',
      as: 'transaction',
    });
  };

  // Hooks
  FraudCase.beforeCreate(async (fraudCase) => {
    if (!fraudCase.type) {
      throw new Error('Fraud case type is required');
    }
  });

  // Methods
  FraudCase.prototype.markAsResolved = async function (transaction) {
    this.status = 'resolved';
    await this.save({ transaction });
  };

  FraudCase.prototype.markAsInvestigating = async function (transaction) {
    this.status = 'investigating';
    await this.save({ transaction });
  };

  return FraudCase;
};