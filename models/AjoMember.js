module.exports = (sequelize, DataTypes) => {
  const AjoMember = sequelize.define('AjoMember', {
    slotNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    paymentHistory: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    hasPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastPaymentDate: DataTypes.DATE,
    validate: {
      slotUniquePerGroup(value) {
        return AjoMember.findOne({
          where: { ajoId: this.ajoId, slotNumber: value }
        }).then(member => {
          if (member && member.id !== this.id) {
            throw new Error('Slot number already taken');
          }
        });
      }
    }
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