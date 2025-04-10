module.exports = (actionName) => {
  return (req, res, next) => {
    try {
      // Log the admin action for auditing purposes
      console.log(`Admin Action: ${actionName}`);
      console.log(`Admin ID: ${req.user?.id || 'Unknown'}`);
      console.log(`Request Body:`, req.body);

      // Optionally, you can add more validation logic here
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized admin action' });
      }

      next();
    } catch (err) {
      console.error('Admin action validation error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};