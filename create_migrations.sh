#!/bin/bash

# Directory where migrations will be created
MIGRATIONS_DIR="migrations"
mkdir -p "$MIGRATIONS_DIR"

# Current timestamp for migration filenames
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Function to create migration file
create_migration() {
  local model_name=$1
  local migration_name=$2
  local content=$3
  
  local filename="${TIMESTAMP}-${migration_name}.js"
  echo "$content" > "${MIGRATIONS_DIR}/${filename}"
  echo "Created migration: ${MIGRATIONS_DIR}/${filename}"
}

# Migration Order:
# 1. Users (base table)
# 2. Tables that only reference Users
# 3. Tables that reference other tables

# 1. User Migration (no dependencies)
create_migration "User" "create-user" "$(cat <<EOF
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
EOF
)"

# 2. Wallet (depends on Users)
create_migration "Wallet" "create-wallet" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Wallets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      balance: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'NGN'
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        unique: true,
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
    await queryInterface.dropTable('Wallets');
  }
};
EOF
)"

# 3. UserLocation (depends on Users)
create_migration "UserLocation" "create-user-location" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserLocations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      latitude: {
        type: Sequelize.DECIMAL(9, 6),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(9, 6),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING
      },
      country: {
        type: Sequelize.STRING
      },
      ipAddress: {
        type: Sequelize.STRING
      },
      userId: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('UserLocations');
  }
};
EOF
)"

# 4. BulkTemplate (depends on Users)
create_migration "BulkTemplate" "create-bulk-template" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BulkTemplates', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('BulkTemplates');
  }
};
EOF
)"

# 5. ApprovalLevel (no dependencies)
create_migration "ApprovalLevel" "create-approval-level" "$(cat <<EOF
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
EOF
)"

# 6. AjoGroup (depends on Users)
create_migration "AjoGroup" "create-ajo-group" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoGroups', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      creatorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('AjoGroups');
  }
};
EOF
)"

# 7. AjoMember (depends on Users and AjoGroups)
create_migration "AjoMember" "create-ajo-member" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoMembers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      slotNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
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
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ajoId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'AjoGroups',
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
    await queryInterface.dropTable('AjoMembers');
  }
};
EOF
)"

# 8. AjoInvite (depends on Users and AjoGroups)
create_migration "AjoInvite" "create-ajo-invite" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoInvites', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      senderId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      AjoGroupId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'AjoGroups',
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
    await queryInterface.dropTable('AjoInvites');
  }
};
EOF
)"

# 9. AjoChat (depends on Users and AjoGroups)
create_migration "AjoChat" "create-ajo-chat" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AjoChats', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      AjoGroupId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'AjoGroups',
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
    await queryInterface.dropTable('AjoChats');
  }
};
EOF
)"

# 10. Transaction (depends on Users and AjoGroups)
create_migration "Transaction" "create-transaction" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      metadata: {
        type: Sequelize.JSONB
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      ajoId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'AjoGroups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('Transactions');
  }
};
EOF
)"

# 11. TemplateVersion (depends on Users and BulkTemplates)
create_migration "TemplateVersion" "create-template-version" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TemplateVersions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      changeReason: {
        type: Sequelize.TEXT
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      templateData: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      creatorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      BulkTemplateId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'BulkTemplates',
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
    await queryInterface.dropTable('TemplateVersions');
  }
};
EOF
)"

# 12. ApprovalFlow (depends on Users)
create_migration "ApprovalFlow" "create-approval-flow" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ApprovalFlows', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        type: Sequelize.JSONB
      },
      completedAt: {
        type: Sequelize.DATE
      },
      initiatorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      approverId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('ApprovalFlows');
  }
};
EOF
)"

# 13. FraudCase (depends on Users and Transactions)
create_migration "FraudCase" "create-fraud-case" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FraudCases', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: Sequelize.ENUM('bulk_payment', 'failed_bulk_payment', 'large_reversal', 'vfd_fraud_alert', 'suspicious_login'),
        allowNull: false
      },
      riskScore: {
        type: Sequelize.INTEGER
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('open', 'investigating', 'resolved'),
        defaultValue: 'open'
      },
      metadata: {
        type: Sequelize.JSONB
      },
      UserId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      TransactionId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('FraudCases');
  }
};
EOF
)"

# 14. FlexibleSavings (depends on Users)
create_migration "FlexibleSavings" "create-flexible-savings" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FlexibleSavings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      balance: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      lastWithdrawalAt: {
        type: Sequelize.DATE
      },
      withdrawalStatus: {
        type: Sequelize.ENUM('pending', 'processing', 'completed'),
        defaultValue: 'completed'
      },
      userId: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('FlexibleSavings');
  }
};
EOF
)"

# 15. SavingsGoal (depends on Users)
create_migration "SavingsGoal" "create-savings-goal" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SavingsGoals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      targetAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currentAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      targetDate: {
        type: Sequelize.DATE
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      autoDebit: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      debitFrequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly')
      },
      userId: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('SavingsGoals');
  }
};
EOF
)"

# 16. Notification (depends on Users)
create_migration "Notification" "create-notification" "$(cat <<EOF
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('system', 'ajo', 'transaction', 'penalty', 'payout'),
        defaultValue: 'system'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: Sequelize.JSONB
      },
      userId: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('Notifications');
  }
};
EOF
)"

# 17. CronLog (no dependencies)
create_migration "CronLog" "create-cron-log" "$(cat <<EOF
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
EOF
)"

echo "All migrations created successfully in ${MIGRATIONS_DIR}/ directory"