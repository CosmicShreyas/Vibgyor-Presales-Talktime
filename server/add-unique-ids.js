require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('./models/Client');

// Function to generate unique ID
const generateUniqueId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}-${random}`;
};

const addUniqueIds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all clients without uniqueId
    const clientsWithoutId = await Client.find({ 
      $or: [
        { uniqueId: { $exists: false } },
        { uniqueId: null },
        { uniqueId: '' }
      ]
    });

    console.log(`Found ${clientsWithoutId.length} clients without unique IDs`);

    // Add unique IDs to each client
    for (const client of clientsWithoutId) {
      let uniqueId;
      let isUnique = false;
      
      // Keep generating until we get a unique ID
      while (!isUnique) {
        uniqueId = generateUniqueId();
        const existing = await Client.findOne({ uniqueId });
        if (!existing) {
          isUnique = true;
        }
      }
      
      client.uniqueId = uniqueId;
      await client.save();
      console.log(`Added unique ID ${uniqueId} to client: ${client.name}`);
    }

    console.log('✅ Successfully added unique IDs to all clients');
    process.exit(0);
  } catch (error) {
    console.error('Error adding unique IDs:', error);
    process.exit(1);
  }
};

addUniqueIds();
