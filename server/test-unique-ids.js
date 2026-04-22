require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('./models/Client');

const testUniqueIds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const clients = await Client.find().limit(5);
    
    console.log('Sample leads with unique IDs:');
    console.log('='.repeat(60));
    clients.forEach(c => {
      console.log(`Name: ${c.name}`);
      console.log(`Unique ID: ${c.uniqueId}`);
      console.log('-'.repeat(60));
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testUniqueIds();
