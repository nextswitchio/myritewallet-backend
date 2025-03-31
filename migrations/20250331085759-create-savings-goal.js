module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SavingsGoals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        type: Sequelize.DATE
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      autoDebit: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      debitFrequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly')
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
    await queryInterface.dropTable('SavingsGoals');
  }
};
