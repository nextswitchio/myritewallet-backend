module.exports = (sequelize, DataTypes) => {
  const CronLog = sequelize.define('CronLog', {
    jobName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('started', 'completed', 'failed'),
      allowNull: false
    },
    executionTime: {
      type: DataTypes.INTEGER // Milliseconds
    },
    metadata: DataTypes.JSONB
  });

  return CronLog;
};