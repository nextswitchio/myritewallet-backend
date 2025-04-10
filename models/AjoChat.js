module.exports = (sequelize, DataTypes) => {
  const AjoChat = sequelize.define('AjoChat', {
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  });

  // Associations
  AjoChat.associate = (models) => {
    AjoChat.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender',
    });
    AjoChat.belongsTo(models.AjoGroup, {
      foreignKey: 'ajoGroupId',
      as: 'group',
    });
  };

  // Hooks
  AjoChat.beforeCreate(async (chat) => {
    if (!chat.message) {
      throw new Error('Chat message is required');
    }
  });

  // Methods
  AjoChat.prototype.addMetadata = async function (key, value, transaction) {
    this.metadata[key] = value;
    await this.save({ transaction });
  };

  return AjoChat;
};