module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    fee: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    type: {
      type: DataTypes.ENUM(
        'deposit',
        'withdrawal',
        'transfer',
        'ajo_contribution',
        'ajo_payout',
        'penalty'
      ),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
    },
    reference: {
      type: DataTypes.STRING,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    walletId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Wallets',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    ajoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'AjoGroups',
        key: 'id',
      },
    },
  });

  // Associations
  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Transaction.belongsTo(models.Wallet, {
      foreignKey: 'walletId',
      as: 'wallet',
    });
    Transaction.belongsTo(models.AjoGroup, {
      foreignKey: 'ajoId',
      as: 'ajoGroup',
    });
  };

  // Hooks
  Transaction.beforeCreate(async (transaction) => {
    if (!transaction.reference) {
      transaction.reference = await Transaction.generateReference();
    }
  });

  // Methods
  Transaction.generateReference = async function () {
    let reference;
    let exists = true;
    while (exists) {
      reference = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      exists = await Transaction.findOne({ where: { reference } });
    }
    return reference;
  };

  return Transaction;
};