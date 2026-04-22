export interface Employee {
  id: string;
  employeeId?: string;
  mappingId?: string;
  name: string;
  password: string;
  role: 'sales' | 'mapping' | string;
  avatar: string;
  department: string;
  phone: string;
  joinDate: string;
  stats: {
    totalCalls: number;
    successRate: number;
    thisMonth: number;
  };
}

export interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  industry: string;
  value: string;
  scheduledTime: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
  status: string;
  lastContact: string;
  callHistory: CallRecord[];
  lastCallDuration?: number; // seconds
}

export interface CallRecord {
  id: string;
  clientId: string;
  clientName: string;
  company: string;
  date: string;
  time: string;
  status: string;
  notes: string;
  callbackDate?: string;
  callDuration?: number; // seconds
}

export interface CallStatus {
  key: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export interface UpdatePayload {
  clientId: string;
  status: string;
  notes: string;
  callbackDate?: string;
  callDuration?: number; // seconds
}
