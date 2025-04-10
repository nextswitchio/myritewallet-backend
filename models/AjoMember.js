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
    },
    contributionAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    payoutReceived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    penaltyCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  });

  // Associations
  AjoMember.associate = (models) => {
    AjoMember.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    AjoMember.belongsTo(models.AjoGroup, {
      foreignKey: 'ajoId',
      as: 'group',
    });
  };

  // Hooks
  AjoMember.beforeCreate(async (member) => {
    const existingMember = await AjoMember.findOne({
      where: { ajoId: member.ajoId, slotNumber: member.slotNumber },
    });
    if (existingMember) {
      throw new Error('Slot number already taken in this Ajo group');
    }
  });

  // Methods
  AjoMember.prototype.recordPayment = async function (amount, transaction) {
    this.paymentHistory.push({
      amount,
      date: new Date(),
    });
    this.contributionAmount = parseFloat(this.contributionAmount) + parseFloat(amount);
    this.lastPaymentDate = new Date();
    this.hasPaid = true;
    await this.save({ transaction });
  };

  AjoMember.prototype.markPayoutReceived = async function (transaction) {
    this.payoutReceived = true;
    await this.save({ transaction });
  };

  return AjoMember;
};