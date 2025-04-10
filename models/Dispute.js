module.exports = (sequelize, DataTypes) => {
  const Dispute = sequelize.define('Dispute', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'resolved', 'rejected'),
      defaultValue: 'open',
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  });

  // Associations
  Dispute.associate = (models) => {
    Dispute.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Dispute.belongsTo(models.AjoGroup, {
      foreignKey: 'ajoId',
      as: 'ajoGroup',
    });
  };

  // Hooks
  Dispute.beforeCreate(async (dispute) => {
    if (!dispute.title || !dispute.description) {
      throw new Error('Dispute title and description are required');
    }
  });

  // Methods
  Dispute.prototype.markAsResolved = async function (resolution, transaction) {
    this.status = 'resolved';
    this.resolution = resolution;
    await this.save({ transaction });
  };

  Dispute.prototype.markAsRejected = async function (reason, transaction) {
    this.status = 'rejected';
    this.resolution = reason;
    await this.save({ transaction });
  };

  return Dispute;
};