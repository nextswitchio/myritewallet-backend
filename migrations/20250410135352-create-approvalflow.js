module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ApprovalFlows', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('bulk_payment', 'reversal', 'fraud_resolution', 'template_creation'),
        allowNull: false
      },
      reference: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      completedAt: {
        type: Sequelize.DATE
      },
      initiatorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      approverId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
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
    await queryInterface.dropTable('ApprovalFlows');
  }
};
