module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FraudCases', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('bulk_payment', 'failed_bulk_payment', 'large_reversal', 'vfd_fraud_alert', 'suspicious_login'),
        allowNull: false
      },
      riskScore: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('open', 'investigating', 'resolved'),
        defaultValue: 'open'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      transactionId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Transactions',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('FraudCases');
  }
};
