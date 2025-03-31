module.exports = (sequelize, DataTypes) => {
  const AjoMember = sequelize.define('AjoMember', {
    slotNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    hasPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastPaymentDate: DataTypes.DATE
  });

  AjoMember.associate = (models) => {
    AjoMember.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    AjoMember.belongsTo(models.AjoGroup, {
      foreignKey: 'ajoId',
      as: 'group'
    });
  };

  return AjoMember;
};