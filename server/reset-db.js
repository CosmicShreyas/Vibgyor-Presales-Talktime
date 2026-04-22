const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the entire database to start fresh
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully');

    console.log('Database reset completed. Run "npm run setup" to create users.');

  } catch (error) {
    console.error('Reset failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetDatabase();