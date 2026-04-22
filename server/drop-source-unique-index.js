const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function dropUniqueIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('projectsources');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Try to drop the unique index on name field
    try {
      await collection.dropIndex('name_1');
      console.log('✓ Successfully dropped unique index on name field');
    } catch (error) {
      if (error.code === 27) {
        console.log('✓ Index does not exist (already dropped or never created)');
      } else {
        console.error('Error dropping index:', error.message);
      }
    }

    // Verify indexes after drop
    const indexesAfter = await collection.indexes();
    console.log('Indexes after drop:', indexesAfter);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropUniqueIndex();
