require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const { startCronJobs } = require('./services/cronService');

// Initialize Express
const app = express();

// ======================
// Middleware
// ======================
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// Database Connection
// ======================
sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('DB connection error:', err));

// ======================
// Routes
// ======================
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// ======================
// Error Handling
// ======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// ======================
// Server Start
// ======================
const PORT = process.env.PORT || 3000;
sequelize.sync({ alter: process.env.NODE_ENV !== 'production' })
  .then(() => {
    startCronJobs(); // Initialize scheduled jobs
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => console.error('DB sync error:', err));

module.exports = app; // For testing