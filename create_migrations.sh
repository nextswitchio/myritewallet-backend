#!/bin/bash

# Create migrations directory if it doesn't exist
mkdir -p migrations

# Function to generate migration file
generate_migration() {
  local model_name=$1
  local timestamp=$(date +"%Y%m%d%H%M%S")
  local migration_file="migrations/${timestamp}-create-${model_name,,}.js"
  
  case ${model_name,,} in
    "dispute")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Disputes', {
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
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('open', 'resolved', 'rejected'),
        defaultValue: 'open'
      },
      resolution: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
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
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Disputes');
  }
};
EOL
      ;;

    "flexiblesavings")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FlexibleSavings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      balance: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      lastWithdrawalAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      withdrawalStatus: {
        type: Sequelize.ENUM('pending', 'processing', 'completed'),
        defaultValue: 'completed'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable('FlexibleSavings');
  }
};
EOL
      ;;

    "fraudcase")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FraudCases', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('bulk_payment', 'failed_bulk_payment', 'large_reversal', 'vfd_fraud_alert', 'suspicious_login'),
        allowNull: false
      },
      riskScore: {
        type: Sequelize.INTEGER,
        allowNull: true
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
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      transactionId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Transactions',
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
    await queryInterface.dropTable('FraudCases');
  }
};
EOL
      ;;

    "notification")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Notifications', {
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
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('system', 'ajo', 'transaction', 'penalty', 'payout'),
        defaultValue: 'system'
      },
      status: {
        type: Sequelize.ENUM('unread', 'read', 'archived'),
        defaultValue: 'unread'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      userId: {
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
    await queryInterface.dropTable('Notifications');
  }
};
EOL
      ;;

    "savingsgoal")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SavingsGoals', {
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
      targetAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currentAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      targetDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active'
      },
      autoDebit: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      debitFrequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        allowNull: true
      },
      lastDebitDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable('SavingsGoals');
  }
};
EOL
      ;;

    "templateversion")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TemplateVersions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      changeReason: {
        type: Sequelize.TEXT,
        allowNull: true
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
        }
      },
      bulkTemplateId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'BulkTemplates',
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
    await queryInterface.dropTable('TemplateVersions');
  }
};
EOL
      ;;

    "transaction")
      cat > "$migration_file" <<EOL
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
EOL
      ;;

    "user")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      transactionPin: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profilePicture: {
        type: Sequelize.STRING,
        allowNull: true
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
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      referralCode: {
        type: Sequelize.STRING,
        unique: true
      },
      referredBy: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('Users');
  }
};
EOL
      ;;

    "userlocation")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserLocations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastUpdated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      userId: {
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
    await queryInterface.dropTable('UserLocations');
  }
};
EOL
      ;;

    "wallet")
      cat > "$migration_file" <<EOL
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Wallets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      balance: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'NGN'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      lastTransactionAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable('Wallets');
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
generate_migration "Dispute"
generate_migration "FlexibleSavings"
generate_migration "FraudCase"
generate_migration "Notification"
generate_migration "SavingsGoal"
generate_migration "TemplateVersion"
generate_migration "Transaction"
generate_migration "User"
generate_migration "UserLocation"
generate_migration "Wallet"

echo "All migrations created successfully!"