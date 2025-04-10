module.exports = (sequelize, DataTypes) => {
  const FlexibleSavings = sequelize.define('FlexibleSavings', {
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    lastWithdrawalAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    withdrawalStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed'),
      defaultValue: 'completed',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  });

  // Associations
  FlexibleSavings.associate = (models) => {
    FlexibleSavings.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  // Hooks
  FlexibleSavings.beforeUpdate(async (savings) => {
    if (savings.balance < 0) {
      throw new Error('Flexible savings balance cannot be negative');
    }
  });

  // Methods
  FlexibleSavings.prototype.credit = async function (amount, transaction) {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    this.balance = parseFloat(this.balance) + parseFloat(amount);
    await this.save({ transaction });
  };

  FlexibleSavings.prototype.debit = async function (amount, transaction) {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive');
    }

    if (this.balance < amount) {
      throw new Error('Insufficient flexible savings balance');
    }

    this.balance = parseFloat(this.balance) - parseFloat(amount);
    this.lastWithdrawalAt = new Date();
    this.withdrawalStatus = 'processing';
    await this.save({ transaction });
  };

  return FlexibleSavings;
};