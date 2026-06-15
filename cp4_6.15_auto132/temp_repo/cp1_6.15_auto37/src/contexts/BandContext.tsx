import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { BandMember, Equipment } from '../types';
import { membersApi, equipmentApi } from '../api';

interface BandContextType {
  members: BandMember[];
  equipment: Equipment[];
  loading: boolean;
  refreshMembers: () => Promise<void>;
  refreshEquipment: () => Promise<void>;
  updateEquipmentStatus: (id: string, status: Equipment['status']) => Promise<void>;
}

const BandContext = createContext<BandContextType | undefined>(undefined);

export function BandProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<BandMember[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshMembers = async () => {
    try {
      const data = await membersApi.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const refreshEquipment = async () => {
    setLoading(true);
    try {
      const data = await equipmentApi.getAll();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEquipmentStatus = async (id: string, status: Equipment['status']) => {
    try {
      await equipmentApi.update(id, { status });
      await refreshEquipment();
    } catch (error) {
      console.error('Failed to update equipment status:', error);
    }
  };

  useEffect(() => {
    refreshMembers();
    refreshEquipment();
  }, []);

  return (
    <BandContext.Provider
      value={{
        members,
        equipment,
        loading,
        refreshMembers,
        refreshEquipment,
        updateEquipmentStatus,
      }}
    >
      {children}
    </BandContext.Provider>
  );
}

export function useBand() {
  const context = useContext(BandContext);
  if (context === undefined) {
    throw new Error('useBand must be used within a BandProvider');
  }
  return context;
}
