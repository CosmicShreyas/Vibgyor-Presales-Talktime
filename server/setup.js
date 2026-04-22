const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function setupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@talktime.com' });
    
    if (!existingAdmin) {
      // Create admin user (no employeeId required)
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@talktime.com',
        password: 'admin123', // This will be hashed by the pre-save middleware
        role: 'admin',
        isActive: true,
        isSystemAdmin: true // Mark as system admin - cannot be deleted
      });

      await adminUser.save();
      console.log('✓ Admin user created successfully!');
      console.log('  Email: admin@talktime.com');
      console.log('  Password: admin123');
      console.log('  Note: Admin users do not have an Employee ID');
      console.log('  Note: This is a system admin account and cannot be deleted');
    } else {
      // Update existing admin to be system admin if not already
      if (!existingAdmin.isSystemAdmin) {
        existingAdmin.isSystemAdmin = true;
        await existingAdmin.save();
        console.log('✓ Admin user updated to system admin (cannot be deleted)');
      } else {
        console.log('✓ Admin user already exists');
      }
    }

    // Create sample sales users
    const salesUsers = [
      {
        employeeId: 'VIB_001',
        name: 'John Sales',
        email: 'john@talktime.com',
        password: 'sales123',
        role: 'sales'
      },
      {
        employeeId: 'VIB_002',
        name: 'Sarah Mitchell',
        email: 'sarah@talktime.com',
        password: 'sales123',
        role: 'sales'
      },
      {
        employeeId: 'VIB_003',
        name: 'Mike Johnson',
        email: 'mike@talktime.com',
        password: 'sales123',
        role: 'sales'
      },
      {
        employeeId: 'VIB_004',
        name: 'Ajeeth',
        email: 'ajeeth@talktime.com',
        password: 'sales123',
        role: 'sales'
      },
      {
        employeeId: 'VIB_005',
        name: 'Ruqiya',
        email: 'ruqiya@talktime.com',
        password: 'sales123',
        role: 'sales'
      }
    ];

    console.log('\nSales Users:');
    for (const userData of salesUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const user = new User({
          ...userData,
          isActive: true
        });
        await user.save();
        console.log(`✓ Created: ${userData.name} (${userData.employeeId})`);
      } else {
        console.log(`✓ Exists: ${userData.name} (${userData.employeeId})`);
      }
    }

    // Create sample mapping users
    const mappingUsers = [
      {
        name: 'Alice Mapper',
        email: 'alice@talktime.com',
        password: 'mapping123',
        role: 'mapping'
      },
      {
        name: 'Bob Mapper',
        email: 'bob@talktime.com',
        password: 'mapping123',
        role: 'mapping'
      }
    ];

    console.log('\nMapping Users:');
    for (const userData of mappingUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        // Generate unique mappingId
        let mappingId;
        let isUnique = false;
        
        while (!isUnique) {
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          mappingId = `VIB2-${randomNum}`;
          
          const existingId = await User.findOne({ mappingId });
          if (!existingId) {
            isUnique = true;
          }
        }
        
        const user = new User({
          ...userData,
          mappingId,
          isActive: true
        });
        await user.save();
        console.log(`✓ Created: ${userData.name} (${mappingId})`);
      } else {
        console.log(`✓ Exists: ${userData.name} (${existing.mappingId || 'N/A'})`);
      }
    }

    console.log('\n📱 Mobile App Login (Employee ID / Mapping ID):');
    console.log('  VIB_001 / sales123 (Sales)');
    console.log('  VIB_002 / sales123 (Sales)');
    console.log('  VIB_003 / sales123 (Sales)');
    console.log('  VIB_004 / sales123 (Ajeeth - Sales)');
    console.log('  VIB_005 / sales123 (Ruqiya - Sales)');
    console.log('  Check console output above for Mapping IDs (VIB2-XXXX)');
    
    console.log('\n💻 Web Dashboard Login (Email):');
    console.log('  admin@talktime.com / admin123 (Admin)');
    console.log('  john@talktime.com / sales123 (Sales)');
    console.log('  ajeeth@talktime.com / sales123 (Sales)');
    console.log('  ruqiya@talktime.com / sales123 (Sales)');
    console.log('  alice@talktime.com / mapping123 (Mapping)');
    console.log('  bob@talktime.com / mapping123 (Mapping)');

  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Database setup completed');
    process.exit(0);
  }
}

setupDatabase();