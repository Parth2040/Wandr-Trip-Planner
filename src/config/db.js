const mongoose = require('mongoose');

const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn('MONGO_URI missing. Wandr will run without database features.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for Wandr');
    return true;
  } catch (error) {
    console.warn('MongoDB not reachable. Wandr trip generation still works, but auth/save features are disabled.');
    return false;
  }
};

module.exports = connectDb;
