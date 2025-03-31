const cron = require('node-cron');
const { AjoGroup, CronLog, Notification } = require('../models');
const { processPayout } = require('../controllers/ajoController');
const { sendSMS } = require('../utils/smsService');
const { Op } = require('sequelize');

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 30 * 60 * 1000; // 30 minutes

// Track active retries
const retryQueue = new Map();

// Main payout scheduler
const schedulePayouts = cron.schedule('0 2 * * *', async () => {
  await runWithLogging('ajo_payouts', async () => {
    const activeGroups = await AjoGroup.findAll({
      where: {
        status: 'active',
        startDate: { [Op.lte]: new Date() }
      },
      include: [{ 
        model: AjoMember,
        as: 'members',
        attributes: ['userId', 'hasPaid']
      }]
    });

    for (const group of activeGroups) {
      if (isPayoutDay(group)) {
        try {
          await executePayout(group);
        } catch (err) {
          console.error(`Payout failed for Ajo ${group.id}:`, err);
          queueRetry(group);
        }
      }
    }
  });
});

// Execute a payout with retry logic
async function executePayout(group, attempt = 1) {
  try {
    await processPayout(group.id);
    
    // Notify admin on success
    await Notification.create({
      userId: 1, // Admin user ID
      title: 'Payout Processed',
      message: `Ajo ${group.title} payout completed successfully`,
      type: 'system'
    });

  } catch (err) {
    if (attempt <= MAX_RETRIES) {
      console.log(`Retrying (${attempt}/${MAX_RETRIES}) for Ajo ${group.id}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return executePayout(group, attempt + 1);
    }
    throw err; // Final failure
  }
}

// Queue failed payouts for retry
function queueRetry(group) {
  const retryId = `ajo_${group.id}_${Date.now()}`;
  
  retryQueue.set(retryId, {
    group,
    attempts: 0,
    timeout: setTimeout(async () => {
      try {
        await executePayout(group);
        retryQueue.delete(retryId);
      } catch (err) {
        console.error(`Retry failed for Ajo ${group.id}:`, err);
        notifyAdminFailure(group, err);
      }
    }, RETRY_DELAY_MS)
  });
}

// Notify admin of critical failures
async function notifyAdminFailure(group, error) {
  await Notification.create({
    userId: 1, // Admin user ID
    title: 'Payout Failure',
    message: `Ajo ${group.title} payout failed after retries: ${error.message}`,
    type: 'system',
    metadata: { ajoId: group.id }
  });

  await sendSMS(
    process.env.ADMIN_PHONE,
    `CRITICAL: Ajo ${group.id} payout failed. Manual intervention required.`
  );
}

// Helper: Check if today is payout day
function isPayoutDay(group) {
  const nextDate = calculateNextPayoutDate(group);
  return (
    new Date().toDateString() === nextDate.toDateString()
  );
}

// Helper: Calculate next payout date
function calculateNextPayoutDate(group) {
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

// Wrapper with logging
async function runWithLogging(jobName, task) {
  const log = await CronLog.create({ 
    jobName, 
    status: 'started',
    metadata: { pid: process.pid }
  });

  try {
    await task();
    await log.update({ status: 'completed' });
  } catch (err) {
    await log.update({ 
      status: 'failed',
      metadata: { ...log.metadata, error: err.message }
    });
    throw err;
  }
}

// Health check endpoint
function getCronStatus() {
  return {
    lastRun: schedulePayouts.lastDate(),
    nextRun: schedulePayouts.nextDate(),
    activeRetries: Array.from(retryQueue.keys())
  };
}

module.exports = { 
  startCronJobs: () => {
    schedulePayouts.start();
    console.log('Cron jobs started');
  },
  getCronStatus
};