module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserLocations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      latitude: {
        type: Sequelize.DECIMAL(9, 6),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(9, 6),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastUpdated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      userId: {
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
    await queryInterface.dropTable('UserLocations');
  }
};
