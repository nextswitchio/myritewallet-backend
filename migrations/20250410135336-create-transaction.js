module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      fee: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      type: {
        type: Sequelize.ENUM('deposit', 'withdrawal', 'transfer', 'ajo_contribution', 'ajo_payout', 'penalty'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed'),
        defaultValue: 'pending'
      },
      reference: {
        type: Sequelize.STRING,
        unique: true
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      walletId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Wallets',
          key: 'id'
        }
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      ajoId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'AjoGroups',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Transactions');
  }
};
