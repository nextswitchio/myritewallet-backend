User.hasMany(AjoGroup, { foreignKey: 'creatorId', as: 'createdGroups' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
User.hasMany(UserLocation, { foreignKey: 'userId', as: 'locations' });
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
User.hasMany(SavingsGoal, { foreignKey: 'userId', as: 'savingsGoals' });
User.hasMany(FlexibleSavings, { foreignKey: 'userId', as: 'flexibleSavings' });
User.hasMany(WithdrawalRestriction, { foreignKey: 'userId', as: 'withdrawalRestrictions' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(AjoMember, { foreignKey: 'userId', as: 'ajoMemberships' });
User.hasMany(AjoInvite, { foreignKey: 'senderId', as: 'sentInvites' });
User.hasMany(AjoChat, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Dispute, { foreignKey: 'userId', as: 'disputes' });
User.hasMany(FraudCase, { foreignKey: 'userId', as: 'fraudCases' });
User.belongsToMany(ApprovalLevel, { through: 'ApproverAssignments', as: 'approvalLevels' });
User.hasMany(ApprovalFlow, { foreignKey: 'initiatorId', as: 'initiatedApprovalFlows' });
User.hasMany(ApprovalFlow, { foreignKey: 'approverId', as: 'assignedApprovalFlows' });

AjoGroup.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
AjoGroup.hasMany(Transaction, { foreignKey: 'ajoId', as: 'transactions' });
AjoGroup.hasMany(AjoMember, { foreignKey: 'ajoId', as: 'members' });
AjoGroup.hasMany(AjoInvite, { foreignKey: 'ajoGroupId', as: 'invites' });
AjoGroup.hasMany(AjoChat, { foreignKey: 'ajoGroupId', as: 'chats' });
AjoGroup.hasMany(Dispute, { foreignKey: 'ajoId', as: 'disputes' });

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(AjoGroup, { foreignKey: 'ajoId', as: 'ajoGroup' });
Transaction.belongsTo(SavingsGoal, { foreignKey: 'savingsGoalId', as: 'savingsGoal' });
Transaction.belongsTo(FlexibleSavings, { foreignKey: 'flexibleSavingsId', as: 'flexibleSavings' });

Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wallet.hasMany(Transaction, { foreignKey: 'walletId', as: 'transactions' });

SavingsGoal.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SavingsGoal.hasMany(Transaction, { foreignKey: 'savingsGoalId', as: 'transactions' });

FlexibleSavings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
FlexibleSavings.hasMany(Transaction, { foreignKey: 'flexibleSavingsId', as: 'transactions' });

AjoMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AjoMember.belongsTo(AjoGroup, { foreignKey: 'ajoId', as: 'group' });

AjoInvite.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
AjoInvite.belongsTo(AjoGroup, { foreignKey: 'ajoGroupId', as: 'group' });

AjoChat.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
AjoChat.belongsTo(AjoGroup, { foreignKey: 'ajoGroupId', as: 'group' });

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Dispute.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Dispute.belongsTo(AjoGroup, { foreignKey: 'ajoId', as: 'ajoGroup' });

FraudCase.belongsTo(User, { foreignKey: 'userId', as: 'user' });
FraudCase.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

ApprovalFlow.belongsTo(User, { foreignKey: 'initiatorId', as: 'initiator' });
ApprovalFlow.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
ApprovalFlow.belongsTo(ApprovalLevel, { foreignKey: 'approvalLevelId', as: 'approvalLevel' });

ApprovalLevel.belongsToMany(User, { through: 'ApproverAssignments', as: 'approvers' });
ApprovalLevel.hasMany(ApprovalFlow, { foreignKey: 'approvalLevelId', as: 'approvalFlows' });

TemplateVersion.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
TemplateVersion.belongsTo(BulkTemplate, { foreignKey: 'bulkTemplateId', as: 'bulkTemplate' });

BulkTemplate.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
BulkTemplate.hasMany(TemplateVersion, { foreignKey: 'bulkTemplateId', as: 'versions' });

CronLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });