module.exports = (sequelize, DataTypes) => {
  const TemplateVersion = sequelize.define('TemplateVersion', {
    version: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    changeReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    templateData: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  });

  // Associations
  TemplateVersion.associate = (models) => {
    TemplateVersion.belongsTo(models.User, {
      foreignKey: 'creatorId',
      as: 'creator',
    });
    TemplateVersion.belongsTo(models.BulkTemplate, {
      foreignKey: 'bulkTemplateId',
      as: 'bulkTemplate',
    });
  };

  // Hooks
  TemplateVersion.beforeCreate(async (templateVersion) => {
    if (!templateVersion.version || !templateVersion.templateData) {
      throw new Error('Version and template data are required');
    }
  });

  // Methods
  TemplateVersion.prototype.activateVersion = async function (transaction) {
    this.isActive = true;
    await this.save({ transaction });
  };

  TemplateVersion.prototype.deactivateVersion = async function (transaction) {
    this.isActive = false;
    await this.save({ transaction });
  };

  return TemplateVersion;
};