module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TemplateVersions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      changeReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      templateData: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      creatorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      bulkTemplateId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'BulkTemplates',
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
    await queryInterface.dropTable('TemplateVersions');
  }
};
