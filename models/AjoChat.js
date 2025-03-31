module.exports = (sequelize, DataTypes) => {
  return sequelize.define('AjoChat', {
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    associate: (models) => {
      models.AjoChat.belongsTo(models.User, { as: 'sender' });
      models.AjoChat.belongsTo(models.AjoGroup);
    }
  });
};