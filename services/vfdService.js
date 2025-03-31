const axios = require('axios');
const crypto = require('crypto');
const { Transaction, Wallet, User, FraudCase, ApprovalFlow, BulkTemplate } = require('../models');
const { logger } = require('../utils/logger');
const { detectBulkFraud } = require('../utils/fraudDetection');

// Session cache
const authTokens = new Map();
const BULK_LIMIT = 50; // Max transactions per bulk request

module.exports = {
  /**
   * Authenticate with VFD API
   * @returns {Promise<string>} API token
   */
  authenticate: async () => {
    try {
      // Check cached token
      if (authTokens.has('access_token')) {
        const token = authTokens.get('access_token');
        if (token.expiresAt > Date.now()) {
          return token.value;
        }
      }

      const response = await axios.post(
        'https://api.vfdtech.ng/auth/token',
        {
          client_id: process.env.VFD_CLIENT_ID,
          client_secret: process.env.VFD_CLIENT_SECRET
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      authTokens.set('access_token', {
        value: response.data.access_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000)
      });

      return response.data.access_token;
    } catch (err) {
      logger.error('VFD Auth Failed:', err.response?.data || err.message);
      throw new Error('VFD authentication failed');
    }
  },

  /**
   * Create virtual wallet for user
   * @param {number} userId 
   * @returns {Promise<boolean>}
   */
  createWallet: async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    try {
      const token = await this.authenticate();
      const response = await axios.post(
        'https://api.vfdtech.ng/wallets/create',
        {
          customer_id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          phone: user.phone,
          email: user.email,
          bvn: user.bvn
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Client-ID': process.env.VFD_CLIENT_ID
          }
        }
      );

      await user.update({ vfdWalletId: response.data.wallet_id });
      return true;
    } catch (err) {
      logger.error('VFD Wallet Creation Failed:', err.response?.data || err.message);
      throw new Error('Failed to create VFD wallet');
    }
  },

  /**
   * Debit user's wallet
   * @param {number} userId 
   * @param {number} amount 
   * @param {string} description 
   * @param {object} transaction Sequelize transaction
   * @returns {Promise<boolean>}
   */
  debitUser: async (userId, amount, description, transaction = null) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user?.vfdWalletId) throw new Error('User wallet not initialized');

    try {
      const token = await this.authenticate();
      const reference = `DR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const response = await axios.post(
        'https://api.vfdtech.ng/transactions/debit',
        {
          wallet_id: user.vfdWalletId,
          amount,
          description,
          reference,
          currency: 'NGN'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Client-ID': process.env.VFD_CLIENT_ID
          }
        }
      );

      // Record transaction
      await Transaction.create({
        userId,
        amount,
        type: 'debit',
        status: 'success',
        reference,
        metadata: {
          description,
          vfdReference: response.data.transaction_ref
        }
      }, { transaction });

      return true;
    } catch (err) {
      logger.error('VFD Debit Failed:', {
        userId,
        amount,
        error: err.response?.data || err.message
      });

      // Record failed transaction
      await Transaction.create({
        userId,
        amount,
        type: 'debit',
        status: 'failed',
        metadata: {
          description,
          error: err.response?.data?.message || 'VFD debit failed'
        }
      }, { transaction });

      throw new Error('Payment processing failed');
    }
  },

  /**
   * Credit user's wallet
   * @param {number} userId 
   * @param {number} amount 
   * @param {string} description 
   * @param {object} transaction Sequelize transaction
   * @returns {Promise<boolean>}
   */
  creditUser: async (userId, amount, description, transaction = null) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user?.vfdWalletId) throw new Error('User wallet not initialized');

    try {
      const token = await this.authenticate();
      const reference = `CR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const response = await axios.post(
        'https://api.vfdtech.ng/transactions/credit',
        {
          wallet_id: user.vfdWalletId,
          amount,
          description,
          reference,
          currency: 'NGN'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Client-ID': process.env.VFD_CLIENT_ID
          }
        }
      );

      // Record transaction
      await Transaction.create({
        userId,
        amount,
        type: 'credit',
        status: 'success',
        reference,
        metadata: {
          description,
          vfdReference: response.data.transaction_ref
        }
      }, { transaction });

      // Update wallet balance
      await Wallet.increment('balance', {
        by: amount,
        where: { userId },
        transaction
      });

      return true;
    } catch (err) {
      logger.error('VFD Credit Failed:', {
        userId,
        amount,
        error: err.response?.data || err.message
      });

      await Transaction.create({
        userId,
        amount,
        type: 'credit',
        status: 'failed',
        metadata: {
          description,
          error: err.response?.data?.message || 'VFD credit failed'
        }
      }, { transaction });

      throw new Error('Fund transfer failed');
    }
  },

  /**
   * Process bank transfer withdrawal
   * @param {number} userId 
   * @param {number} amount 
   * @param {string} bankAccount 
   * @returns {Promise<boolean>}
   */
  processWithdrawal: async (userId, amount, bankAccount) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    try {
      const token = await this.authenticate();
      const reference = `WT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const response = await axios.post(
        'https://api.vfdtech.ng/transactions/transfer',
        {
          wallet_id: user.vfdWalletId,
          amount,
          account_number: bankAccount,
          bank_code: user.bankCode,
          reference,
          narration: 'Withdrawal from myRite Wallet'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Client-ID': process.env.VFD_CLIENT_ID
          }
        }
      );

      await Transaction.create({
        userId,
        amount,
        type: 'withdrawal',
        status: 'pending', // Will be confirmed via webhook
        reference,
        metadata: {
          bankAccount,
          vfdReference: response.data.transaction_ref
        }
      });

      return true;
    } catch (err) {
      logger.error('VFD Withdrawal Failed:', {
        userId,
        amount,
        error: err.response?.data || err.message
      });
      throw new Error('Withdrawal processing failed');
    }
  },

  /**
   * Verify BVN and bank details
   * @param {string} bvn 
   * @param {string} accountNumber 
   * @param {string} bankCode 
   * @returns {Promise<{verified: boolean, accountName: string}>}
   */
  verifyKYC: async (bvn, accountNumber, bankCode) => {
    try {
      const token = await this.authenticate();
      const response = await axios.post(
        'https://api.vfdtech.ng/verification/bvn',
        { bvn, account_number: accountNumber, bank_code: bankCode },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Client-ID': process.env.VFD_CLIENT_ID
          }
        }
      );

      return {
        verified: response.data.verified,
        accountName: response.data.account_name
      };
    } catch (err) {
      logger.error('VFD KYC Verification Failed:', err.response?.data || err.message);
      throw new Error('KYC verification service unavailable');
    }
  },

  /**
   * Handle VFD webhook events
   * @param {object} payload 
   * @returns {Promise<void>}
   */
  handleWebhook: async (payload) => {
    // Verify signature
    const signature = crypto
      .createHmac('sha256', process.env.VFD_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== payload.headers['x-vfd-signature']) {
      throw new Error('Invalid webhook signature');
    }

    const { event, data } = payload.body;

    switch (event) {
      case 'transfer.completed':
        await Transaction.update(
          { status: 'success' },
          { where: { reference: data.reference } }
        );
        break;

      case 'transfer.failed':
        await Transaction.update(
          {
            status: 'failed',
            metadata: { ...sequelize.literal('metadata'), reason: data.reason }
          },
          { where: { reference: data.reference } }
        );
        break;

      case 'wallet.credited':
        await Wallet.increment('balance', {
          by: data.amount,
          where: { userId: data.customer_id }
        });
        break;

      case 'transaction.reversed':
        await this.processReversalWebhook(payload.data);
        break;

      case 'fraud.alert':
        await FraudCase.create({
          type: 'vfd_fraud_alert',
          severity: payload.data.severity,
          metadata: payload.data
        });
        break;

      default:
        logger.warn('Unhandled VFD webhook event:', event);
    }
  },

  processBulkPayments: async (payments, description, transaction = null) => {
    // Fraud check on bulk operation
    const fraudCheck = await detectBulkFraud({
      payments,
      initiatorId: transaction?.options?.userId,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
    });

    if (fraudCheck.blockOperation) {
      await FraudCase.create({
        type: 'bulk_payment',
        riskScore: fraudCheck.riskScore,
        metadata: { payments, fraudCheck }
      }, { transaction });
      throw new Error(`Bulk payment blocked by fraud system: ${fraudCheck.reason}`);
    }

    // Split into chunks
    const chunks = [];
    for (let i = 0; i < payments.length; i += BULK_LIMIT) {
      chunks.push(payments.slice(i, i + BULK_LIMIT));
    }

    const results = { success: [], failed: [] };

    for (const chunk of chunks) {
      try {
        const token = await this.authenticate();
        const response = await axios.post(
          'https://api.vfdtech.ng/transactions/bulk',
          {
            payments: chunk.map(p => ({
              wallet_id: p.user.vfdWalletId,
              amount: p.amount,
              reference: `BLK-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`
            })),
            description,
            currency: 'NGN'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Client-ID': process.env.VFD_CLIENT_ID
            }
          }
        );

        // Record successful transactions
        await Promise.all(response.data.success.map(async (p) => {
          await Transaction.create({
            userId: p.metadata.userId,
            amount: p.amount,
            type: 'bulk_credit',
            status: 'success',
            reference: p.reference,
            metadata: { bulkId: response.data.bulkId }
          }, { transaction });

          // Update wallet balance
          await Wallet.increment('balance', {
            by: p.amount,
            where: { userId: p.metadata.userId },
            transaction
          });

          results.success.push(p);
        }));

        // Record failed transactions
        await Promise.all(response.data.failed.map(async (p) => {
          await Transaction.create({
            userId: p.metadata.userId,
            amount: p.amount,
            type: 'bulk_credit',
            status: 'failed',
            reference: p.reference,
            metadata: { error: p.reason }
          }, { transaction });

          await FraudCase.create({
            type: 'failed_bulk_payment',
            userId: p.metadata.userId,
            amount: p.amount,
            reference: p.reference
          }, { transaction });

          results.failed.push(p);
        }));

      } catch (err) {
        logger.error('Bulk payment chunk failed:', err);
        chunk.forEach(p => results.failed.push({
          ...p,
          error: err.response?.data?.message || 'Bulk processing error'
        }));
      }
    }

    return results;
  },

  /**
   * Reverse a transaction
   * @param {string} reference Original transaction reference
   * @param {string} reason 
   * @param {object} transaction Sequelize transaction
   * @returns {Promise<boolean>}
   */
  reverseTransaction: async (reference, reason, transaction = null) => {
    const originalTx = await Transaction.findOne({
      where: { reference },
      transaction
    });

    if (!originalTx) throw new Error('Transaction not found');
    if (originalTx.status !== 'success') {
      throw new Error('Only successful transactions can be reversed');
    }

    // Fraud check on reversal
    if (originalTx.type === 'debit' && originalTx.amount > 50000) {
      await FraudCase.create({
        type: 'large_reversal',
        transactionId: originalTx.id,
        amount: originalTx.amount,
        userId: originalTx.userId
      }, { transaction });
    }

    try {
      const token = await this.authenticate();
      const reversalRef = `REV-${reference}-${Date.now()}`;

      const response = await axios.post(
        'https://api.vfdtech.ng/transactions/reverse',
        {
          original_reference: reference,
          reference: reversalRef,
          reason
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Client-ID': process.env.VFD_CLIENT_ID
          }
        }
      );

      // Record reversal
      await Transaction.create({
        userId: originalTx.userId,
        amount: originalTx.amount,
        type: 'reversal',
        status: 'success',
        reference: reversalRef,
        metadata: {
          originalReference: reference,
          reason,
          vfdReference: response.data.reversalId
        }
      }, { transaction });

      // Adjust wallet balance if debit reversal
      if (originalTx.type === 'debit') {
        await Wallet.increment('balance', {
          by: originalTx.amount,
          where: { userId: originalTx.userId },
          transaction
        });
      }

      return true;

    } catch (err) {
      logger.error('Reversal failed:', {
        reference,
        error: err.response?.data || err.message
      });

      await Transaction.create({
        userId: originalTx.userId,
        amount: originalTx.amount,
        type: 'reversal',
        status: 'failed',
        reference: `FAILED-REV-${reference}`,
        metadata: {
          error: err.response?.data?.message || 'Reversal failed',
          originalReference: reference
        }
      }, { transaction });

      throw new Error('Reversal processing failed');
    }
  },


  // Process reversal webhooks
  processReversalWebhook: async (data) => {
    await sequelize.transaction(async (t) => {
      const originalTx = await Transaction.findOne({
        where: { reference: data.original_reference },
        transaction: t
      });

      if (!originalTx) return;

      await Transaction.update(
        { status: 'reversed' },
        { where: { id: originalTx.id }, transaction: t }
      );

      await Notification.create({
        userId: originalTx.userId,
        title: 'Transaction Reversed',
        message: `Transaction ${data.original_reference} was reversed: ${data.reason}`,
        type: 'reversal'
      }, { transaction: t });
    });
  }
}