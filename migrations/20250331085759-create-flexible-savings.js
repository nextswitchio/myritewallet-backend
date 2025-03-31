module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FlexibleSavings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      balance: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      lastWithdrawalAt: {
        type: Sequelize.DATE
      },
      withdrawalStatus: {
        type: Sequelize.ENUM('pending', 'processing', 'completed'),
        defaultValue: 'completed'
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.dropTable('FlexibleSavings');
  }
};
