module.exports = (sequelize, DataTypes) => {
  const UserLocation = sequelize.define('UserLocation', {
    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIP: true,
      },
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  // Associations
  UserLocation.associate = (models) => {
    UserLocation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  // Hooks
  UserLocation.beforeCreate(async (location) => {
    if (!location.latitude || !location.longitude) {
      throw new Error('Latitude and longitude are required');
    }
  });

  // Methods
  UserLocation.prototype.updateLocation = async function (latitude, longitude, city, country, ipAddress, transaction) {
    this.latitude = latitude || this.latitude;
    this.longitude = longitude || this.longitude;
    this.city = city || this.city;
    this.country = country || this.country;
    this.ipAddress = ipAddress || this.ipAddress;
    this.lastUpdated = new Date();
    await this.save({ transaction });
  };

  return UserLocation;
};