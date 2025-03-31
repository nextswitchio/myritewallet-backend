module.exports = (sequelize, DataTypes) => {
  const AjoGroup = sequelize.define('AjoGroup', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 100]
      }
    },
    description: DataTypes.TEXT,
    contributionAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 100
      }
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false
    },
    slots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 5,
        max: 30
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    currentSlot: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed'),
      defaultValue: 'pending'
    },
    earlySlotsReserved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    location: DataTypes.GEOMETRY('POINT')
  });

  AjoGroup.associate = (models) => {
    AjoGroup.belongsTo(models.User, {
      foreignKey: 'creatorId',
      as: 'creator'
    });
    AjoGroup.hasMany(models.AjoMember, {
      foreignKey: 'ajoId',
      as: 'members'
    });
    AjoGroup.hasMany(models.Transaction, {
      foreignKey: 'ajoId',
      as: 'transactions'
    });
  };

  return AjoGroup;
};