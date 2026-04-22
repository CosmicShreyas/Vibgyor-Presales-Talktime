import { UpdatePayload, CallRecord } from '@/types';
import apiService, { Lead } from './api';

// Helper to convert API Lead to Client format
const convertLeadToClient = (lead: Lead): any => {
  return {
    id: lead._id,
    name: lead.name,
    company: lead.project || lead.company || 'N/A',
    phone: lead.phone,
    email: lead.email || '',
    industry: lead.company || 'N/A',
    value: lead.budget || 'N/A',
    scheduledTime: 'N/A',
    location: lead.city || 'N/A',
    priority: lead.priority || 'medium',
    notes: lead.notes || '',
    status: lead.status,
    lastContact: lead.updatedAt ? new Date(lead.updatedAt).toISOString().split('T')[0] : '',
    callHistory: [],
  };
};

// Helper to convert API CallRecord to app format
const convertApiCallRecord = (record: any): CallRecord => {
  const client = typeof record.clientId === 'object' ? record.clientId : null;
  const timestamp = new Date(record.timestamp || record.createdAt);
  
  return {
    id: record._id,
    clientId: typeof record.clientId === 'string' ? record.clientId : record.clientId._id,
    clientName: client?.name || 'Unknown',
    company: client?.company || 'N/A',
    date: timestamp.toISOString().split('T')[0],
    time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status: record.status,
    notes: record.notes || '',
    callbackDate: record.callbackDate,
    callDuration: record.callDuration,
  };
};

export const callsService = {
  getTodayCalls: async (employeeId: string): Promise<any[]> => {
    try {
      const leads = await apiService.getLeads();
      return leads.map(convertLeadToClient);
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  },

  updateCallStatus: async (employeeId: string, payload: UpdatePayload): Promise<boolean> => {
    try {
      // Update the lead status
      await apiService.updateLead(payload.clientId, {
        status: payload.status as any,
        notes: payload.notes,
      });

      // Create a call record
      await apiService.createCallRecord({
        clientId: payload.clientId,
        status: payload.status,
        notes: payload.notes,
        callbackDate: payload.callbackDate,
        callDuration: payload.callDuration,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Error updating call status:', error);
      return false;
    }
  },

  getCallHistory: async (employeeId: string): Promise<CallRecord[]> => {
    try {
      const history = await apiService.getCallHistory();
      return history.map(convertApiCallRecord);
    } catch (error) {
      console.error('Error fetching call history:', error);
      return [];
    }
  },

  getCallStats: async (): Promise<{ totalCalls: number; thisMonth: number; successRate: number }> => {
    try {
      return await apiService.getCallStats();
    } catch (error) {
      console.error('Error fetching call stats:', error);
      return { totalCalls: 0, thisMonth: 0, successRate: 0 };
    }
  },
};
