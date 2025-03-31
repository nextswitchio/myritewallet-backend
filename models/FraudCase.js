module.exports = (sequelize, DataTypes) => {
  return sequelize.define('FraudCase', {
    type: {
      type: DataTypes.ENUM(
        'bulk_payment',
        'failed_bulk_payment',
        'large_reversal',
        'vfd_fraud_alert',
        'suspicious_login'
      ),
      allowNull: false
    },
    riskScore: DataTypes.INTEGER,
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('open', 'investigating', 'resolved'),
      defaultValue: 'open'
    },
    metadata: DataTypes.JSONB
  }, {
    associate: (models) => {
      models.FraudCase.belongsTo(models.User);
      models.FraudCase.belongsTo(models.Transaction);
    }
  });
};