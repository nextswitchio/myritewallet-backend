module.exports = (req, res, next) => {
  try {
    // Check if the user's account is active
    if (req.user.status !== 'active') {
      return res.status(403).json({
        error: 'Your account is not active. Please contact support.',
      });
    }

    next();
  } catch (err) {
    console.error('Error checking user status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};