const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 50],
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 50],
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          isNumeric: true,
          len: [11, 15],
        },
      },
      password: {
        type: DataTypes.STRING,
        validate: {
          len: [8, 100],
        },
      },
      transactionPin: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [4, 6],
        },
      },
      profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profileLevel: {
        type: DataTypes.ENUM('1', '2', '3'),
        defaultValue: '1',
      },
      points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      pointsExpiryDate: DataTypes.DATE,
      isKYCVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      vfdWalletId: DataTypes.STRING,
      lastLoginLocation: DataTypes.GEOMETRY('POINT'),
      otp: DataTypes.STRING,
      otpExpires: DataTypes.DATE,
      knownDevices: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      withdrawalStatus: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      lastWithdrawalAt: DataTypes.DATE,
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      referralCode: {
        type: DataTypes.STRING,
        unique: true,
      },
      referredBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
          if (user.transactionPin) {
            const salt = await bcrypt.genSalt(10);
            user.transactionPin = await bcrypt.hash(user.transactionPin, salt);
          }
          if (!user.referralCode) {
            user.referralCode = await User.generateReferralCode();
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
          if (user.changed('transactionPin')) {
            const salt = await bcrypt.genSalt(10);
            user.transactionPin = await bcrypt.hash(user.transactionPin, salt);
          }
        },
        afterUpdate: async (user) => {
          // Re-enable withdrawals after 3 days if from flexible savings
          if (
            user.withdrawalStatus === 'inactive' &&
            user.lastWithdrawalAt < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          ) {
            await user.update({ withdrawalStatus: 'active' });
          }
        },
      },
    }
  );

  // Associations
  User.associate = (models) => {
    User.hasMany(models.AjoGroup, {
      foreignKey: 'creatorId',
      as: 'createdGroups',
    });
    User.hasMany(models.AjoMember, {
      foreignKey: 'userId',
      as: 'ajoMemberships',
    });
    User.hasOne(models.Wallet, {
      foreignKey: 'userId',
      as: 'wallet',
    });
    User.hasMany(models.Transaction, {
      foreignKey: 'userId',
      as: 'transactions',
    });
    User.hasMany(models.Notification, {
      foreignKey: 'userId',
      as: 'notifications',
    });
    User.hasMany(models.UserLocation, {
      foreignKey: 'userId',
      as: 'locations',
    });
    User.hasMany(models.SavingsGoal);
    User.hasMany(models.FlexibleSavings);
    User.hasMany(models.AjoInvite, { foreignKey: 'senderId' });
    User.hasMany(models.AjoChat, { foreignKey: 'senderId' });
    User.belongsToMany(models.ApprovalLevel, { through: 'ApproverAssignments' });

    // Referrals
    User.hasMany(models.User, {
      foreignKey: 'referredBy',
      as: 'referredUsers',
    });
  };

  // Methods
  User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.verifyTransactionPin = async function (pin) {
    return await bcrypt.compare(pin, this.transactionPin);
  };

  User.prototype.checkWithdrawalEligibility = async function () {
    // Allow if from Ajo payout or after restriction period
    const recentWithdrawal = await this.sequelize.models.Transaction.findOne({
      where: {
        userId: this.id,
        type: 'withdrawal',
        createdAt: { [Op.gt]: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      },
      order: [['createdAt', 'DESC']],
    });

    return (
      !recentWithdrawal ||
      recentWithdrawal.metadata?.source === 'ajo_payout'
    );
  };

  User.generateReferralCode = async function () {
    let code;
    let exists = true;
    while (exists) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await User.findOne({ where: { referralCode: code } });
    }
    return code;
  };

  return User;
};