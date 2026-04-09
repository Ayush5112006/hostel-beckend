require('dotenv').config();

const createApp = require('./app');
const connectDB = require('./config/db');
const seedDefaults = require('./utils/seedDefaults');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

async function startServer() {
  try {
    try {
      await connectDB(MONGODB_URI);
      if (process.env.ENABLE_SEED === 'true') {
        await seedDefaults();
      }
      global.__dbAvailable = true;
      console.log('Database connected');
    } catch (dbError) {
      global.__dbAvailable = false;
      console.warn(`Database connection failed: ${dbError.message}`);
    }

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error.message);
    process.exit(1);
  }
}

startServer();
