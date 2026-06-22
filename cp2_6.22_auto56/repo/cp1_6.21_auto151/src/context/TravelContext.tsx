import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Trip, TravelState, TravelAction } from '@/types';

const initialState: TravelState = {
  trips: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedTrip: null,
  noteModalVisible: false,
  sidebarVisible: true,
};

function travelReducer(state: TravelState, action: TravelAction): TravelState {
  switch (action.type) {
    case 'SET_TRIPS':
      return { ...state, trips: action.payload };
    case 'ADD_TRIP':
      return { ...state, trips: [...state.trips, action.payload] };
    case 'UPDATE_TRIP':
      return {
        ...state,
        trips: state.trips.map((trip) =>
          trip.id === action.payload.id ? action.payload : trip
        ),
        selectedTrip:
          state.selectedTrip?.id === action.payload.id
            ? action.payload
            : state.selectedTrip,
      };
    case 'DELETE_TRIP':
      return {
        ...state,
        trips: state.trips.filter((trip) => trip.id !== action.payload),
        selectedTrip:
          state.selectedTrip?.id === action.payload ? null : state.selectedTrip,
      };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_SELECTED_TRIP':
      return { ...state, selectedTrip: action.payload };
    case 'SET_NOTE_MODAL_VISIBLE':
      return { ...state, noteModalVisible: action.payload };
    case 'SET_SIDEBAR_VISIBLE':
      return { ...state, sidebarVisible: action.payload };
    case 'REORDER_TRIPS':
      const otherTrips = state.trips.filter(
        (trip) => trip.date !== action.payload.date
      );
      return {
        ...state,
        trips: [...otherTrips, ...action.payload.trips],
      };
    default:
      return state;
  }
}

interface TravelContextType {
  state: TravelState;
  dispatch: React.Dispatch<TravelAction>;
  fetchTrips: (date?: string) => Promise<void>;
  addTrip: (trip: Omit<Trip, 'id'>) => Promise<void>;
  updateTrip: (id: string, trip: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  generateNote: (title: string, location: string, rating: number) => Promise<string>;
  exportMarkdown: () => Promise<void>;
  getTripsByDate: (date: string) => Trip[];
  getUniqueDates: () => string[];
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export function TravelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(travelReducer, initialState);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async (date?: string) => {
    try {
      const url = date ? `/api/trips?date=${date}` : '/api/trips/all';
      const response = await axios.get<Trip[]>(url);
      dispatch({ type: 'SET_TRIPS', payload: response.data });
    } catch (error) {
      console.error('获取行程失败:', error);
    }
  };

  const addTrip = async (trip: Omit<Trip, 'id'>) => {
    try {
      const response = await axios.post<Trip>('/api/trips', trip);
      dispatch({ type: 'ADD_TRIP', payload: response.data });
    } catch (error) {
      console.error('添加行程失败:', error);
    }
  };

  const updateTrip = async (id: string, trip: Partial<Trip>) => {
    try {
      const response = await axios.put<Trip>(`/api/trips/${id}`, trip);
      dispatch({ type: 'UPDATE_TRIP', payload: response.data });
    } catch (error) {
      console.error('更新行程失败:', error);
    }
  };

  const deleteTrip = async (id: string) => {
    try {
      await axios.delete(`/api/trips/${id}`);
      dispatch({ type: 'DELETE_TRIP', payload: id });
    } catch (error) {
      console.error('删除行程失败:', error);
    }
  };

  const generateNote = async (title: string, location: string, rating: number): Promise<string> => {
    try {
      const response = await axios.post<{ note: string }>('/api/notes/generate', {
        title,
        location,
        rating,
      });
      return response.data.note;
    } catch (error) {
      console.error('生成笔记失败:', error);
      return '';
    }
  };

  const exportMarkdown = async () => {
    try {
      const response = await axios.post<{ content: string; filename: string }>(
        '/api/export'
      );
      const { content, filename } = response.data;
      
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const getTripsByDate = (date: string): Trip[] => {
    return state.trips
      .filter((trip) => trip.date === date)
      .sort((a, b) => a.order - b.order);
  };

  const getUniqueDates = (): string[] => {
    const dates = [...new Set(state.trips.map((trip) => trip.date))];
    return dates.sort();
  };

  return (
    <TravelContext.Provider
      value={{
        state,
        dispatch,
        fetchTrips,
        addTrip,
        updateTrip,
        deleteTrip,
        generateNote,
        exportMarkdown,
        getTripsByDate,
        getUniqueDates,
      }}
    >
      {children}
    </TravelContext.Provider>
  );
}

export function useTravel() {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
}
