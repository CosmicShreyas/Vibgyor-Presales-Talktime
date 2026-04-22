const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Client = require('../models/Client');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const { sendQualifiedLead } = require('../services/vibgyorService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: Lead management endpoints
 */

/**
 * @swagger
 * /clients/unassigned:
 *   get:
 *     summary: Get unassigned leads
 *     description: Get all leads that have not been assigned to any employee (admin only)
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unassigned leads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
// Get unassigned clients (admin only) - MUST come before /:id route
router.get('/unassigned', auth, adminAuth, async (req, res) => {
  try {
    const clients = await Client.find({ isUnassigned: true })
      .sort({ createdAt: -1 });
    
    res.json(clients);
  } catch (error) {
    console.error('Error fetching unassigned leads:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /clients/filter/by-date:
 *   get:
 *     summary: Filter leads by custom date range
 *     description: Get leads created within a specific date range. Admin gets all leads, sales users get only their assigned leads.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by source (optional)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (optional)
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned employee ID (admin only, optional)
 *     responses:
 *       200:
 *         description: List of leads within the date range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 dateRange:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                 leads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Bad request - Invalid date format or missing parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/filter/by-date', auth, async (req, res) => {
  try {
    const { startDate, endDate, source, status, assignedTo } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
        example: '/api/clients/filter/by-date?startDate=2024-01-01&endDate=2024-12-31'
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format',
        example: '2024-01-01'
      });
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Check if start date is after end date
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate cannot be after endDate'
      });
    }

    // Build filter
    const filter = {
      createdAt: {
        $gte: start,
        $lte: end
      }
    };

    // Role-based filtering
    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user._id;
    }

    // Optional filters
    if (source) {
      filter.source = source;
    }

    if (status) {
      filter.status = status;
    }

    // Admin can filter by specific employee
    if (assignedTo && req.user.role === 'admin') {
      filter.assignedTo = assignedTo;
    }

    // Fetch leads
    const leads = await Client.find(filter)
      .populate('assignedTo', 'name email employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leads.length,
      dateRange: {
        startDate: startDate,
        endDate: endDate
      },
      filters: {
        source: source || 'all',
        status: status || 'all',
        assignedTo: assignedTo || (req.user.role === 'admin' ? 'all' : req.user.name)
      },
      leads
    });
  } catch (error) {
    console.error('Error filtering leads by date:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: Get a single lead by ID
 *     description: Get detailed information about a specific lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     responses:
 *       200:
 *         description: Lead details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Server error
 */
// Get single client by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user._id;
    }

    const client = await Client.findOne(filter)
      .populate('assignedTo', 'name email employeeId');

    if (!client) {
      return res.status(404).json({ message: 'Lead not found or access denied' });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Get leads
 *     description: Get all leads for admin, or assigned leads for sales users. Supports filtering by source.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by source (e.g., "Brand Partners")
 *     responses:
 *       200:
 *         description: List of leads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Get clients (all for admin, assigned for sales)
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };
    
    // Add source filter if provided
    if (req.query.source) {
      filter.source = req.query.source;
    }
    
    const clients = await Client.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create client (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    await client.populate('assignedTo', 'name email');
    
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update client
router.put('/:id', auth, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user._id;
    }

    // Get the old client data to check if status is changing
    const oldClient = await Client.findOne(filter);
    if (!oldClient) {
      return res.status(404).json({ message: 'Client not found or access denied' });
    }

    // Update the client
    const client = await Client.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email employeeId');

    if (!client) {
      return res.status(404).json({ message: 'Client not found or access denied' });
    }

    // Check if status changed to "qualified"
    const statusChanged = oldClient.status !== client.status;
    const isNowQualified = client.status === 'qualified';

    if (statusChanged && isNowQualified) {
      console.log('🎯 Lead status changed to QUALIFIED, sending to Vibgyor API...');
      
      // Send to Vibgyor API asynchronously (don't wait for response)
      sendQualifiedLead(client)
        .then(result => {
          if (result.success) {
            console.log('✅ Vibgyor API call successful');
          } else {
            console.error('❌ Vibgyor API call failed:', result.error);
          }
        })
        .catch(error => {
          console.error('❌ Vibgyor API call error:', error);
        });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete client (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /clients/all/delete-all:
 *   delete:
 *     summary: Delete all leads
 *     description: Delete all leads from the database (admin only)
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All leads deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
// Delete all clients (admin only)
router.delete('/all/delete-all', auth, adminAuth, async (req, res) => {
  try {
    const result = await Client.deleteMany({});
    res.json({ 
      message: 'All leads deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check for duplicate phone numbers
router.post('/check-duplicates', auth, adminAuth, async (req, res) => {
  try {
    const { phoneNumbers } = req.body;
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ message: 'phoneNumbers array is required' });
    }

    // Clean phone numbers (remove non-digits)
    const cleanedNumbers = phoneNumbers.map(num => num.replace(/\D/g, ''));

    // Find all clients with matching phone numbers (check both phone and alternatePhone)
    const existingClients = await Client.find({
      $or: [
        { phone: { $in: phoneNumbers } },
        { alternatePhone: { $in: phoneNumbers } }
      ]
    }, 'phone alternatePhone');

    // Extract all existing phone numbers
    const existingPhones = [];
    existingClients.forEach(client => {
      if (client.phone) existingPhones.push(client.phone);
      if (client.alternatePhone) existingPhones.push(client.alternatePhone);
    });

    res.json(existingPhones);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import clients from CSV (admin only)
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
            // Find user by email if assignedTo is provided
            let assignedToId = null;
            if (row.assignedTo) {
              const user = await User.findOne({ email: row.assignedTo.trim().toLowerCase(), role: 'sales' });
              if (user) {
                assignedToId = user._id;
              } else {
                errors.push(`Row ${i + 1}: Employee not found with email ${row.assignedTo}`);
                failedCount++;
                continue;
              }
            } else {
              errors.push(`Row ${i + 1}: assignedTo (employee email) is required`);
              failedCount++;
              continue;
            }

            // Validate required fields
            if (!row.name || !row.phone) {
              errors.push(`Row ${i + 1}: name and phone are required`);
              failedCount++;
              continue;
            }

            // Create client
            const client = new Client({
              name: row.name.trim(),
              phone: row.phone.trim(),
              email: row.email ? row.email.trim() : undefined,
              company: row.company ? row.company.trim() : undefined,
              assignedTo: assignedToId,
              status: row.status && ['pending', 'contacted', 'interested', 'not-interested', 'closed'].includes(row.status.toLowerCase()) 
                ? row.status.toLowerCase() 
                : 'pending',
              priority: row.priority && ['low', 'medium', 'high'].includes(row.priority.toLowerCase()) 
                ? row.priority.toLowerCase() 
                : 'medium',
              notes: row.notes ? row.notes.trim() : undefined
            });

            await client.save();
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