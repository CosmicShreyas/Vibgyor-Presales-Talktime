const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all users (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create user (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { employeeId, name, email, password, role } = req.body;

    // For admin users, employeeId is optional
    const userData = { name, email, password, role };
    
    if (role === 'sales') {
      // Sales users must have an employeeId
      if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required for sales users' });
      }
      userData.employeeId = employeeId.toUpperCase();
      
      // Check if employeeId already exists
      const existingEmployeeId = await User.findOne({ employeeId: userData.employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({ message: 'User with this employee ID already exists' });
      }
    } else if (role === 'mapping') {
      // Mapping users get auto-generated mappingId
      // Generate VIB2-{RANDOM 4-digit number}
      let mappingId;
      let isUnique = false;
      
      while (!isUnique) {
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        mappingId = `VIB2-${randomNum}`;
        
        const existing = await User.findOne({ mappingId });
        if (!existing) {
          isUnique = true;
        }
      }
      
      userData.mappingId = mappingId;
    } else if (employeeId) {
      // Admin can optionally have an employeeId
      userData.employeeId = employeeId.toUpperCase();
      
      // Check if employeeId already exists
      const existingEmployeeId = await User.findOne({ employeeId: userData.employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({ message: 'User with this employee ID already exists' });
      }
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      id: user._id,
      employeeId: user.employeeId,
      mappingId: user.mappingId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deletion of system admin
    if (user.isSystemAdmin) {
      return res.status(403).json({ message: 'Cannot delete system admin account' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import users from CSV (admin only)
router.post('/import', auth, adminAuth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let failedCount = 0;

    // Parse CSV
    const stream = Readable.from(req.file.buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Process each row
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          try {
            // Validate required fields
            if (!row.name || !row.email || !row.password) {
              errors.push(`Row ${i + 1}: name, email, and password are required`);
              failedCount++;
              continue;
            }

            // Generate employee ID if not provided and role is sales
            let employeeId = row.employeeId ? row.employeeId.trim().toUpperCase() : null;
            
            // Validate role
            const role = row.role && ['admin', 'sales'].includes(row.role.toLowerCase()) 
              ? row.role.toLowerCase() 
              : 'sales';
            
            // For sales and mapping users, employeeId is required
            if ((role === 'sales' || role === 'mapping') && !employeeId) {
              // Auto-generate employee ID for sales and mapping
              const prefix = 'VIB';
              const count = await User.countDocuments({ employeeId: new RegExp(`^${prefix}_`) });
              employeeId = `${prefix}_${String(count + 1).padStart(3, '0')}`;
            }

            // Check if user already exists
            const existingConditions = [{ email: row.email.trim().toLowerCase() }];
            if (employeeId) {
              existingConditions.push({ employeeId: employeeId });
            }
            
            const existingUser = await User.findOne({ $or: existingConditions });
            if (existingUser) {
              const reason = existingUser.email === row.email.trim().toLowerCase() 
                ? `email ${row.email}` 
                : `employee ID ${employeeId}`;
              errors.push(`Row ${i + 1}: User with ${reason} already exists`);
              failedCount++;
              continue;
            }

            // Create user
            const userData = {
              name: row.name.trim(),
              email: row.email.trim().toLowerCase(),
              password: row.password.trim(),
              role: role
            };
            
            if (employeeId) {
              userData.employeeId = employeeId;
            }

            const user = new User(userData);
            await user.save();
            successCount++;
          } catch (error) {
            errors.push(`Row ${i + 1}: ${error.message}`);
            failedCount++;
          }
        }

        res.json({
          success: successCount,
          failed: failedCount,
          errors: errors.slice(0, 10) // Return first 10 errors
        });
      })
      .on('error', (error) => {
        res.status(500).json({ message: 'Error parsing CSV', error: error.message });
      });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import mapping users from CSV (admin only)
router.post('/import-mapping', auth, adminAuth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let failedCount = 0;

    // Parse CSV
    const stream = Readable.from(req.file.buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Process each row
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          try {
            // Validate required fields (only name, email, password - mappingId is auto-generated)
            if (!row.name || !row.email || !row.password) {
              errors.push(`Row ${i + 1}: name, email, and password are required`);
              failedCount++;
              continue;
            }

            // Check if user already exists by email
            const existingUser = await User.findOne({ 
              email: row.email.trim().toLowerCase()
            });
            
            if (existingUser) {
              errors.push(`Row ${i + 1}: User with email ${row.email} already exists`);
              failedCount++;
              continue;
            }

            // Generate unique mappingId
            let mappingId;
            let isUnique = false;
            
            while (!isUnique) {
              const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
              mappingId = `VIB2-${randomNum}`;
              
              const existing = await User.findOne({ mappingId });
              if (!existing) {
                isUnique = true;
              }
            }

            // Create mapping user
            const userData = {
              name: row.name.trim(),
              email: row.email.trim().toLowerCase(),
              password: row.password.trim(),
              role: 'mapping',
              mappingId: mappingId
            };

            const user = new User(userData);
            await user.save();
            successCount++;
          } catch (error) {
            errors.push(`Row ${i + 1}: ${error.message}`);
            failedCount++;
          }
        }

        res.json({
          success: successCount,
          failed: failedCount,
          errors: errors.slice(0, 10) // Return first 10 errors
        });
      })
      .on('error', (error) => {
        res.status(500).json({ message: 'Error parsing CSV', error: error.message });
      });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;