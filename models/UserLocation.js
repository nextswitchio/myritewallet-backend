module.exports = (sequelize, DataTypes) => {
  const UserLocation = sequelize.define('UserLocation', {
    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false
    },
    city: DataTypes.STRING,
    country: DataTypes.STRING,
    ipAddress: DataTypes.STRING
  });

  UserLocation.associate = (models) => {
    UserLocation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return UserLocation;
};