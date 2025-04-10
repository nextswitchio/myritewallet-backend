module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoInvites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'expired'),
        defaultValue: 'pending'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      senderId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      ajoGroupId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'AjoGroups',
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
    await queryInterface.dropTable('AjoInvites');
  }
};
