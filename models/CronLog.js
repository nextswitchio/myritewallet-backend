module.exports = (sequelize, DataTypes) => {
  const CronLog = sequelize.define('CronLog', {
    jobName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('started', 'completed', 'failed'),
      allowNull: false,
    },
    executionTime: {
      type: DataTypes.INTEGER, // Milliseconds
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  });

  // Hooks
  CronLog.beforeCreate(async (cronLog) => {
    if (!cronLog.jobName || !cronLog.status) {
      throw new Error('Job name and status are required');
    }
  });

  // Methods
  CronLog.prototype.markAsCompleted = async function (executionTime, transaction) {
    this.status = 'completed';
    this.executionTime = executionTime || this.executionTime;
    await this.save({ transaction });
  };

  CronLog.prototype.markAsFailed = async function (errorDetails, transaction) {
    this.status = 'failed';
    this.metadata.error = errorDetails;
    await this.save({ transaction });
  };

  return CronLog;
};