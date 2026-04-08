const createApp = require('../src/app');
const connectDB = require('../src/config/db');
const seedDefaults = require('../src/utils/seedDefaults');

const app = createApp();
let initialized = false;

async function init() {
  if (initialized) {
    return;
  }

  try {
    await connectDB(process.env.MONGODB_URI);
    if (process.env.ENABLE_SEED === 'true') {
      await seedDefaults();
    }
    global.__dbAvailable = true;
  } catch (error) {
    global.__dbAvailable = false;
    console.warn(`Database connection failed, running in fallback mode: ${error.message}`);
  }

  initialized = true;
}

module.exports = async (req, res) => {
  await init();
  return app(req, res);
};
