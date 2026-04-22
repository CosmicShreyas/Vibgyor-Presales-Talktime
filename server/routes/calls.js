const express = require('express');
const CallRecord = require('../models/CallRecord');
const Client = require('../models/Client');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calls
 *   description: Call record management endpoints
 */

/**
 * @swagger
 * /calls:
 *   post:
 *     summary: Create a call record
 *     description: Record a call made to a lead
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - status
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               status:
 *                 type: string
 *                 enum: [pending, no-response, not-interested, qualified, number-inactive, number-switched-off, on-hold, no-requirement, follow-up, disqualified, disconnected, already-finalised]
 *                 example: qualified
 *               notes:
 *                 type: string
 *                 example: Discussed pricing options
 *               callbackDate:
 *                 type: string
 *                 format: date-time
 *               callDuration:
 *                 type: number
 *                 example: 180
 *                 description: Duration in seconds
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Call record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CallRecord'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Server error
 */
// Create a call record
router.post('/', auth, async (req, res) => {
  try {
    const { clientId, status, notes, callbackDate, callDuration, timestamp } = req.body;

    console.log('Creating call record:', { clientId, status, notes, callbackDate, callDuration, timestamp });

    // Verify client exists and user has access
    const client = await Client.findById(clientId);
    if (!client) {
      console.error('Lead not found:', clientId);
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check if user has access to this client
    if (req.user.role !== 'admin' && client.assignedTo.toString() !== req.user._id.toString()) {
      console.error('Access denied for user:', req.user._id, 'to client:', clientId);
      return res.status(403).json({ message: 'Access denied' });
    }

    const callRecord = new CallRecord({
      clientId,
      employeeId: req.user._id,
      status,
      notes,
      callbackDate,
      callDuration,
      timestamp: timestamp || new Date()
    });

    await callRecord.save();
    
    console.log('Call record created successfully:', callRecord._id);
    res.status(201).json(callRecord);
  } catch (error) {
    console.error('Error creating call record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /calls/history:
 *   get:
 *     summary: Get call history
 *     description: Get call history for the logged-in user (last 100 records)
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Call history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CallRecord'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Get call history for logged-in user
router.get('/history', auth, async (req, res) => {
  try {
    const filter = { 
      employeeId: req.user._id,
      status: { $ne: 'pending' } // Exclude pending status (no action taken)
    };
    
    const records = await CallRecord.find(filter)
      .populate('clientId', 'name company phone email')
      .sort({ timestamp: -1 })
      .limit(100); // Limit to last 100 records
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get call history for a specific client
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    // Verify client exists and user has access
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (req.user.role !== 'admin' && client.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const records = await CallRecord.find({ clientId: req.params.clientId })
      .populate('employeeId', 'name email')
      .sort({ timestamp: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /calls/stats:
 *   get:
 *     summary: Get call statistics
 *     description: Get call statistics for the logged-in user
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCalls:
 *                   type: number
 *                   example: 150
 *                 thisMonth:
 *                   type: number
 *                   example: 45
 *                 successRate:
 *                   type: number
 *                   example: 68
 *                   description: Percentage of successful calls
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Get call statistics for logged-in user
router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCalls, thisMonthCalls, qualifiedCalls] = await Promise.all([
      CallRecord.countDocuments({ employeeId: req.user._id }),
      CallRecord.countDocuments({ 
        employeeId: req.user._id,
        timestamp: { $gte: startOfMonth }
      }),
      CallRecord.countDocuments({ 
        employeeId: req.user._id,
        status: 'qualified'
      })
    ]);

    const successRate = totalCalls > 0 ? Math.round((qualifiedCalls / totalCalls) * 100) : 0;

    res.json({
      totalCalls,
      thisMonth: thisMonthCalls,
      successRate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
