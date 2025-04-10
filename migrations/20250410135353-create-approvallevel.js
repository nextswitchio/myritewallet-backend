module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ApprovalLevels', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      approvalType: {
        type: Sequelize.ENUM('bulk_payment', 'reversal', 'fraud_resolution', 'template_change'),
        allowNull: false
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      amountThreshold: {
        type: Sequelize.DECIMAL(12, 2)
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
    await queryInterface.dropTable('ApprovalLevels');
  }
};
