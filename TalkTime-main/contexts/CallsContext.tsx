import React, { createContext, useState, ReactNode } from 'react';
import { Client, CallRecord, UpdatePayload } from '@/types';
import { callsService } from '@/services/callsService';

interface CallsContextType {
  clients: Client[];
  callHistory: CallRecord[];
  isLoading: boolean;
  isUpdating: boolean;
  fetchTodayCalls: (employeeId: string) => Promise<void>;
  fetchHistory: (employeeId: string) => Promise<void>;
  updateClientStatus: (employeeId: string, payload: UpdatePayload) => Promise<boolean>;
}

export const CallsContext = createContext<CallsContextType | undefined>(undefined);

export function CallsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTodayCalls = async (employeeId: string) => {
    setIsLoading(true);
    try {
      const data = await callsService.getTodayCalls(employeeId);
      setClients(data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (employeeId: string) => {
    setIsLoading(true);
    try {
      const data = await callsService.getCallHistory(employeeId);
      setCallHistory(data);
    } finally {
      setIsLoading(false);
    }
  };

  const updateClientStatus = async (employeeId: string, payload: UpdatePayload): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const success = await callsService.updateCallStatus(employeeId, payload);
      if (success) {
        await fetchTodayCalls(employeeId);
        await fetchHistory(employeeId);
      }
      return success;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <CallsContext.Provider value={{ clients, callHistory, isLoading, isUpdating, fetchTodayCalls, fetchHistory, updateClientStatus }}>
      {children}
    </CallsContext.Provider>
  );
}
