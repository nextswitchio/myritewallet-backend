const { AjoGroup, AjoMember, User, Transaction, Notification, UserLocation, sequelize } = require('../models');
const { Op } = require('sequelize');
const { calculateFee } = require('../utils/feeCalculator');
const { sendSMS, sendPushNotification } = require('../utils/notificationService');
const vfdService = require('../services/vfdService');

module.exports = {
  // Create new Ajo group
  createGroup: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { title, amount, frequency, slots, startDate, latitude, longitude, description } = req.body;

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

      const group = await AjoGroup.create({
        title,
        description,
        contributionAmount: amount,
        frequency,
        slots,
        startDate,
        location: sequelize.fn('ST_GeomFromText', `POINT(${longitude} ${latitude})`),
        creatorId: req.user.id,
        status: 'pending'
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

  // Join an Ajo group
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

      // Assign slot (prioritize slots 1-5 for Level 2+ users)
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

  // Handle contributions
  contribute: async (req, res) => {
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
        return res.status(400).json({ error: 'Already contributed this cycle' });
      }

      // Calculate fee (5%/10%/20%)
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
        reference: `AC-${Date.now()}`
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
        nextPayoutDate: calculateNextPayoutDate(group)
      });

    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Get recommended groups
  getRecommendedGroups: async (req, res) => {
    try {
      const recommended = await recommendGroupsForUser(req.user.id);
      res.json(recommended);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Process payout (cron job)
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
      const penaltyAmount = group.contributionAmount * 0.1; // 10% penalty
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

      // Charge penalties to defaulters
      await Promise.all(defaulters.map(async (member) => {
        await vfdService.debitUser(
          member.userId,
          penaltyAmount,
          `Ajo penalty for ${group.title}`,
          t
        );
        await Notification.create({
          userId: member.userId,
          title: 'Penalty Charged',
          message: `₦${penaltyAmount} deducted for missing contribution to ${group.title}`,
          type: 'penalty'
        }, { transaction: t });
      }));

      // Record transactions
      await Transaction.create({
        userId: recipient.userId,
        ajoId,
        amount: payoutAmount,
        type: 'ajo_payout',
        status: 'success',
        reference: `AP-${Date.now()}`
      }, { transaction: t });

      await Promise.all(defaulters.map(member => 
        Transaction.create({
          userId: member.userId,
          ajoId,
          amount: penaltyAmount,
          type: 'penalty',
          status: 'success',
          reference: `PEN-${Date.now()}`
        }, { transaction: t })
      ));

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

      await t.commit();

    } catch (err) {
      await t.rollback();
      console.error(`Payout failed for Ajo ${ajoId}:`, err);
      throw err;
    }
  },
};

// ======================
// Helpers
// ======================

// Calculate next contribution date
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

// Calculate next payout date
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
}

// Recommendation algorithm
async function recommendGroupsForUser(userId) {
  const user = await User.findByPk(userId, {
    include: [{
      model: AjoMember,
      as: 'ajoMemberships',
      include: [{
        model: AjoGroup,
        as: 'group'
      }]
    }],
    attributes: ['id', 'profileLevel', 'lastLoginLocation']
  });

  // 1. Groups with similar contribution amounts
  const userGroups = user.ajoMemberships.map(m => m.group);
  const avgAmount = userGroups.reduce((sum, g) => sum + g.contributionAmount, 0) / 
                   (userGroups.length || 1);
  const amountRange = [avgAmount * 0.7, avgAmount * 1.3];

  const similarGroups = await AjoGroup.findAll({
    where: {
      contributionAmount: { [Op.between]: amountRange },
      status: 'active',
      id: { [Op.notIn]: userGroups.map(g => g.id) }
    },
    include: [{
      model: AjoMember,
      as: 'members',
      attributes: ['id']
    }],
    order: [[sequelize.literal('COUNT(members.id)'), 'DESC']],
    group: ['AjoGroup.id'],
    limit: 5
  });

  // 2. Nearby groups (within 50km)
  let nearbyGroups = [];
  if (user.lastLoginLocation) {
    nearbyGroups = await AjoGroup.findAll({
      where: sequelize.where(
        sequelize.fn(
          'ST_DWithin',
          sequelize.col('location'),
          sequelize.fn('ST_SetSRID', 
            sequelize.fn('ST_MakePoint', 
              user.lastLoginLocation.coordinates[0],
              user.lastLoginLocation.coordinates[1]
            ),
            4326
          ),
          50000 // 50km in meters
        ),
        true
      ),
      status: 'active',
      id: { [Op.notIn]: userGroups.map(g => g.id) }
    });
  }

  // 3. Groups with friends (pseudo-implementation)
  const friendsGroups = await getFriendsGroups(userId);

  // Combine and deduplicate
  const allGroups = [...similarGroups, ...nearbyGroups, ...friendsGroups];
  const uniqueGroups = allGroups.filter(
    (g, i) => allGroups.findIndex(gr => gr.id === g.id) === i
  );

  return uniqueGroups.slice(0, 10); // Return top 10
}

// Mock friends groups (implement with real social graph)
async function getFriendsGroups(userId) {
  // In a real app, query your social graph here
  return [];
}