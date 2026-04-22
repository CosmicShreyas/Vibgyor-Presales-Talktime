const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const path = require('path');
const fs = require('fs');
const BrandPartner = require('../models/BrandPartner');
const Client = require('../models/Client');
const ProjectSource = require('../models/ProjectSource');
const LeadImage = require('../models/LeadImage');
const { auth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../images');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lead-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware to authenticate brand partner
const brandPartnerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Brand partner auth failed: No token provided');
      return res.status(401).json({ message: 'Authentication required', error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is for brand partner
    if (decoded.type !== 'brand-partner') {
      console.log('Brand partner auth failed: Wrong token type', decoded.type);
      return res.status(403).json({ message: 'Access denied. Brand partner authentication required.', error: 'Invalid token type' });
    }

    const brandPartner = await BrandPartner.findById(decoded.id);
    
    if (!brandPartner) {
      console.log('Brand partner auth failed: Brand partner not found', decoded.id);
      return res.status(401).json({ message: 'Brand partner not found', error: 'Brand partner not found' });
    }
    
    if (!brandPartner.isActive) {
      console.log('Brand partner auth failed: Brand partner inactive', decoded.id);
      return res.status(401).json({ message: 'Brand partner account is inactive', error: 'Account inactive' });
    }

    req.brandPartner = brandPartner;
    next();
  } catch (error) {
    console.error('Brand partner auth error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token', error: 'Token verification failed' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', error: 'Token has expired' });
    }
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

/**
 * @swagger
 * /brand-partners/profile:
 *   get:
 *     summary: Get brand partner profile
 *     description: Get the authenticated brand partner's complete profile information
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Brand partner profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 partnerCode:
 *                   type: string
 *                 partnerName:
 *                   type: string
 *                 nickName:
 *                   type: string
 *                 contactPerson1:
 *                   type: string
 *                 phoneNo1:
 *                   type: string
 *                 contactPerson2:
 *                   type: string
 *                 phoneNo2:
 *                   type: string
 *                 email:
 *                   type: string
 *                 address:
 *                   type: string
 *                 accountHolderName:
 *                   type: string
 *                 accountNumber:
 *                   type: string
 *                 bankName:
 *                   type: string
 *                 ifscCode:
 *                   type: string
 *                 pan:
 *                   type: string
 *                 panDocument:
 *                   type: string
 *                 ifscDocument:
 *                   type: string
 *                 remarks:
 *                   type: string
 *                 paymentTerms:
 *                   type: string
 *                 about:
 *                   type: string
 *                 memberSince:
 *                   type: string
 *                   format: date-time
 *                   description: Date when the brand partner was created
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Brand partner not found
 */
router.get('/profile', brandPartnerAuth, async (req, res) => {
  try {
    const brandPartner = await BrandPartner.findById(req.brandPartner._id).select('-password');
    
    if (!brandPartner) {
      return res.status(404).json({ message: 'Brand partner not found' });
    }
    
    res.json(brandPartner);
  } catch (error) {
    console.error('Error fetching brand partner profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /brand-partners/profile/about:
 *   put:
 *     summary: Update brand partner about section
 *     description: Update the about section of the authenticated brand partner's profile
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - about
 *             properties:
 *               about:
 *                 type: string
 *                 description: About section content
 *                 example: "We are a leading real estate company..."
 *     responses:
 *       200:
 *         description: About section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 about:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Brand partner not found
 */
router.put('/profile/about', brandPartnerAuth, async (req, res) => {
  try {
    const { about } = req.body;
    
    if (about === undefined) {
      return res.status(400).json({ message: 'About field is required' });
    }
    
    const brandPartner = await BrandPartner.findByIdAndUpdate(
      req.brandPartner._id,
      { about: about || '' },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!brandPartner) {
      return res.status(404).json({ message: 'Brand partner not found' });
    }
    
    res.json({
      message: 'About section updated successfully',
      about: brandPartner.about
    });
  } catch (error) {
    console.error('Error updating about section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /brand-partners/leads:
 *   get:
 *     summary: Get brand partner's uploaded leads
 *     description: Fetch all leads uploaded by the authenticated brand partner
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leads uploaded by the brand partner
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 leads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       uniqueId:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *                       project:
 *                         type: string
 *                       budget:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/leads', brandPartnerAuth, async (req, res) => {
  try {
    const brandPartner = req.brandPartner;
    
    // Find all leads uploaded by this brand partner
    const leads = await Client.find({
      'metadata.brandPartnerId': brandPartner._id
    })
    .select('name uniqueId email phone alternatePhone address city state company budget priority status createdAt')
    .sort({ createdAt: -1 }); // Most recent first
    
    // Format the response with project instead of company
    const formattedLeads = leads.map(lead => ({
      name: lead.name,
      uniqueId: lead.uniqueId,
      email: lead.email || 'N/A',
      phone: lead.phone || 'N/A',
      alternatePhone: lead.alternatePhone || 'N/A',
      address: lead.address || 'N/A',
      city: lead.city || 'N/A',
      state: lead.state || 'N/A',
      project: lead.company || 'N/A', // company field is used for project
      budget: lead.budget || 'N/A',
      priority: lead.priority || 'medium',
      status: lead.status || 'pending',
      createdAt: lead.createdAt
    }));
    
    res.json({
      success: true,
      count: formattedLeads.length,
      leads: formattedLeads
    });
  } catch (error) {
    console.error('Error fetching brand partner leads:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /brand-partners/leads/statistics:
 *   get:
 *     summary: Get lead statistics with time period filters
 *     description: Get comprehensive statistics of leads by status (total, yet to contact, follow-up, qualified, disqualified, lost, won) with monthly, quarterly, or year-to-date filters
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, ytd]
 *         description: Time period filter (monthly, quarterly, or ytd for year-to-date)
 *         example: monthly
 *     responses:
 *       200:
 *         description: Lead statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 period:
 *                   type: string
 *                 dateRange:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalLeads:
 *                       type: number
 *                     yetToContact:
 *                       type: number
 *                     followUp:
 *                       type: number
 *                     qualified:
 *                       type: number
 *                     disqualified:
 *                       type: number
 *                     lost:
 *                       type: number
 *                     won:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/leads/statistics', brandPartnerAuth, async (req, res) => {
  try {
    const brandPartner = req.brandPartner;
    const { period } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    let endDate = new Date(now);
    let periodLabel = 'All Time';

    if (period === 'monthly') {
      // Current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      periodLabel = 'Monthly';
    } else if (period === 'quarterly') {
      // Current quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      periodLabel = 'Quarterly';
    } else if (period === 'ytd') {
      // Year to date
      startDate = new Date(now.getFullYear(), 0, 1);
      periodLabel = 'Year to Date';
    } else {
      // All time - no date filter
      startDate = null;
    }

    // Build base filter
    const baseFilter = {
      'metadata.brandPartnerId': brandPartner._id
    };

    // Add date filter if period is specified
    if (startDate) {
      baseFilter.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Get all leads for this brand partner in the period
    const allLeads = await Client.find(baseFilter);

    // Count leads by status
    const statistics = {
      totalLeads: allLeads.length,
      yetToContact: 0,
      followUp: 0,
      qualified: 0,
      disqualified: 0,
      lost: 0,
      won: 0
    };

    // Categorize leads by status
    allLeads.forEach(lead => {
      const status = lead.status?.toLowerCase() || 'pending';
      
      switch (status) {
        case 'pending':
        case 'new':
          statistics.yetToContact++;
          break;
        case 'follow-up':
        case 'followup':
        case 'no-response':
        case 'callback':
          statistics.followUp++;
          break;
        case 'qualified':
        case 'interested':
          statistics.qualified++;
          break;
        case 'disqualified':
        case 'not-interested':
        case 'invalid':
          statistics.disqualified++;
          break;
        case 'lost':
        case 'cancelled':
          statistics.lost++;
          break;
        case 'won':
        case 'closed':
        case 'already-finalised':
          statistics.won++;
          break;
        default:
          // Default to yet to contact for unknown statuses
          statistics.yetToContact++;
      }
    });

    res.json({
      success: true,
      period: periodLabel,
      dateRange: startDate ? {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      } : {
        startDate: 'All time',
        endDate: 'Present'
      },
      statistics
    });
  } catch (error) {
    console.error('Error fetching brand partner statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /brand-partners/leads/{uniqueId}:
 *   put:
 *     summary: Update a lead
 *     description: Update a lead's information by unique ID. Brand partners can only update their own leads.
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uniqueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the lead
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               project:
 *                 type: string
 *               budget:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your lead
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Server error
 */
router.put('/leads/:uniqueId', brandPartnerAuth, async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const brandPartner = req.brandPartner;
    const { name, city, state, project, budget, remarks } = req.body;
    
    // Find the lead
    const lead = await Client.findOne({ uniqueId });
    
    if (!lead) {
      return res.status(404).json({ 
        success: false,
        message: 'Lead not found' 
      });
    }
    
    // Verify that this lead belongs to the brand partner
    if (lead.metadata?.brandPartnerId?.toString() !== brandPartner._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only update your own leads' 
      });
    }
    
    // Update only the allowed fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (project !== undefined) updateData.company = project; // Map project to company field
    if (budget !== undefined) updateData.budget = budget;
    if (remarks !== undefined) updateData.notes = remarks; // Map remarks to notes field
    
    // Update the lead
    const updatedLead = await Client.findOneAndUpdate(
      { uniqueId },
      updateData,
      { new: true, runValidators: true }
    ).select('name uniqueId email phone alternatePhone address city state company budget priority status createdAt');
    
    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead: {
        name: updatedLead.name,
        uniqueId: updatedLead.uniqueId,
        email: updatedLead.email || 'N/A',
        phone: updatedLead.phone || 'N/A',
        alternatePhone: updatedLead.alternatePhone || 'N/A',
        address: updatedLead.address || 'N/A',
        city: updatedLead.city || 'N/A',
        state: updatedLead.state || 'N/A',
        project: updatedLead.company || 'N/A',
        budget: updatedLead.budget || 'N/A',
        priority: updatedLead.priority || 'medium',
        status: updatedLead.status || 'pending',
        createdAt: updatedLead.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating brand partner lead:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /brand-partners/leads/{uniqueId}:
 *   delete:
 *     summary: Delete a lead
 *     description: Delete a lead by unique ID. Brand partners can only delete their own leads.
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uniqueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the lead
 *     responses:
 *       200:
 *         description: Lead deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your lead
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Server error
 */
router.delete('/leads/:uniqueId', brandPartnerAuth, async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const brandPartner = req.brandPartner;
    
    // Find the lead
    const lead = await Client.findOne({ uniqueId });
    
    if (!lead) {
      return res.status(404).json({ 
        success: false,
        message: 'Lead not found' 
      });
    }
    
    // Verify that this lead belongs to the brand partner
    if (lead.metadata?.brandPartnerId?.toString() !== brandPartner._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only delete your own leads' 
      });
    }
    
    // Delete the lead
    await Client.findOneAndDelete({ uniqueId });
    
    res.json({
      success: true,
      message: 'Lead deleted successfully',
      uniqueId: uniqueId
    });
  } catch (error) {
    console.error('Error deleting brand partner lead:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /brand-partners/login:
 *   post:
 *     summary: Brand partner login
 *     description: Authenticate brand partner with email and password
 *     tags: [Brand Partners]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const brandPartner = await BrandPartner.findOne({ email: email.toLowerCase(), isActive: true });

    if (!brandPartner || !(await brandPartner.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: brandPartner._id, type: 'brand-partner' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      brandPartner: {
        _id: brandPartner._id,
        partnerName: brandPartner.partnerName,
        partnerCode: brandPartner.partnerCode,
        email: brandPartner.email,
        contactPerson1: brandPartner.contactPerson1,
        phoneNo1: brandPartner.phoneNo1,
        isActive: brandPartner.isActive
      }
    });
  } catch (error) {
    console.error('Brand partner login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test endpoint to verify authentication
router.get('/test-auth', brandPartnerAuth, async (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    brandPartner: {
      id: req.brandPartner._id,
      partnerName: req.brandPartner.partnerName,
      partnerCode: req.brandPartner.partnerCode,
      email: req.brandPartner.email
    }
  });
});

/**
 * @swagger
 * /brand-partners/bulk-import:
 *   post:
 *     summary: Bulk import brand partners from CSV
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 */
router.post('/bulk-import', auth, async (req, res) => {
  try {
    const { partners } = req.body;

    if (!partners || !Array.isArray(partners) || partners.length === 0) {
      return res.status(400).json({ message: 'No partners provided' });
    }

    let imported = 0;
    let failed = 0;
    const errors = [];

    for (const partnerData of partners) {
      try {
        // Remove rowIndex before saving
        const { rowIndex, ...cleanData } = partnerData;
        
        const partner = new BrandPartner(cleanData);
        await partner.save();
        imported++;
      } catch (error) {
        failed++;
        errors.push({
          email: partnerData.email,
          error: error.message
        });
      }
    }

    res.json({
      message: `Import completed: ${imported} successful, ${failed} failed`,
      imported,
      failed,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk importing brand partners:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /brand-partners/images/upload:
 *   post:
 *     summary: Upload an image for a lead
 *     description: Upload an image with title and tags for a specific lead
 *     tags: [Brand Partners - Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - leadUniqueId
 *               - title
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               leadUniqueId:
 *                 type: string
 *               title:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Not your lead
 *       404:
 *         description: Lead not found
 */
router.post('/images/upload', brandPartnerAuth, imageUpload.single('image'), async (req, res) => {
  try {
    const { leadUniqueId, title, tags } = req.body;
    const brandPartner = req.brandPartner;
    
    // Validate required fields
    if (!leadUniqueId || !title) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'leadUniqueId and title are required'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }
    
    // Find the lead and verify ownership
    const lead = await Client.findOne({ uniqueId: leadUniqueId });
    
    if (!lead) {
      // Delete uploaded file if lead not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Verify that this lead belongs to the brand partner
    if (lead.metadata?.brandPartnerId?.toString() !== brandPartner._id.toString()) {
      // Delete uploaded file if not authorized
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'You can only upload images for your own leads'
      });
    }
    
    // Parse tags (comma-separated string to array)
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // Generate unique image ID
    const imageId = `IMG-${brandPartner.partnerCode}-${Date.now()}-${Math.round(Math.random() * 1E6)}`;
    
    // Create image record
    const leadImage = new LeadImage({
      imageId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      title,
      tags: tagsArray,
      leadUniqueId,
      leadName: lead.name,
      brandPartnerId: brandPartner._id,
      brandPartnerCode: brandPartner.partnerCode,
      brandPartnerName: brandPartner.partnerName
    });
    
    await leadImage.save();
    
    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image: {
        imageId: leadImage.imageId,
        title: leadImage.title,
        tags: leadImage.tags,
        leadName: leadImage.leadName,
        leadUniqueId: leadImage.leadUniqueId,
        filename: leadImage.filename,
        size: leadImage.size,
        uploadedAt: leadImage.createdAt
      }
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /brand-partners/images:
 *   get:
 *     summary: Get all images uploaded by brand partner
 *     description: Retrieve all images with metadata uploaded by the authenticated brand partner
 *     tags: [Brand Partners - Images]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of images
 */
router.get('/images', brandPartnerAuth, async (req, res) => {
  try {
    const brandPartner = req.brandPartner;
    
    // Find all images uploaded by this brand partner
    const images = await LeadImage.find({
      brandPartnerId: brandPartner._id
    })
    .select('imageId title tags leadName leadUniqueId filename size createdAt')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: images.length,
      images: images.map(img => ({
        imageId: img.imageId,
        title: img.title,
        tags: img.tags,
        leadName: img.leadName,
        leadUniqueId: img.leadUniqueId,
        filename: img.filename,
        size: img.size,
        uploadedAt: img.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /brand-partners/images/{imageId}:
 *   get:
 *     summary: Render/serve an image file
 *     description: Get the actual image file by imageId
 *     tags: [Brand Partners - Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/images/:imageId', brandPartnerAuth, async (req, res) => {
  try {
    const { imageId } = req.params;
    const brandPartner = req.brandPartner;
    
    // Find the image
    const image = await LeadImage.findOne({ imageId });
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Verify ownership
    if (image.brandPartnerId.toString() !== brandPartner._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own images'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(image.filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found on server'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', image.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${image.originalName}"`);
    
    // Send the file
    res.sendFile(image.filepath);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /brand-partners/images/{imageId}:
 *   delete:
 *     summary: Delete an image
 *     description: Delete an image by imageId
 *     tags: [Brand Partners - Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 */
router.delete('/images/:imageId', brandPartnerAuth, async (req, res) => {
  try {
    const { imageId } = req.params;
    const brandPartner = req.brandPartner;
    
    // Find the image
    const image = await LeadImage.findOne({ imageId });
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Verify ownership
    if (image.brandPartnerId.toString() !== brandPartner._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own images'
      });
    }
    
    // Delete the file from filesystem
    if (fs.existsSync(image.filepath)) {
      fs.unlinkSync(image.filepath);
    }
    
    // Delete the database record
    await LeadImage.findOneAndDelete({ imageId });
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
      imageId: imageId
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ADMIN ROUTES - These use the regular 'auth' middleware for admin users
// Must be at the end to avoid conflicting with specific brand partner routes

/**
 * @swagger
 * /brand-partners:
 *   get:
 *     summary: Get all brand partners
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of brand partners
 */
router.get('/', auth, async (req, res) => {
  try {
    const brandPartners = await BrandPartner.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(brandPartners);
  } catch (error) {
    console.error('Error fetching brand partners:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /brand-partners:
 *   post:
 *     summary: Create a new brand partner
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partnerName
 *               - contactPerson1
 *               - phoneNo1
 *               - email
 *               - password
 *               - address
 *               - accountHolderName
 *               - accountNumber
 *               - bankName
 *               - ifscCode
 *     responses:
 *       201:
 *         description: Brand partner created successfully
 */
router.post('/', auth, async (req, res) => {
  try {
    const brandPartner = new BrandPartner(req.body);
    await brandPartner.save();
    
    const response = brandPartner.toObject();
    delete response.password;
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating brand partner:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /brand-partners/{id}:
 *   get:
 *     summary: Get a brand partner by ID
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const brandPartner = await BrandPartner.findById(req.params.id).select('-password');
    
    if (!brandPartner) {
      return res.status(404).json({ message: 'Brand partner not found' });
    }
    
    res.json(brandPartner);
  } catch (error) {
    console.error('Error fetching brand partner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /brand-partners/{id}:
 *   put:
 *     summary: Update a brand partner
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Don't allow direct password updates through this endpoint
    if (updates.password) {
      delete updates.password;
    }
    
    const brandPartner = await BrandPartner.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!brandPartner) {
      return res.status(404).json({ message: 'Brand partner not found' });
    }
    
    res.json(brandPartner);
  } catch (error) {
    console.error('Error updating brand partner:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /brand-partners/{id}:
 *   delete:
 *     summary: Delete a brand partner
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const brandPartner = await BrandPartner.findByIdAndDelete(req.params.id);
    
    if (!brandPartner) {
      return res.status(404).json({ message: 'Brand partner not found' });
    }
    
    res.json({ message: 'Brand partner deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand partner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /brand-partners/leads/import:
 *   post:
 *     summary: Import leads (CSV or JSON)
 *     description: Allows brand partners to upload leads via CSV file or JSON data. Leads are automatically tagged with "Brand Partners" source and linked to the brand partner.
 *     tags: [Brand Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csvFile:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing leads
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leads
 *             properties:
 *               leads:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - phone
 *                   properties:
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     alternatePhone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     project:
 *                       type: string
 *                     address:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     remarks:
 *                       type: string
 *     responses:
 *       200:
 *         description: Import completed
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/leads/import', brandPartnerAuth, upload.single('csvFile'), async (req, res) => {
  try {
    const brandPartner = req.brandPartner;
    let leadsData = [];
    const errors = [];
    let successCount = 0;
    let failedCount = 0;

    // Ensure "Brand Partners" project source exists
    let brandPartnersSource = await ProjectSource.findOne({ name: 'Brand Partners' });
    if (!brandPartnersSource) {
      const User = require('../models/User');
      const adminUser = await User.findOne({ role: 'admin' });
      
      brandPartnersSource = new ProjectSource({
        name: 'Brand Partners',
        description: 'Leads imported from brand partner dashboard',
        isActive: true,
        createdBy: adminUser ? adminUser._id : null
      });
      await brandPartnersSource.save();
    }

    // Generate unique import ID for this batch
    const importId = `BP-${brandPartner.partnerCode}-${Date.now()}`;
    const importFileName = req.file 
      ? `${brandPartner.partnerCode}_${new Date().toISOString().split('T')[0]}.csv`
      : `${brandPartner.partnerCode}_${new Date().toISOString().split('T')[0]}.json`;

    // Check if it's CSV or JSON
    if (req.file) {
      // CSV Import
      const results = [];
      const stream = Readable.from(req.file.buffer.toString());
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            leadsData = results;
            resolve();
          })
          .on('error', (error) => reject(error));
      });
    } else if (req.body.leads && Array.isArray(req.body.leads)) {
      // JSON Import
      leadsData = req.body.leads;
    } else {
      return res.status(400).json({ 
        message: 'Either csvFile or leads array is required' 
      });
    }

    // Process each lead
    for (let i = 0; i < leadsData.length; i++) {
      const row = leadsData[i];
      try {
        // Validate required fields
        if (!row.name || !row.phone) {
          errors.push(`Row ${i + 1}: name and phone are required`);
          failedCount++;
          continue;
        }

        // Create client with Brand Partners source
        const client = new Client({
          name: row.name.trim(),
          phone: row.phone.trim(),
          alternatePhone: row.alternatePhone ? row.alternatePhone.trim() : undefined,
          email: row.email ? row.email.trim() : undefined,
          company: row.project ? row.project.trim() : undefined, // Map project to company field
          address: row.address ? row.address.trim() : undefined,
          city: row.city ? row.city.trim() : undefined,
          state: row.state ? row.state.trim() : undefined,
          budget: row.budget ? row.budget.trim() : undefined, // Budget field
          notes: row.remarks ? row.remarks.trim() : undefined, // Map remarks to notes field
          source: 'Brand Partners', // Automatically set to Brand Partners
          status: 'pending',
          priority: 'medium',
          importMethod: req.file ? 'csv' : 'manual',
          csvFileName: importFileName,
          csvImportId: importId,
          isUnassigned: true, // Mark as unassigned so admin can assign later
          importedAt: new Date(),
          metadata: {
            brandPartnerId: brandPartner._id,
            brandPartnerCode: brandPartner.partnerCode,
            brandPartnerName: brandPartner.partnerName,
            importedBy: 'brand-partner'
          }
        });

        await client.save();
        successCount++;
      } catch (error) {
        if (error.code === 11000) {
          errors.push(`Row ${i + 1}: Duplicate entry (uniqueId conflict)`);
        } else {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
        failedCount++;
      }
    }

    res.json({
      success: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10), // Return first 10 errors
      brandPartnerCode: brandPartner.partnerCode,
      importId: importId,
      message: `Successfully imported ${successCount} lead(s). ${failedCount} failed.`
    });

  } catch (error) {
    console.error('Error importing leads from brand partner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
