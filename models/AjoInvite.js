module.exports = (sequelize, DataTypes) => {
  return sequelize.define('AjoInvite', {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'expired'),
      defaultValue: 'pending'
    }
  }, {
    associate: (models) => {
      models.AjoInvite.belongsTo(models.User, { as: 'sender' });
      models.AjoInvite.belongsTo(models.AjoGroup);
    }
  });
};