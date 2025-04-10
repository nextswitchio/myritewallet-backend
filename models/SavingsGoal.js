module.exports = (sequelize, DataTypes) => {
  const SavingsGoal = sequelize.define('SavingsGoal', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currentAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    targetDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active',
    },
    autoDebit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    debitFrequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: true,
    },
    lastDebitDate: {
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
  SavingsGoal.associate = (models) => {
    SavingsGoal.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  // Hooks
  SavingsGoal.beforeUpdate(async (goal) => {
    if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
      goal.status = 'completed';
    }
  });

  // Methods
  SavingsGoal.prototype.addContribution = async function (amount, transaction) {
    if (amount <= 0) {
      throw new Error('Contribution amount must be positive');
    }

    this.currentAmount = parseFloat(this.currentAmount) + parseFloat(amount);
    await this.save({ transaction });
  };

  SavingsGoal.prototype.checkCompletion = function () {
    return this.currentAmount >= this.targetAmount;
  };

  return SavingsGoal;
};