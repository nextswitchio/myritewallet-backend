const { AjoGroup, AjoMember, User, Transaction, Notification, Dispute, sequelize } = require('../models');
const { Op } = require('sequelize');
const { calculateFee, calculatePenalty } = require('../utils/feeCalculator');
const { sendSMS, sendPushNotification } = require('../utils/notificationService');
const vfdService = require('../services/vfdService');
const { getRecommendedGroups } = require('../services/recommendationService');

module.exports = {
  // Create new Ajo group with enhanced validation
  createGroup: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { title, amount, frequency, slots, startDate, latitude, longitude, description, earlySlotsReserved } = req.body;

      // Validate creator level
      if (req.user.profileLevel < 2) {
        await t.rollback();
        return res.status(403).json({ error: 'Profile Level 2+ required to create groups' });
      }

      // Validate slots (5-30)
      if (slots < 5 || slots > 30) {
        await t.rollback();
        return res.status(400).json({ error: 'Group must have 5-30 slots' });
      }

      // Validate start date (must be at least 24 hours in future)
      if (new Date(startDate) < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        await t.rollback();
        return res.status(400).json({ error: 'Start date must be at least 24 hours from now' });
      }

      const group = await AjoGroup.create({
        title,
        description,
        contributionAmount: amount,
        frequency,
        slots,
        startDate,
        earlySlotsReserved: earlySlotsReserved || false,
        location: sequelize.fn('ST_GeomFromText', `POINT(${longitude} ${latitude})`),
        creatorId: req.user.id,
        status: 'pending',
        currentSlot: 1
      }, { transaction: t });

      // Creator auto-joins as admin in slot 1
      await AjoMember.create({
        userId: req.user.id,
        ajoId: group.id,
        slotNumber: 1,
        isAdmin: true,
        hasPaid: false
      }, { transaction: t });

      // Award points
      await User.increment('points', {
        by: 25,
        where: { id: req.user.id },
        transaction: t
      });

      await t.commit();

      // Notify creator
      await sendPushNotification(req.user.id, {
        title: 'Ajo Group Created',
        body: `Your ${frequency} ₦${amount} group "${title}" is ready!`
      });

      res.status(201).json(group);

    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Join an Ajo group with enhanced slot allocation
  joinGroup: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { ajoId } = req.params;
      const group = await AjoGroup.findByPk(ajoId, { transaction: t });

      // Validate group
      if (!group || group.status !== 'active') {
        await t.rollback();
        return res.status(400).json({ error: 'Group not available for joining' });
      }

      // Check if user is already a member
      const existingMember = await AjoMember.findOne({
        where: { userId: req.user.id, ajoId },
        transaction: t
      });
      if (existingMember) {
        await t.rollback();
        return res.status(400).json({ error: 'Already a member of this group' });
      }

      // Check if group is full
      const memberCount = await AjoMember.count({
        where: { ajoId },
        transaction: t
      });
      if (memberCount >= group.slots) {
        await t.rollback();
        return res.status(400).json({ error: 'Group is full' });
      }

      // Assign slot (prioritize slots 1-5 for Level 2+ users if reserved)
      let slotNumber = memberCount + 1;
      if (req.user.profileLevel >= 2 && group.earlySlotsReserved) {
        const earlySlots = [1, 2, 3, 4, 5];
        const takenSlots = await AjoMember.findAll({
          where: { ajoId, slotNumber: { [Op.in]: earlySlots } },
          attributes: ['slotNumber'],
          transaction: t
        });
        const availableSlots = earlySlots.filter(slot => 
          !takenSlots.some(s => s.slotNumber === slot)
        );
        if (availableSlots.length > 0) slotNumber = availableSlots[0];
      }

      // Add user to group
      await AjoMember.create({
        userId: req.user.id,
        ajoId,
        slotNumber,
        hasPaid: false
      }, { transaction: t });

      // Notify group admin
      const admin = await AjoMember.findOne({
        where: { ajoId, isAdmin: true },
        transaction: t
      });
      await Notification.create({
        userId: admin.userId,
        title: 'New Member Joined',
        message: `${req.user.firstName} joined ${group.title} (Slot ${slotNumber})`,
        type: 'ajo'
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        slotNumber,
        nextContributionDate: calculateNextContributionDate(group)
      });

    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Handle contributions with fee calculation
  contribute: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { ajoId } = req.params;
      const { pin } = req.body; // Transaction PIN verification
      
      // Verify transaction PIN
      if (!req.user.verifyPin(pin)) {
        await t.rollback();
        return res.status(403).json({ error: 'Invalid transaction PIN' });
      }

      const group = await AjoGroup.findByPk(ajoId, { transaction: t });
      const member = await AjoMember.findOne({
        where: { userId: req.user.id, ajoId },
        transaction: t
      });

      // Validate
      if (!group || group.status !== 'active') {
        await t.rollback();
        return res.status(400).json({ error: 'Group not active' });
      }
      if (!member) {
        await t.rollback();
        return res.status(403).json({ error: 'Not a group member' });
      }
      if (member.hasPaid) {
        await t.rollback();
        return res.status(400).json({ error: 'Already contributed this cycle' });
      }

      // Calculate fee based on amount
      const fee = calculateFee(group.contributionAmount);
      const totalAmount = group.contributionAmount + fee;

      // Verify wallet balance
      const wallet = await Wallet.findOne({
        where: { userId: req.user.id },
        transaction: t
      });
      if (wallet.balance < totalAmount) {
        await t.rollback();
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Process payment via VFD
      const paymentSuccess = await vfdService.debitUser(
        req.user.id,
        totalAmount,
        `Ajo contribution to ${group.title}`,
        t
      );
      if (!paymentSuccess) {
        await t.rollback();
        throw new Error('Payment processing failed');
      }

      // Update records
      await member.update({ hasPaid: true }, { transaction: t });
      await Transaction.create({
        userId: req.user.id,
        ajoId,
        amount: group.contributionAmount,
        fee,
        type: 'ajo_contribution',
        status: 'success',
        reference: `AC-${Date.now()}`,
        metadata: {
          feePercentage: fee / group.contributionAmount * 100,
          groupTitle: group.title
        }
      }, { transaction: t });

      // Award points
      await User.increment('points', {
        by: 5,
        where: { id: req.user.id },
        transaction: t
      });

      // Notify admin
      await Notification.create({
        userId: group.creatorId,
        title: 'Contribution Received',
        message: `${req.user.firstName} paid ₦${group.contributionAmount} to ${group.title}`,
        type: 'ajo'
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        amount: group.contributionAmount,
        fee,
        nextPayoutDate: calculateNextPayoutDate(group),
        pointsEarned: 5
      });

    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Get recommended groups with enhanced algorithm
  getRecommendedGroups: async (req, res) => {
    try {
      const recommended = await getRecommendedGroups(req.user.id);
      res.json(recommended);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Resolve a dispute
  resolveDispute: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { disputeId } = req.params;
      const { resolution, adminComment } = req.body;

      const dispute = await Dispute.findByPk(disputeId, { transaction: t });
      if (!dispute) {
        await t.rollback();
        return res.status(404).json({ error: 'Dispute not found' });
      }

      // Validate admin privileges
      const group = await AjoGroup.findByPk(dispute.ajoId, { transaction: t });
      if (group.creatorId !== req.user.id) {
        await t.rollback();
        return res.status(403).json({ error: 'Only the group admin can resolve disputes' });
      }

      // Update dispute status
      await dispute.update({
        status: 'resolved',
        resolution,
        adminComment
      }, { transaction: t });

      // Notify involved user
      await Notification.create({
        userId: dispute.userId,
        title: 'Dispute Resolved',
        message: `Your dispute for Ajo group "${group.title}" has been resolved: ${resolution}`,
        type: 'dispute'
      }, { transaction: t });

      await t.commit();

      res.json({ success: true, message: 'Dispute resolved successfully' });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Get disputes for a group or user
  getDisputes: async (req, res) => {
    try {
      const { ajoId } = req.query;

      const where = ajoId ? { ajoId } : { userId: req.user.id };
      const disputes = await Dispute.findAll({
        where,
        include: [
          { model: AjoGroup, as: 'ajo', attributes: ['title'] },
          { model: User, as: 'user', attributes: ['firstName', 'lastName'] }
        ]
      });

      res.json(disputes);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Leave an Ajo group
  leaveGroup: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { ajoId } = req.params;

      const group = await AjoGroup.findByPk(ajoId, { transaction: t });
      const member = await AjoMember.findOne({
        where: { userId: req.user.id, ajoId },
        transaction: t
      });

      // Validate
      if (!group || group.status !== 'active') {
        await t.rollback();
        return res.status(400).json({ error: 'Group not active' });
      }
      if (!member) {
        await t.rollback();
        return res.status(403).json({ error: 'Not a group member' });
      }
      if (member.hasPaid) {
        await t.rollback();
        return res.status(400).json({ error: 'Cannot leave group after contributing' });
      }

      // Remove member from group
      await member.destroy({ transaction: t });

      // Notify admin
      await Notification.create({
        userId: group.creatorId,
        title: 'Member Left Group',
        message: `${req.user.firstName} has left the group "${group.title}".`,
        type: 'ajo'
      }, { transaction: t });

      await t.commit();

      res.json({ success: true, message: 'You have left the group successfully' });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Enhanced notifications for group updates
  notifyGroupUpdate: async (ajoId, message, t) => {
    const members = await AjoMember.findAll({
      where: { ajoId },
      attributes: ['userId'],
      transaction: t
    });

    await Promise.all(members.map(member =>
      Notification.create({
        userId: member.userId,
        title: 'Group Update',
        message,
        type: 'ajo'
      }, { transaction: t })
    ));
  },

  // Process payout (cron job) with enhanced penalty handling
  processPayout: async (ajoId) => {
    const t = await sequelize.transaction();
    try {
      const group = await AjoGroup.findByPk(ajoId, {
        include: [{
          model: AjoMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'firstName']
          }]
        }],
        transaction: t
      });

      // Validate
      if (!group || group.status !== 'active') {
        throw new Error('Group not active');
      }

      // Get recipient (current slot)
      const recipient = group.members.find(m => 
        m.slotNumber === group.currentSlot
      );
      if (!recipient) {
        throw new Error('No recipient found for slot');
      }

      // Calculate payout (deduct penalties)
      const defaulters = group.members.filter(m => !m.hasPaid);
      const penaltyAmount = calculatePenalty(group.contributionAmount);
      const payoutAmount = (group.contributionAmount * group.members.length) - 
                         (penaltyAmount * defaulters.length);

      // Credit recipient
      const payoutSuccess = await vfdService.creditUser(
        recipient.userId,
        payoutAmount,
        `Ajo payout for ${group.title}`,
        t
      );
      if (!payoutSuccess) {
        throw new Error('Payout failed');
      }

      // Charge penalties to defaulters and create disputes
      await Promise.all(defaulters.map(async (member) => {
        // Charge penalty
        await vfdService.debitUser(
          member.userId,
          penaltyAmount,
          `Ajo penalty for ${group.title}`,
          t
        );
        
        // Record penalty transaction
        await Transaction.create({
          userId: member.userId,
          ajoId,
          amount: penaltyAmount,
          type: 'penalty',
          status: 'success',
          reference: `PEN-${Date.now()}`,
          metadata: { groupTitle: group.title }
        }, { transaction: t });
        
        // Create dispute record
        await Dispute.create({
          ajoId,
          userId: member.userId,
          amount: penaltyAmount,
          type: 'missed_contribution',
          status: 'open'
        }, { transaction: t });
        
        // Notify defaulter
        await Notification.create({
          userId: member.userId,
          title: 'Penalty Charged',
          message: `₦${penaltyAmount} deducted for missing contribution to ${group.title}`,
          type: 'penalty'
        }, { transaction: t });
      }));

      // Record payout transaction
      await Transaction.create({
        userId: recipient.userId,
        ajoId,
        amount: payoutAmount,
        type: 'ajo_payout',
        status: 'success',
        reference: `AP-${Date.now()}`,
        metadata: { 
          groupTitle: group.title,
          slotNumber: group.currentSlot,
          totalContributions: group.members.length,
          totalPenalties: defaulters.length
        }
      }, { transaction: t });

      // Rotate slot
      const nextSlot = group.currentSlot === group.slots ? 1 : group.currentSlot + 1;
      await group.update({
        currentSlot: nextSlot,
        status: nextSlot === 1 ? 'completed' : 'active'
      }, { transaction: t });

      // Reset payments for next cycle
      await AjoMember.update(
        { hasPaid: false },
        { where: { ajoId }, transaction: t }
      );

      // Notify recipient
      await Notification.create({
        userId: recipient.userId,
        title: 'Ajo Payout Received',
        message: `₦${payoutAmount} paid out from ${group.title}`,
        type: 'payout'
      }, { transaction: t });

      // Enable recipient's withdrawals immediately
      await User.update(
        { withdrawalStatus: 'active' },
        { where: { id: recipient.userId }, transaction: t }
      );

      // Notify all members of next cycle
      await Promise.all(group.members.map(member => 
        Notification.create({
          userId: member.userId,
          title: 'New Cycle Started',
          message: `Next contribution for ${group.title} due on ${calculateNextContributionDate(group)}`,
          type: 'ajo'
        }, { transaction: t })
      ));

      await t.commit();

    } catch (err) {
      await t.rollback();
      console.error(`Payout failed for Ajo ${ajoId}:`, err);
      throw err;
    }
  },

  // Handle early exit from group
  earlyExit: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { ajoId } = req.params;
      const { reason } = req.body;
      
      const group = await AjoGroup.findByPk(ajoId, { transaction: t });
      const member = await AjoMember.findOne({
        where: { userId: req.user.id, ajoId },
        transaction: t
      });
      
      // Validate
      if (!group || group.status !== 'active') {
        await t.rollback();
        return res.status(400).json({ error: 'Group not active' });
      }
      if (!member) {
        await t.rollback();
        return res.status(403).json({ error: 'Not a group member' });
      }
      
      // Calculate penalty (50% of contribution)
      const penaltyAmount = group.contributionAmount * 0.5;
      
      // Charge penalty
      const penaltySuccess = await vfdService.debitUser(
        req.user.id,
        penaltyAmount,
        `Early exit penalty from ${group.title}`,
        t
      );
      if (!penaltySuccess) {
        await t.rollback();
        throw new Error('Penalty charge failed');
      }
      
      // Record penalty transaction
      await Transaction.create({
        userId: req.user.id,
        ajoId,
        amount: penaltyAmount,
        type: 'early_exit_penalty',
        status: 'success',
        reference: `EEP-${Date.now()}`,
        metadata: { groupTitle: group.title, reason }
      }, { transaction: t });
      
      // Remove member from group
      await member.destroy({ transaction: t });
      
      // Notify admin
      await Notification.create({
        userId: group.creatorId,
        title: 'Member Early Exit',
        message: `${req.user.firstName} exited ${group.title} (Slot ${member.slotNumber})`,
        type: 'ajo'
      }, { transaction: t });
      
      await t.commit();
      res.json({ success: true, penaltyAmount });
      
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Get group details
  getGroup: async (req, res) => {
    try {
      const { ajoId } = req.params;
      
      const group = await AjoGroup.findByPk(ajoId, {
        include: [
          {
            model: AjoMember,
            as: 'members',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'profileLevel']
            }]
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });
      
      if (!group) throw new Error('Group not found');
      
      // Check if user is member
      const isMember = group.members.some(m => m.userId === req.user.id);
      
      res.json({
        ...group.toJSON(),
        isMember,
        nextPayoutDate: calculateNextPayoutDate(group),
        nextContributionDate: calculateNextContributionDate(group)
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get user's groups
  getUserGroups: async (req, res) => {
    try {
      const { status } = req.query;
      
      const where = {};
      if (status) where.status = status;
      
      const groups = await AjoGroup.findAll({
        include: [{
          model: AjoMember,
          as: 'members',
          where: { userId: req.user.id },
          attributes: ['slotNumber', 'hasPaid', 'isAdmin']
        }],
        where,
        order: [['startDate', 'DESC']]
      });
      
      res.json(groups);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Search groups
  searchGroups: async (req, res) => {
    try {
      const { q, frequency, amountMin, amountMax, slotsMin, slotsMax, location, radius } = req.query;
      
      const where = {
        status: 'active'
      };
      
      if (q) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } }
        ];
      }
      
      if (frequency) where.frequency = frequency;
      if (amountMin) where.contributionAmount = { [Op.gte]: amountMin };
      if (amountMax) where.contributionAmount = { ...where.contributionAmount, [Op.lte]: amountMax };
      if (slotsMin) where.slots = { [Op.gte]: slotsMin };
      if (slotsMax) where.slots = { ...where.slots, [Op.lte]: slotsMax };
      
      let locationFilter;
      if (location && radius) {
        const [latitude, longitude] = location.split(',');
        locationFilter = sequelize.where(
          sequelize.fn(
            'ST_DWithin',
            sequelize.col('location'),
            sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326),
            radius * 1000 // Convert km to meters
          ),
          true
        );
      }
      
      const groups = await AjoGroup.findAll({
        where: {
          ...where,
          ...(locationFilter && { [Op.and]: [locationFilter] })
        },
        include: [{
          model: AjoMember,
          as: 'members',
          attributes: ['userId'],
          where: { userId: { [Op.not]: req.user.id } } // Exclude groups user is already in
        }],
        order: [['createdAt', 'DESC']]
      });
      
      res.json(groups);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

// Helper functions
function calculateNextContributionDate(group) {
  const date = new Date(group.startDate);
  switch (group.frequency) {
    case 'daily':
      date.setDate(date.getDate() + group.currentSlot);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (group.currentSlot * 7));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + group.currentSlot);
      break;
  }
  return date;
}

function calculateNextPayoutDate(group) {
  const date = new Date(group.startDate);
  switch (group.frequency) {
    case 'daily':
      date.setDate(date.getDate() + group.currentSlot + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (group.currentSlot * 7) + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + group.currentSlot + 1);
      break;
  }
  return date;
};