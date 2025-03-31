module.exports = (sequelize, DataTypes) => {
  return sequelize.define('TemplateVersion', {
    version: {
      type: DataTypes.STRING,
      allowNull: false
    },
    changeReason: DataTypes.TEXT,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    templateData: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {
    associate: (models) => {
      models.TemplateVersion.belongsTo(models.User, {
        as: 'creator'
      });
      models.TemplateVersion.belongsTo(models.BulkTemplate);
    }
  });
};