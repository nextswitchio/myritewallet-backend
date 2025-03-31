module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ApprovalLevels', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      approvalType: {
        type: Sequelize.ENUM('bulk_payment', 'reversal', 'fraud_resolution', 'template_change'),
        allowNull: false
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      amountThreshold: {
        type: Sequelize.DECIMAL(12, 2)
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

    await queryInterface.createTable('ApproverAssignments', {
      ApprovalLevelId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'ApprovalLevels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      UserId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.dropTable('ApproverAssignments');
    await queryInterface.dropTable('ApprovalLevels');
  }
};
