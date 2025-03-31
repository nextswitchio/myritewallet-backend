module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FraudCases', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: Sequelize.ENUM('bulk_payment', 'failed_bulk_payment', 'large_reversal', 'vfd_fraud_alert', 'suspicious_login'),
        allowNull: false
      },
      riskScore: {
        type: Sequelize.INTEGER
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
        type: Sequelize.JSONB
      },
      UserId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      TransactionId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('FraudCases');
  }
};
