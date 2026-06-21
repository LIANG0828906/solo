import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Trainee, DepartmentStats, QuestionnaireListItem } from '../types';
import axios from 'axios';

interface AppContextType {
  trainees: Trainee[];
  departmentStats: DepartmentStats[];
  questionnaires: QuestionnaireListItem[];
  loading: boolean;
  socket: Socket | null;
  refreshTrainees: () => Promise<void>;
  refreshQuestionnaires: () => Promise<void>;
  refreshDepartmentStats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io({
      path: '/socket.io'
    });
    setSocket(newSocket);

    newSocket.on('trainees:updated', () => {
      refreshTrainees();
      refreshDepartmentStats();
    });

    newSocket.on('trainee:status', () => {
      refreshTrainees();
      refreshDepartmentStats();
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshTrainees(),
        refreshDepartmentStats(),
        refreshQuestionnaires()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrainees = async () => {
    try {
      const response = await axios.get('/api/trainee');
      setTrainees(response.data);
    } catch (error) {
      console.error('Failed to fetch trainees:', error);
    }
  };

  const refreshQuestionnaires = async () => {
    try {
      const response = await axios.get('/api/questionnaire');
      setQuestionnaires(response.data);
    } catch (error) {
      console.error('Failed to fetch questionnaires:', error);
    }
  };

  const refreshDepartmentStats = async () => {
    try {
      const response = await axios.get('/api/trainee/departments');
      setDepartmentStats(response.data);
    } catch (error) {
      console.error('Failed to fetch department stats:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        trainees,
        departmentStats,
        questionnaires,
        loading,
        socket,
        refreshTrainees,
        refreshQuestionnaires,
        refreshDepartmentStats
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
