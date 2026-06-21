import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinedAt: string;
}

interface ActivityContextType {
  currentActivityId: string | null;
  setCurrentActivityId: (id: string | null) => void;
  participants: Participant[];
  setParticipants: (participants: Participant[]) => void;
}

const defaultContextValue: ActivityContextType = {
  currentActivityId: null,
  setCurrentActivityId: () => {},
  participants: [],
  setParticipants: () => {},
};

const ActivityContext = createContext<ActivityContextType>(defaultContextValue);

interface ActivityProviderProps {
  children: ReactNode;
}

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  return (
    <ActivityContext.Provider
      value={{
        currentActivityId,
        setCurrentActivityId,
        participants,
        setParticipants,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = (): ActivityContextType => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

export default ActivityContext;
