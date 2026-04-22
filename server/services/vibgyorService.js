const axios = require('axios');

/**
 * Parse budget string to integer
 * Converts formats like "10L", "10l", "10K", "10k" to actual numbers
 * @param {string} budgetStr - Budget string (e.g., "10L", "5K", "1000000")
 * @returns {number} - Budget as integer
 */
function parseBudget(budgetStr) {
  if (!budgetStr) return 0;
  
  // Convert to string and trim
  const str = String(budgetStr).trim().toUpperCase();
  
  // If it's already a number, return it
  if (!isNaN(str)) {
    return parseInt(str);
  }
  
  // Extract number and suffix
  const match = str.match(/^([\d.]+)\s*([LKlk])?$/);
  if (!match) return 0;
  
  const number = parseFloat(match[1]);
  const suffix = match[2];
  
  if (suffix === 'L') {
    // Lakh = 100,000
    return Math.round(number * 100000);
  } else if (suffix === 'K') {
    // Thousand = 1,000
    return Math.round(number * 1000);
  }
  
  return Math.round(number);
}

/**
 * Extract employee ID number from format like "VIB2-032"
 * Returns just the numeric part after the dash, removing leading zeros
 * @param {string} employeeId - Employee ID (e.g., "VIB2-032")
 * @returns {number} - Numeric employee ID (e.g., 32)
 */
function extractEmployeeId(employeeId) {
  if (!employeeId) return 1; // Default to 1 if not provided
  
  // Extract part after the dash
  const parts = employeeId.split('-');
  if (parts.length < 2) return 1;
  
  // Convert to number (automatically removes leading zeros)
  const numericId = parseInt(parts[1]);
  return isNaN(numericId) ? 1 : numericId;
}

/**
 * Generate a random transaction ID
 * @returns {string} - Random ID in format like "TXN-1234567890"
 */
function generateTid() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `TXN-${timestamp}${random}`;
}

/**
 * Send qualified lead to Vibgyor API
 * @param {Object} lead - Lead object from database
 * @returns {Promise<Object>} - API response
 */
async function sendQualifiedLead(lead) {
  try {
    const VIBGYOR_API_URL = process.env.VIBGYOR_API_URL;
    const VIBGYOR_API_KEY = process.env.VIBGYOR_API_KEY;

    if (!VIBGYOR_API_URL || !VIBGYOR_API_KEY) {
      console.error('❌ Vibgyor API credentials not configured in .env file');
      throw new Error('Vibgyor API credentials not configured');
    }

    // Prepare lead data
    const leadData = {
      companyId: 1,
      createdBy: 1,
      leads: [
        {
          clientName: lead.name || '',
          phoneNo: lead.phone || '',
          projectName: lead.company || '',
          budget: parseBudget(lead.budget),
          projectAddress: lead.address || '',
          location: lead.address || '',
          leadSource: lead.source || '',
          tid: generateTid(),
          presalesEmployeeId: extractEmployeeId(lead.assignedTo?.employeeId),
          tags: lead.tags || '',
          state: lead.state || '',
          email: lead.email || '',
          remarks: lead.description || lead.notes || '',
          leadReceivedDate: lead.createdAt ? new Date(lead.createdAt).toISOString() : new Date().toISOString()
        }
      ]
    };

    console.log('📤 Sending qualified lead to Vibgyor API...');
    console.log('   Lead Name:', lead.name);
    console.log('   Phone:', lead.phone);
    console.log('   Budget:', leadData.leads[0].budget);
    console.log('   Employee ID:', leadData.leads[0].presalesEmployeeId);

    // Make API request
    const response = await axios.post(
      `${VIBGYOR_API_URL}leads/presalesBulk`,
      leadData,
      {
        headers: {
          'Authorization': `Bearer ${VIBGYOR_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('✅ Lead sent to Vibgyor API successfully');
    console.log('   Response:', response.data);

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Error sending lead to Vibgyor API:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }

    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

module.exports = {
  sendQualifiedLead,
  parseBudget,
  extractEmployeeId,
  generateTid
};
