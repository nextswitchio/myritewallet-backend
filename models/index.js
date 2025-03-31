User.hasMany(AjoGroup, { foreignKey: 'creatorId' });
User.hasMany(Transaction);
User.hasMany(UserLocation);
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
User.hasMany(SavingsGoal, { foreignKey: 'userId', as: 'savingsGoals' });
User.hasMany(FlexibleSavings, { foreignKey: 'userId', as: 'flexibleSavings' });
User.hasMany(WithdrawalRestriction, { foreignKey: 'userId' });

AjoGroup.belongsTo(User, { foreignKey: 'creatorId' });
AjoGroup.hasMany(Transaction);

Transaction.belongsTo(User);
Transaction.belongsTo(AjoGroup);
Transaction.belongsTo(SavingsGoal, { foreignKey: 'savingsGoalId' });
Transaction.belongsTo(FlexibleSavings, { foreignKey: 'flexibleSavingsId' });