const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const bookingRoutes = require('./routes/booking.routes');
const chatRoutes = require('./routes/chat.routes');
const complaintsRoutes = require('./routes/complaints.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const healthRoutes = require('./routes/health.routes');
const seedRoutes = require('./routes/seed.routes');

function createApp() {
  const app = express();

  app.use(helmet());
  const configuredOrigin = process.env.CLIENT_ORIGIN;
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (!configuredOrigin || configuredOrigin === '*') {
          return callback(null, true);
        }

        const isConfiguredOrigin = origin === configuredOrigin;
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

        if (isConfiguredOrigin || isLocalhost) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      },
    })
  );
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Hostel API is live',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/complaints', complaintsRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/seed', seedRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
}

module.exports = createApp;
