module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Notifications', {
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
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('system', 'ajo', 'transaction', 'penalty', 'payout'),
        defaultValue: 'system'
      },
      status: {
        type: Sequelize.ENUM('unread', 'read', 'archived'),
        defaultValue: 'unread'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('Notifications');
  }
};
