module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoGroups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      contributionAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      frequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        allowNull: false
      },
      slots: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      currentSlot: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'completed'),
        defaultValue: 'pending'
      },
      earlySlotsReserved: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      location: {
        type: Sequelize.GEOMETRY('POINT')
      },
      payoutOrder: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      isPrivate: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ajoCode: {
        type: Sequelize.STRING,
        unique: true
      },
      creatorId: {
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
    await queryInterface.dropTable('AjoGroups');
  }
};
