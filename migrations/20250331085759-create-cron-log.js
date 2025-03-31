module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CronLogs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      jobName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('started', 'completed', 'failed'),
        allowNull: false
      },
      executionTime: {
        type: Sequelize.INTEGER
      },
      metadata: {
        type: Sequelize.JSONB
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('CronLogs');
  }
};
