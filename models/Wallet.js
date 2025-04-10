module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    lastTransactionAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
  Wallet.associate = (models) => {
    Wallet.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Wallet.hasMany(models.Transaction, {
      foreignKey: 'walletId',
      as: 'transactions',
    });
  };

  // Hooks
  Wallet.beforeUpdate(async (wallet) => {
    if (wallet.balance < 0) {
      throw new Error('Wallet balance cannot be negative');
    }
  });

  // Methods
  Wallet.prototype.credit = async function (amount, transaction) {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    this.balance = parseFloat(this.balance) + parseFloat(amount);
    this.lastTransactionAt = new Date();
    await this.save({ transaction });
  };

  Wallet.prototype.debit = async function (amount, transaction) {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive');
    }

    if (this.balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    this.balance = parseFloat(this.balance) - parseFloat(amount);
    this.lastTransactionAt = new Date();
    await this.save({ transaction });
  };

  return Wallet;
};