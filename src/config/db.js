const dns = require('node:dns');
const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  dns.setServers(['1.1.1.1', '8.8.8.8']);
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
  });
}

module.exports = connectDB;
