module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SavingsGoals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      targetAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currentAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      targetDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active'
      },
      autoDebit: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      debitFrequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        allowNull: true
      },
      lastDebitDate: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.dropTable('SavingsGoals');
  }
};
