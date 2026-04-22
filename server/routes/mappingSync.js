const express = require('express');
const Client = require('../models/Client');
const ProjectSource = require('../models/ProjectSource');
const { auth, adminAuth } = require('../middleware/auth');
const { fetchMappingLeads, transformMappingLead } = require('../services/mappingService');

const router = express.Router();

/**
 * @swagger
 * /mapping-sync/sync:
 *   post:
 *     summary: Sync mapping leads from external API
 *     description: Fetch leads from mapping API and import them into the system
 *     tags: [Mapping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/sync', auth, adminAuth, async (req, res) => {
  try {
    // Ensure "Mapping" project source exists
    let mappingSource = await ProjectSource.findOne({ name: 'Mapping' });
    
    if (!mappingSource) {
      mappingSource = await ProjectSource.create({
        name: 'Mapping',
        description: 'Leads from Mapping source',
        createdBy: req.user._id // Use the admin user who triggered the sync
      });
    }

    // Fetch mapping leads from external API
    const result = await fetchMappingLeads(1, 100); // Fetch first 100 leads

    if (!result.success) {
      return res.status(500).json({
        message: 'Failed to fetch mapping leads',
        error: result.error
      });
    }

    const mappingLeads = result.data;
    let importedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    const errors = [];

    for (const mappingLead of mappingLeads) {
      try {
        // Check if lead already exists by mapping lead ID
        const existingLead = await Client.findOne({
          'metadata.mappingLeadId': mappingLead.leadId
        });

        const transformedLead = transformMappingLead(mappingLead);

        if (existingLead) {
          // Update existing lead
          Object.assign(existingLead, transformedLead);
          await existingLead.save();
          updatedCount++;
        } else {
          // Check for duplicate by phone number
          const duplicateByPhone = await Client.findOne({
            $or: [
              { phone: mappingLead.phoneNo },
              { alternatePhone: mappingLead.phoneNo }
            ]
          });

          if (duplicateByPhone) {
            skippedCount++;
            continue;
          }

          // Create new lead
          const newLead = new Client({
            ...transformedLead,
            assignedTo: req.user._id, // Assign to admin initially
            isUnassigned: true, // Mark as unassigned for auto-assignment
            importedAt: new Date()
          });

          await newLead.save();
          importedCount++;
        }
      } catch (error) {
        errors.push({
          leadId: mappingLead.leadId,
          name: mappingLead.clientName,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: mappingLeads.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : []
    });
  } catch (error) {
    console.error('❌ Mapping sync error:', error);
    res.status(500).json({
      message: 'Server error during mapping sync',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /mapping-sync/status:
 *   get:
 *     summary: Get mapping sync status
 *     description: Get count of mapping leads in the system
 *     tags: [Mapping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/status', auth, async (req, res) => {
  try {
    const mappingLeadsCount = await Client.countDocuments({
      importMethod: 'mapping'
    });

    const unassignedMappingLeads = await Client.countDocuments({
      importMethod: 'mapping',
      isUnassigned: true
    });

    res.json({
      total: mappingLeadsCount,
      unassigned: unassignedMappingLeads,
      assigned: mappingLeadsCount - unassignedMappingLeads
    });
  } catch (error) {
    console.error('Error getting mapping status:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
