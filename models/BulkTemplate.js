module.exports = (sequelize, DataTypes) => {
  return sequelize.define('BulkTemplate', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    template: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    associate: (models) => {
      models.BulkTemplate.belongsTo(models.User, {
        as: 'creator'
      });
    }
  });
};