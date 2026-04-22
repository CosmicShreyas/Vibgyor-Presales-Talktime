import { useContext } from 'react';
import { CallsContext } from '@/contexts/CallsContext';

export function useCalls() {
  const context = useContext(CallsContext);
  if (!context) throw new Error('useCalls must be used within CallsProvider');
  return context;
}
