module.exports = (sequelize, DataTypes) => {
  const AjoInvite = sequelize.define('AjoInvite', {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'expired'),
      defaultValue: 'pending',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  });

  // Associations
  AjoInvite.associate = (models) => {
    AjoInvite.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender',
    });
    AjoInvite.belongsTo(models.AjoGroup, {
      foreignKey: 'ajoGroupId',
      as: 'group',
    });
  };

  // Hooks
  AjoInvite.beforeCreate(async (invite) => {
    if (!invite.code || !invite.expiresAt) {
      throw new Error('Invite code and expiration date are required');
    }
  });

  // Methods
  AjoInvite.prototype.markAsAccepted = async function (transaction) {
    this.status = 'accepted';
    await this.save({ transaction });
  };

  AjoInvite.prototype.markAsExpired = async function (transaction) {
    this.status = 'expired';
    await this.save({ transaction });
  };

  return AjoInvite;
};