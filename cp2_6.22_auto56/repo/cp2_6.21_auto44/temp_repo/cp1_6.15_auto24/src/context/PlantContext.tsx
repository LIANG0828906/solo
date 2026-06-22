import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Plant, SwapRequest, AdoptionPoint, Badge, mockUsers, mockPlants, mockSwapRequests, mockAdoptionPoints, badges } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

interface PlantContextType {
  currentUser: User;
  users: User[];
  plants: Plant[];
  swapRequests: SwapRequest[];
  adoptionPoints: AdoptionPoint[];
  badges: Badge[];
  getUserById: (id: string) => User | undefined;
  getPlantById: (id: string) => Plant | undefined;
  getMyPlants: () => Plant[];
  getRequestsFromMe: () => SwapRequest[];
  getRequestsToMe: () => SwapRequest[];
  createSwapRequest: (plantId: string, reason: string, expectation: string) => void;
  respondToRequest: (requestId: string, accept: boolean) => void;
  getEarnedBadges: () => Badge[];
  addPlant: (plant: Omit<Plant, 'id' | 'ownerId'>) => void;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser] = useState<User>(() => mockUsers.find(u => u.id === 'me')!);
  const [users] = useState<User[]>(mockUsers);
  const [plants, setPlants] = useState<Plant[]>(mockPlants);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(mockSwapRequests);
  const [adoptionPoints] = useState<AdoptionPoint[]>(mockAdoptionPoints);

  const getUserById = (id: string) => users.find(u => u.id === id);
  const getPlantById = (id: string) => plants.find(p => p.id === id);
  const getMyPlants = () => plants.filter(p => p.ownerId === currentUser.id);

  const getRequestsFromMe = () => swapRequests.filter(r => r.fromUserId === currentUser.id);
  const getRequestsToMe = () => swapRequests.filter(r => r.toUserId === currentUser.id);

  const createSwapRequest = (plantId: string, reason: string, expectation: string) => {
    const plant = getPlantById(plantId);
    if (!plant) return;
    const newRequest: SwapRequest = {
      id: uuidv4(),
      fromUserId: currentUser.id,
      toUserId: plant.ownerId,
      plantId,
      reason,
      expectation,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setSwapRequests(prev => [...prev, newRequest]);
  };

  const respondToRequest = (requestId: string, accept: boolean) => {
    setSwapRequests(prev =>
      prev.map(r =>
        r.id === requestId ? { ...r, status: accept ? 'accepted' : 'rejected' } : r
      )
    );
  };

  const getEarnedBadges = () => {
    return badges.filter(b => currentUser.swapCount >= b.requiredSwaps);
  };

  const addPlant = (plant: Omit<Plant, 'id' | 'ownerId'>) => {
    const newPlant: Plant = {
      ...plant,
      id: uuidv4(),
      ownerId: currentUser.id
    };
    setPlants(prev => [newPlant, ...prev]);
  };

  return (
    <PlantContext.Provider
      value={{
        currentUser,
        users,
        plants,
        swapRequests,
        adoptionPoints,
        badges,
        getUserById,
        getPlantById,
        getMyPlants,
        getRequestsFromMe,
        getRequestsToMe,
        createSwapRequest,
        respondToRequest,
        getEarnedBadges,
        addPlant
      }}
    >
      {children}
    </PlantContext.Provider>
  );
};

export const usePlant = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlant must be used within a PlantProvider');
  }
  return context;
};
