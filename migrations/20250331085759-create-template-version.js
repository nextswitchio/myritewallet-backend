module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TemplateVersions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      changeReason: {
        type: Sequelize.TEXT
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      BulkTemplateId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'BulkTemplates',
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
    await queryInterface.dropTable('TemplateVersions');
  }
};
