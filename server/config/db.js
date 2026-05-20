const mongoose = require('mongoose');

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri || uri.includes('<username>')) {
      throw new Error('MONGO_URI is not set. Edit server/.env and provide your MongoDB Atlas connection string.');
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
