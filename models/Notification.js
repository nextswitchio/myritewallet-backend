module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'system',
        'ajo',
        'transaction',
        'penalty',
        'payout'
      ),
      defaultValue: 'system',
    },
    status: {
      type: DataTypes.ENUM('unread', 'read', 'archived'),
      defaultValue: 'unread',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  });

  // Associations
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  // Hooks
  Notification.beforeCreate(async (notification) => {
    if (!notification.title || !notification.message) {
      throw new Error('Notification title and message are required');
    }
  });

  // Methods
  Notification.prototype.markAsRead = async function () {
    this.isRead = true;
    this.status = 'read';
    await this.save();
  };

  Notification.prototype.archive = async function () {
    this.status = 'archived';
    await this.save();
  };

  return Notification;
};