module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      phone: {
        type: Sequelize.STRING,
        unique: true
      },
      password: {
        type: Sequelize.STRING
      },
      profileLevel: {
        type: Sequelize.ENUM('1', '2', '3'),
        defaultValue: '1'
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      pointsExpiryDate: {
        type: Sequelize.DATE
      },
      isKYCVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      vfdWalletId: {
        type: Sequelize.STRING
      },
      lastLoginLocation: {
        type: Sequelize.GEOMETRY('POINT')
      },
      otp: {
        type: Sequelize.STRING
      },
      otpExpires: {
        type: Sequelize.DATE
      },
      knownDevices: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      withdrawalStatus: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      lastWithdrawalAt: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('Users');
  }
};
