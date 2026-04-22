const axios = require('axios');

const MAPPING_API_URL = process.env.MAPPING_API_URL || 'https://api.vibgyor.co.in/api';

/**
 * Fetch mapping leads from external API
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Number of leads per page (default: 20)
 * @returns {Promise<Object>} - Response with leads data
 */
const fetchMappingLeads = async (page = 1, pageSize = 20) => {
  try {
    const url = `${MAPPING_API_URL}/mappings/getLeadsByUser/0?page=${page}&pageSize=${pageSize}`;
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    if (response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        totalCount: response.data.totalCount || response.data.data.length
      };
    }

    return {
      success: false,
      error: 'No data received from mapping API'
    };
  } catch (error) {
    console.error('❌ Error fetching mapping leads:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Transform mapping lead data to our Client model format
 * @param {Object} mappingLead - Lead data from mapping API
 * @returns {Object} - Transformed lead data
 */
const transformMappingLead = (mappingLead) => {
  return {
    name: mappingLead.clientName || 'Unknown',
    phone: mappingLead.phoneNo || '',
    alternatePhone: mappingLead.alternativeMobileNumber || '',
    email: mappingLead.email || '',
    company: mappingLead.projectName || '',
    address: mappingLead.address || mappingLead.projectAddress || '',
    city: mappingLead.location || '',
    description: mappingLead.description || mappingLead.remarks || '',
    source: 'Mapping',
    budget: mappingLead.budget ? mappingLead.budget.toString() : '',
    status: mapMappingStatus(mappingLead.status),
    priority: 'medium',
    importMethod: 'mapping',
    metadata: {
      mappingLeadId: mappingLead.leadId,
      tid: mappingLead.tid,
      projectType: mappingLead.projectType,
      projectConfiguration: mappingLead.projectConfiguration,
      projectStatus: mappingLead.projectStatus,
      leadSource: mappingLead.leadSource,
      leadReceivedDate: mappingLead.leadReceivedDate,
      handingOverDate: mappingLead.handingOverDate,
      beName: mappingLead.beName,
      bePhone: mappingLead.bePhone,
      photos: mappingLead.photos || [],
      presalesEmployeeId: mappingLead.presalesEmployeeId,
      salesPersonEmployeeId: mappingLead.salesPersonEmployeeId
    }
  };
};

/**
 * Map mapping API status to our status values
 * @param {string} mappingStatus - Status from mapping API
 * @returns {string} - Our status value
 */
const mapMappingStatus = (mappingStatus) => {
  const statusMap = {
    'Yet to contact': 'pending',
    'Contacted': 'contacted',
    'Interested': 'interested',
    'Not Interested': 'not-interested',
    'Closed': 'closed',
    'Follow up': 'follow-up'
  };

  return statusMap[mappingStatus] || 'pending';
};

module.exports = {
  fetchMappingLeads,
  transformMappingLead
};
