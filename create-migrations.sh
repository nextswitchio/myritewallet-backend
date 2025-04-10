#!/bin/bash

# Create migrations directory if it doesn't exist
mkdir -p migrations

# Function to generate migration file
generate_migration() {
  local model_name=$1
  local timestamp=$(date +"%Y%m%d%H%M%S")
  local migration_file="migrations/${timestamp}-create-${model_name,,}.js"
  
  case ${model_name,,} in
    "ajochat")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoChats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      senderId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      ajoGroupId: {
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
    await queryInterface.dropTable('AjoChats');
  }
};
EOL
      ;;

    "ajogroup")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoGroups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      contributionAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      frequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        allowNull: false
      },
      slots: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      currentSlot: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'completed'),
        defaultValue: 'pending'
      },
      earlySlotsReserved: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      location: {
        type: Sequelize.GEOMETRY('POINT')
      },
      payoutOrder: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      isPrivate: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ajoCode: {
        type: Sequelize.STRING,
        unique: true
      },
      creatorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
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
    await queryInterface.dropTable('AjoGroups');
  }
};
EOL
      ;;

    "ajoinvite")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoInvites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'expired'),
        defaultValue: 'pending'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      senderId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      ajoGroupId: {
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
    await queryInterface.dropTable('AjoInvites');
  }
};
EOL
      ;;

    "ajomember")
      cat > "$migration_file" <<EOL
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
EOL
      ;;

    "approvalflow")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ApprovalFlows', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('bulk_payment', 'reversal', 'fraud_resolution', 'template_creation'),
        allowNull: false
      },
      reference: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      completedAt: {
        type: Sequelize.DATE
      },
      initiatorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      approverId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
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
    await queryInterface.dropTable('ApprovalFlows');
  }
};
EOL
      ;;

    "approvallevel")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ApprovalLevels', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('ApprovalLevels');
  }
};
EOL
      ;;

    "bulktemplate")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BulkTemplates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      template: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      creatorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
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
    await queryInterface.dropTable('BulkTemplates');
  }
};
EOL
      ;;

    "cronlog")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CronLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
        type: Sequelize.JSONB,
        defaultValue: {}
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
    await queryInterface.dropTable('CronLogs');
  }
};
EOL
      ;;

    *)
      echo "Unknown model: $model_name"
      return 1
      ;;
  esac

  echo "Created migration: $migration_file"
}

# Generate all migrations
generate_migration "AjoChat"
generate_migration "AjoGroup"
generate_migration "AjoInvite"
generate_migration "AjoMember"
generate_migration "ApprovalFlow"
generate_migration "ApprovalLevel"
generate_migration "BulkTemplate"
generate_migration "CronLog"

echo "All migrations created successfully!"