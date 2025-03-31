const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Wallet, Notification, UserLocation } = require('../models');
const { sendSMS } = require('../utils/smsService');
const { generateOTP } = require('../utils/helpers');

module.exports = {
  // Register with OTP
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, phone, password } = req.body;

      // Validate Nigerian number
      if (!phone.startsWith('+234')) {
        return res.status(400).json({ error: 'Only Nigerian numbers allowed' });
      }

      const otp = generateOTP();
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        otp,
        points: 50 // Registration bonus
      });

      // Create wallet
      await Wallet.create({ userId: user.id, balance: 0 });

      // Send OTP via SMS
      await sendSMS(phone, `Your myRite OTP: ${otp}`);

      res.status(201).json({ 
        success: true,
        message: 'OTP sent to phone' 
      });

    } catch (err) {
      res.status(400).json({ 
        error: err.errors?.[0]?.message || err.message 
      });
    }
  },

  // Verify OTP
  verifyOTP: async (req, res) => {
    try {
      const { phone, otp } = req.body;
      const user = await User.findOne({ where: { phone } });

      if (!user || user.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      await user.update({ isVerified: true, otp: null });
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_EXPIRES_IN 
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          profileLevel: user.profileLevel
        }
      });

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Complete KYC
  completeKYC: async (req, res) => {
    try {
      const { bvn, bankAccount, bankCode } = req.body;
      
      // Verify with VFD API (pseudo-code)
      const verification = await axios.post(
        'https://api.vfdtech.ng/kyc/verify',
        { bvn, bankAccount, bankCode },
        { headers: { Authorization: `Bearer ${process.env.VFD_API_KEY}` } }
      );

      if (!verification.data.success) {
        throw new Error('KYC verification failed');
      }

      await req.user.update({
        isKYCVerified: true,
        bvn,
        bankAccount,
        bankCode,
        points: sequelize.literal('points + 100') // KYC Level 1 points
      });

      res.json({ 
        success: true,
        message: 'KYC verified successfully'
      });

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Update location
  updateLocation: async (req, res) => {
    try {
      const { latitude, longitude, ipAddress } = req.body;

      await UserLocation.create({
        userId: req.user.id,
        latitude,
        longitude,
        ipAddress
      });

      await req.user.update({
        lastLoginLocation: sequelize.fn('ST_MakePoint', longitude, latitude)
      });

      res.json({ success: true });

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};