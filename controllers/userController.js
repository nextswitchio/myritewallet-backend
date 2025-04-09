const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const sequelize = require('sequelize');
const { User, Wallet, Notification, UserLocation, Transaction } = require('../models');
const { sendSMS, sendEmail } = require('../utils/notification');
const { generateOTP } = require('../utils/helpers');
const { validateUserLogin, validateUserRegistration } = require('../middlewares/validation');

module.exports = {
  // User Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      const { error } = validateUserLogin(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      // Check if user is verified
      if (user.status !== 'active') return res.status(403).json({ message: 'Account not verified' });

      // Generate JWT
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Update last login location
      const { latitude, longitude, ipAddress } = req.body;
      if (latitude && longitude && ipAddress) {
        await UserLocation.create({
          userId: user.id,
          latitude,
          longitude,
          ipAddress
        });

        await user.update({
          lastLoginLocation: sequelize.fn('ST_MakePoint', longitude, latitude)
        });
      }

      // Create a login notification
      await Notification.create({
        userId: user.id,
        type: 'login',
        message: 'You have successfully logged in.',
        status: 'unread'
      });

      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  // Biometric Login
  biometricLogin: async (req, res) => {
    try {
      const { userId, fingerprintHash } = req.body;

      // Find user
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Verify fingerprint hash (this assumes the fingerprint hash is stored in the database)
      if (user.fingerprintHash !== fingerprintHash) {
        return res.status(400).json({ message: 'Invalid fingerprint data' });
      }

      // Check if user is verified
      if (user.status !== 'active') return res.status(403).json({ message: 'Account not verified' });

      // Generate JWT
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Create a biometric login notification
      await Notification.create({
        userId: user.id,
        type: 'biometric_login',
        message: 'You have successfully logged in using biometrics.',
        status: 'unread'
      });

      res.status(200).json({ message: 'Biometric login successful', token });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  // User Registration
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, phone, password } = req.body;

      // Validate Nigerian number
      if (!phone.startsWith('+234')) {
        return res.status(400).json({ error: 'Only Nigerian numbers allowed' });
      }

      // Validate input
      const { error } = validateUserRegistration(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      // Check if user already exists
      const existingUser = await User.findOne({ where: { [sequelize.Op.or]: [{ email }, { phone }] } });
      if (existingUser) return res.status(400).json({ message: 'User already exists' });

      // Generate OTP and hash password
      const otp = generateOTP();
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        otp,
        points: 50, // Registration bonus
        status: 'inactive'
      });

      // Create wallet
const wallet = await Wallet.create({ userId: user.id, balance: 0 });

      // Record wallet creation as a transaction
      await Transaction.create({
        userId: user.id,
        type: 'wallet_creation',
        amount: 0,
        status: 'success',
        description: 'Wallet created during registration'
      });

      // Send OTP via email/SMS
      await sendEmail(email, 'Verify Your Account', `Your OTP is ${otp}`);
      await sendSMS(phone, `Your myRite OTP: ${otp}`);

      // Create a registration notification
      await Notification.create({
        userId: user.id,
        type: 'registration',
        message: 'Welcome to MyRite Wallet! Please verify your account.',
        status: 'unread'
      });

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


  //Social Login (Google)
  googleLogin: async (req, res) => {
    try {
      const { token } = req.body;

      // Verify Google token
      const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      const { email, name, picture } = response.data;

      // Check if user exists
      let user = await User.findOne({ where: { email } });
      if (!user) {
        // Create new user
        user = await User.create({
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1] || '',
          email,
          profilePicture: picture,
          status: 'active',
          points: 50 // Registration bonus
        });

        // Create wallet
        await Wallet.create({ userId: user.id, balance: 0 });

        // Record wallet creation as a transaction
        await Transaction.create({
          userId: user.id,
          type: 'wallet_creation',
          amount: 0,
          status: 'success',
          description: 'Wallet created during Google login'
        });

        // Create a registration notification
        await Notification.create({
          userId: user.id,
          type: 'registration',
          message: 'Welcome to MyRite Wallet! Your account has been created via Google login.',
          status: 'unread'
        });
      }

      // Generate JWT
      const tokenJWT = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(200).json({ message: 'Google login successful', token: tokenJWT });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  // Social Login (Facebook)
  facebookLogin: async (req, res) => {
    try {
      const { token } = req.body;

      // Verify Facebook token
      const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`);
      const { email, name, picture } = response.data;

      // Check if user exists
      let user = await User.findOne({ where: { email } });
      if (!user) {
        // Create new user
        user = await User.create({
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1] || '',
          email,
          profilePicture: picture.data.url,
          status: 'active',
          points: 50 // Registration bonus
        });

        // Create wallet
        await Wallet.create({ userId: user.id, balance: 0 });

        // Record wallet creation as a transaction
        await Transaction.create({
          userId: user.id,
          type: 'wallet_creation',
          amount: 0,
          status: 'success',
          description: 'Wallet created during Facebook login'
        });

        // Create a registration notification
        await Notification.create({
          userId: user.id,
          type: 'registration',
          message: 'Welcome to MyRite Wallet! Your account has been created via Facebook login.',
          status: 'unread'
        });
      }

      // Generate JWT
      const tokenJWT = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(200).json({ message: 'Facebook login successful', token: tokenJWT });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  // Social Login (Apple)
  appleLogin: async (req, res) => {
    try {
      const { token, email, fullName } = req.body;

      // Verify Apple token (this is a simplified example; Apple token verification may require additional steps)
      const response = await axios.post('https://appleid.apple.com/auth/token', {
        client_id: process.env.APPLE_CLIENT_ID,
        client_secret: process.env.APPLE_CLIENT_SECRET,
        code: token,
        grant_type: 'authorization_code'
      });

      if (!response.data.id_token) {
        return res.status(400).json({ message: 'Invalid Apple token' });
      }

      // Check if user exists
      let user = await User.findOne({ where: { email } });
      if (!user) {
        // Create new user
        user = await User.create({
          firstName: fullName.givenName,
          lastName: fullName.familyName || '',
          email,
          status: 'active',
          points: 50 // Registration bonus
        });

        // Create wallet
        await Wallet.create({ userId: user.id, balance: 0 });

        // Record wallet creation as a transaction
        await Transaction.create({
          userId: user.id,
          type: 'wallet_creation',
          amount: 0,
          status: 'success',
          description: 'Wallet created during Apple login'
        });

        // Create a registration notification
        await Notification.create({
          userId: user.id,
          type: 'registration',
          message: 'Welcome to MyRite Wallet! Your account has been created via Apple login.',
          status: 'unread'
        });
      }

      // Generate JWT
      const tokenJWT = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(200).json({ message: 'Apple login successful', token: tokenJWT });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
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

      await user.update({ status: 'active', otp: null });
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

  // Forgot Password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Generate OTP and send email
      const otp = generateOTP();
      await sendEmail(email, 'Reset Your Password', `Your OTP is ${otp}`);

      // Save OTP to user record
      user.otp = otp;
      await user.save();

      res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  // Reset Password
  resetPassword: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Check OTP
      if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear OTP
      user.password = hashedPassword;
      user.otp = null;
      await user.save();

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  // Update Profile
  updateProfile: async (req, res) => {
    try {
      const { firstName, lastName, phoneNumber, profilePicture } = req.body;
      const userId = req.user.id;

      // Update user profile
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.profilePicture = profilePicture || user.profilePicture;

      await user.save();

      res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  // Complete KYC
  completeKYC: async (req, res) => {
    try {
      const { bvn, bankAccount, bankCode } = req.body;

      // Verify with VFD API
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

      // Record KYC points addition as a transaction
      await Transaction.create({
        userId: req.user.id,
        type: 'points_addition',
        amount: 100,
        status: 'success',
        description: 'Points added for completing KYC Level 1'
      });

      // Create a KYC completion notification
      await Notification.create({
        userId: req.user.id,
        type: 'kyc_completion',
        message: 'Your KYC has been successfully verified.',
        status: 'unread'
      });

      res.json({
        success: true,
        message: 'KYC verified successfully'
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Update Location
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
      res.status(400).json({ error: err.message })
}
  }
}