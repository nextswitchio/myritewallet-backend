module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FlexibleSavings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      balance: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      lastWithdrawalAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      withdrawalStatus: {
        type: Sequelize.ENUM('pending', 'processing', 'completed'),
        defaultValue: 'completed'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable('FlexibleSavings');
  }
};
