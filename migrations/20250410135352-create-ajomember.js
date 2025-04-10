module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoMembers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      slotNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      paymentHistory: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      hasPaid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      lastPaymentDate: {
        type: Sequelize.DATE
      },
      contributionAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      payoutReceived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      penaltyCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      userId: {
        type: Sequelize.INTEGER,
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

    // Add unique constraint for slotNumber per ajoId
    await queryInterface.addConstraint('AjoMembers', {
      fields: ['ajoId', 'slotNumber'],
      type: 'unique',
      name: 'unique_slot_per_ajo'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeConstraint('AjoMembers', 'unique_slot_per_ajo');
    await queryInterface.dropTable('AjoMembers');
  }
};
