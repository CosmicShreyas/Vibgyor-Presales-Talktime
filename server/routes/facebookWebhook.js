const express = require('express');
const router = express.Router();
const axios = require('axios');
const Client = require('../models/Client');
const User = require('../models/User');
const ProjectSource = require('../models/ProjectSource');

// Facebook App credentials (add these to your .env file)
const FACEBOOK_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'your_verify_token_here';
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

/**
 * @swagger
 * /api/facebook-webhook:
 *   get:
 *     summary: Facebook webhook verification
 *     description: Verifies the webhook endpoint with Facebook
 *     tags: [Facebook Webhook]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verified successfully
 *       403:
 *         description: Verification failed
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Facebook webhook verification request:', { mode, token });

  if (mode && token) {
    if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Verification token mismatch');
      res.sendStatus(403);
    }
  } else {
    console.log('❌ Missing verification parameters');
    res.sendStatus(403);
  }
});

/**
 * @swagger
 * /api/facebook-webhook:
 *   post:
 *     summary: Receive Facebook/Instagram lead ads
 *     description: Webhook endpoint to receive new leads from Facebook and Instagram
 *     tags: [Facebook Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *       500:
 *         description: Error processing webhook
 */
router.post('/', async (req, res) => {
  const data = req.body;

  console.log('📨 Received webhook:', JSON.stringify(data, null, 2));

  // Respond immediately to Facebook
  res.sendStatus(200);

  // Process the webhook data asynchronously
  try {
    if (data.object === 'page') {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id;
            const adId = change.value.ad_id;
            const formId = change.value.form_id;
            const pageId = change.value.page_id;

            console.log(`🆕 New lead received: ${leadgenId}`);
            
            // Fetch and save the lead
            await fetchAndSaveLead(leadgenId, adId, formId, pageId);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
  }
});

/**
 * Fetch lead details from Facebook Graph API
 */
async function fetchLeadFromFacebook(leadgenId) {
  try {
    const url = `https://graph.facebook.com/v21.0/${leadgenId}`;
    const response = await axios.get(url, {
      params: {
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN
      }
    });

    console.log('📥 Lead data fetched:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching lead from Facebook:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetch campaign information from ad
 */
async function getCampaignInfo(adId) {
  try {
    const url = `https://graph.facebook.com/v21.0/${adId}`;
    const response = await axios.get(url, {
      params: {
        fields: 'campaign_id,campaign{id,name}',
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN
      }
    });

    console.log('📊 Campaign data fetched:', JSON.stringify(response.data, null, 2));
    
    return {
      campaignId: response.data.campaign?.id || response.data.campaign_id || 'unknown',
      campaignName: response.data.campaign?.name || 'Unknown Campaign'
    };
  } catch (error) {
    console.error('⚠️ Could not fetch campaign info:', error.message);
    return {
      campaignId: 'unknown',
      campaignName: 'Unknown Campaign'
    };
  }
}

/**
 * Determine if lead is from Facebook or Instagram
 */
async function getLeadPlatform(adId) {
  try {
    // Fetch ad details to determine platform
    const url = `https://graph.facebook.com/v21.0/${adId}`;
    const response = await axios.get(url, {
      params: {
        fields: 'configured_status,effective_status,name',
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN
      }
    });

    // Check if ad name or other fields indicate Instagram
    // Note: You might need to adjust this logic based on your ad naming convention
    const adName = response.data.name || '';
    
    // Common patterns to identify Instagram ads
    if (adName.toLowerCase().includes('instagram') || 
        adName.toLowerCase().includes('ig ') ||
        adName.toLowerCase().includes('insta')) {
      return 'Instagram';
    }

    // You can also check the ad's placement if available
    // For now, we'll default to Facebook if not explicitly Instagram
    return 'Facebook';
  } catch (error) {
    console.error('⚠️ Could not determine platform, defaulting to Facebook:', error.message);
    return 'Facebook';
  }
}

/**
 * Get or create project source for Facebook/Instagram
 */
async function getOrCreateSource(platform) {
  try {
    const sourceName = `${platform} Lead Ads`;
    
    let source = await ProjectSource.findOne({ name: sourceName });
    
    if (!source) {
      source = await ProjectSource.create({
        name: sourceName,
        description: `Automatically created for leads from ${platform} Lead Ads`,
        isActive: true
      });
      console.log(`✅ Created new source: ${sourceName}`);
    }
    
    return source.name;
  } catch (error) {
    console.error('❌ Error creating source:', error);
    return `${platform} Lead Ads`;
  }
}

/**
 * Parse field data from Facebook lead
 */
function parseFieldData(fieldData) {
  const data = {};
  
  fieldData.forEach(field => {
    const fieldName = field.name.toLowerCase();
    const value = field.values[0] || '';
    
    // Map Facebook field names to our schema
    if (fieldName.includes('full_name') || fieldName === 'name') {
      data.name = value;
    } else if (fieldName.includes('email')) {
      data.email = value;
    } else if (fieldName.includes('phone')) {
      data.phone = value;
    } else if (fieldName.includes('company')) {
      data.company = value;
    } else if (fieldName.includes('address') || fieldName.includes('street')) {
      data.address = value;
    } else if (fieldName.includes('city')) {
      data.city = value;
    } else if (fieldName.includes('state') || fieldName.includes('province')) {
      data.state = value;
    }
  });
  
  return data;
}

/**
 * Fetch lead details and save to database
 */
async function fetchAndSaveLead(leadgenId, adId, formId, pageId) {
  try {
    // Fetch lead data from Facebook
    const leadData = await fetchLeadFromFacebook(leadgenId);
    
    // Check if lead already exists
    const existingLead = await Client.findOne({ 
      'metadata.facebookLeadId': leadgenId 
    });
    
    if (existingLead) {
      console.log(`⚠️ Lead ${leadgenId} already exists, skipping`);
      return;
    }
    
    // Parse field data
    const parsedData = parseFieldData(leadData.field_data || []);
    
    // Determine platform (Facebook or Instagram)
    const platform = await getLeadPlatform(adId);
    
    // Get campaign information
    const campaignInfo = await getCampaignInfo(adId);
    
    // Get or create source
    const sourceName = await getOrCreateSource(platform);
    
    // Get default sales person (first active sales user)
    const defaultSalesPerson = await User.findOne({ 
      role: 'sales', 
      isActive: true 
    }).sort({ createdAt: 1 });
    
    if (!defaultSalesPerson) {
      console.error('❌ No active sales person found to assign lead');
      return;
    }
    
    // Create new client
    const newClient = await Client.create({
      name: parsedData.name || 'Unknown',
      phone: parsedData.phone || '',
      email: parsedData.email || '',
      company: parsedData.company || '',
      address: parsedData.address || '',
      city: parsedData.city || '',
      state: parsedData.state || '',
      source: sourceName,
      tags: `Fetched from ${platform}`,
      assignedTo: defaultSalesPerson._id,
      status: 'pending',
      priority: 'high', // New leads from ads are high priority
      importMethod: platform.toLowerCase(),
      importedAt: new Date(),
      notes: `Lead generated from ${platform} Lead Ads\nCampaign: ${campaignInfo.campaignName}\nAd ID: ${adId}\nForm ID: ${formId}`,
      metadata: {
        facebookLeadId: leadgenId,
        facebookAdId: adId,
        facebookFormId: formId,
        facebookPageId: pageId,
        facebookCampaignId: campaignInfo.campaignId,
        facebookCampaignName: campaignInfo.campaignName,
        platform: platform
      }
    });
    
    console.log(`✅ Lead saved successfully: ${newClient.name} (${newClient._id})`);
    console.log(`   Platform: ${platform}`);
    console.log(`   Campaign: ${campaignInfo.campaignName} (${campaignInfo.campaignId})`);
    console.log(`   Source: ${sourceName}`);
    console.log(`   Phone: ${newClient.phone}`);
    console.log(`   Email: ${newClient.email}`);
    
  } catch (error) {
    console.error('❌ Error saving lead:', error);
    throw error;
  }
}

/**
 * @swagger
 * /api/facebook-webhook/test:
 *   post:
 *     summary: Test webhook with sample data
 *     description: Test the webhook endpoint with sample lead data
 *     tags: [Facebook Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadgenId:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [Facebook, Instagram]
 *     responses:
 *       200:
 *         description: Test successful
 *       500:
 *         description: Test failed
 */
router.post('/test', async (req, res) => {
  try {
    const { leadgenId, platform = 'Facebook' } = req.body;
    
    if (!leadgenId) {
      return res.status(400).json({ 
        error: 'leadgenId is required' 
      });
    }
    
    console.log(`🧪 Testing webhook with leadgenId: ${leadgenId}`);
    
    await fetchAndSaveLead(leadgenId, 'test-ad-id', 'test-form-id', 'test-page-id');
    
    res.json({ 
      success: true, 
      message: 'Test lead processed successfully',
      leadgenId,
      platform
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/facebook-webhook/create-sample:
 *   post:
 *     summary: Create sample Facebook/Instagram lead
 *     description: Create a sample lead without needing Facebook API access
 *     tags: [Facebook Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [facebook, instagram]
 *                 default: facebook
 *               campaignName:
 *                 type: string
 *                 default: Sample Campaign
 *               campaignId:
 *                 type: string
 *                 default: 123456789
 *               name:
 *                 type: string
 *                 default: John Doe
 *               phone:
 *                 type: string
 *                 default: 9876543210
 *               email:
 *                 type: string
 *                 default: john@example.com
 *               company:
 *                 type: string
 *                 default: Sample Company
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sample lead created successfully
 *       500:
 *         description: Failed to create sample lead
 */
router.post('/create-sample', async (req, res) => {
  try {
    const {
      platform = 'facebook',
      campaignName = 'Sample Campaign',
      campaignId = '123456789',
      name = 'John Doe',
      phone = '9876543210',
      email = 'john@example.com',
      company = 'Sample Company',
      address = '',
      city = '',
      state = ''
    } = req.body;

    // Validate platform
    if (!['facebook', 'instagram'].includes(platform.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid platform',
        message: 'Platform must be either "facebook" or "instagram"'
      });
    }

    const platformCapitalized = platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();

    console.log(`🧪 Creating sample ${platformCapitalized} lead...`);

    // Get or create source
    const sourceName = await getOrCreateSource(platformCapitalized);

    // Get default sales person (first active sales user)
    const defaultSalesPerson = await User.findOne({ 
      role: 'sales', 
      isActive: true 
    }).sort({ createdAt: 1 });

    if (!defaultSalesPerson) {
      return res.status(404).json({
        error: 'No sales person found',
        message: 'Please create at least one active sales user first'
      });
    }

    // Generate unique IDs for this sample lead
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const sampleLeadId = `sample_lead_${timestamp}_${randomId}`;
    const sampleAdId = `sample_ad_${timestamp}_${randomId}`;
    const sampleFormId = `sample_form_${timestamp}_${randomId}`;
    const samplePageId = `sample_page_${timestamp}_${randomId}`;

    // Create new client
    const newClient = await Client.create({
      name: name,
      phone: phone,
      email: email,
      company: company,
      address: address,
      city: city,
      state: state,
      source: sourceName,
      tags: `Sample Lead from ${platformCapitalized}`,
      assignedTo: defaultSalesPerson._id,
      status: 'pending',
      priority: 'high',
      importMethod: platform.toLowerCase(),
      importedAt: new Date(),
      notes: `Sample lead generated for testing\nPlatform: ${platformCapitalized}\nCampaign: ${campaignName}\nCampaign ID: ${campaignId}`,
      metadata: {
        facebookLeadId: sampleLeadId,
        facebookAdId: sampleAdId,
        facebookFormId: sampleFormId,
        facebookPageId: samplePageId,
        facebookCampaignId: campaignId,
        facebookCampaignName: campaignName,
        platform: platformCapitalized,
        isSampleData: true
      }
    });

    console.log(`✅ Sample lead created successfully: ${newClient.name} (${newClient._id})`);

    res.json({
      success: true,
      message: 'Sample lead created successfully',
      lead: {
        id: newClient._id,
        uniqueId: newClient.uniqueId,
        name: newClient.name,
        phone: newClient.phone,
        email: newClient.email,
        company: newClient.company,
        platform: platformCapitalized,
        campaign: {
          id: campaignId,
          name: campaignName
        },
        assignedTo: {
          id: defaultSalesPerson._id,
          name: defaultSalesPerson.name,
          email: defaultSalesPerson.email
        },
        createdAt: newClient.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Failed to create sample lead:', error);
    res.status(500).json({
      error: 'Failed to create sample lead',
      message: error.message
    });
  }
});

module.exports = router;
