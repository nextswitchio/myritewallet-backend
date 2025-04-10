module.exports = (sequelize, DataTypes) => {
  const BulkTemplate = sequelize.define('BulkTemplate', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    template: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  // Associations
  BulkTemplate.associate = (models) => {
    BulkTemplate.belongsTo(models.User, {
      foreignKey: 'creatorId',
      as: 'creator',
    });
    BulkTemplate.hasMany(models.TemplateVersion, {
      foreignKey: 'bulkTemplateId',
      as: 'versions',
    });
  };

  // Hooks
  BulkTemplate.beforeCreate(async (template) => {
    if (!template.name || !template.template) {
      throw new Error('Template name and data are required');
    }
  });

  // Methods
  BulkTemplate.prototype.deactivate = async function (transaction) {
    this.isActive = false;
    await this.save({ transaction });
  };

  BulkTemplate.prototype.activate = async function (transaction) {
    this.isActive = true;
    await this.save({ transaction });
  };

  return BulkTemplate;
};