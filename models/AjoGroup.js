module.exports = (sequelize, DataTypes) => {
  const AjoGroup = sequelize.define('AjoGroup', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 100],
      },
    },
    description: DataTypes.TEXT,
    contributionAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 100,
      },
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false,
    },
    slots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 5,
        max: 30,
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    currentSlot: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed'),
      defaultValue: 'pending',
    },
    earlySlotsReserved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    location: DataTypes.GEOMETRY('POINT'),
    payoutOrder: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ajoCode: {
      type: DataTypes.STRING,
      unique: true,
    },
  });

  // Associations
  AjoGroup.associate = (models) => {
    AjoGroup.belongsTo(models.User, {
      foreignKey: 'creatorId',
      as: 'creator',
    });
    AjoGroup.hasMany(models.AjoMember, {
      foreignKey: 'ajoId',
      as: 'members',
    });
    AjoGroup.hasMany(models.Transaction, {
      foreignKey: 'ajoId',
      as: 'transactions',
    });
  };

  // Hooks
  AjoGroup.beforeCreate(async (ajoGroup) => {
    if (!ajoGroup.ajoCode) {
      ajoGroup.ajoCode = await AjoGroup.generateAjoCode();
    }
  });

  // Methods
  AjoGroup.generateAjoCode = async function () {
    let code;
    let exists = true;
    while (exists) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await AjoGroup.findOne({ where: { ajoCode: code } });
    }
    return code;
  };

  AjoGroup.prototype.getNextPayoutMember = async function () {
    const members = await this.getMembers({
      order: [['createdAt', 'ASC']],
    });

    if (this.payoutOrder.length < members.length) {
      return members[this.payoutOrder.length];
    }

    return null; // All members have received payouts
  };

  return AjoGroup;
};