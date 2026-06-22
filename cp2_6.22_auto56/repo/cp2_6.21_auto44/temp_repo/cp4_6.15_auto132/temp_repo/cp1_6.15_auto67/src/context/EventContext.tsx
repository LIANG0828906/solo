import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Event, TabType } from '../types';

interface EventState {
  events: Event[];
  activeTab: TabType;
  alert: { message: string; type: 'success' | 'error' } | null;
  loading: boolean;
  enrollModalEvent: Event | null;
  newEventId: string | null;
}

type EventAction =
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_ALERT'; payload: { message: string; type: 'success' | 'error' } | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ENROLL_MODAL'; payload: Event | null }
  | { type: 'SET_NEW_EVENT_ID'; payload: string | null };

const initialState: EventState = {
  events: [],
  activeTab: 'list',
  alert: null,
  loading: true,
  enrollModalEvent: null,
  newEventId: null,
};

function eventReducer(state: EventState, action: EventAction): EventState {
  switch (action.type) {
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e),
      };
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events] };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_ALERT':
      return { ...state, alert: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ENROLL_MODAL':
      return { ...state, enrollModalEvent: action.payload };
    case 'SET_NEW_EVENT_ID':
      return { ...state, newEventId: action.payload };
    default:
      return state;
  }
}

interface EventContextType {
  state: EventState;
  dispatch: React.Dispatch<EventAction>;
  showAlert: (message: string, type: 'success' | 'error') => void;
  fetchEvents: () => Promise<void>;
  enroll: (eventId: string, name: string, phone: string) => Promise<boolean>;
  createEvent: (eventData: Omit<Event, 'id' | 'participants' | 'createdAt'>) => Promise<boolean>;
  signIn: (eventId: string, participantId: string) => Promise<boolean>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  const showAlert = useCallback((message: string, type: 'success' | 'error') => {
    dispatch({ type: 'SET_ALERT', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'SET_ALERT', payload: null }), 3000);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/events');
      const data = await response.json();
      dispatch({ type: 'SET_EVENTS', payload: data });
    } catch (error) {
      console.error('Failed to fetch events:', error);
      showAlert('无法加载活动数据，请确保后端服务已启动', 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [showAlert]);

  const enroll = useCallback(async (eventId: string, name: string, phone: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:3001/api/events/${eventId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '报名失败');
      }

      dispatch({ type: 'UPDATE_EVENT', payload: data.event });
      showAlert('报名成功！', 'success');
      dispatch({ type: 'SET_ENROLL_MODAL', payload: null });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '报名失败';
      showAlert(errorMessage, 'error');
      return false;
    }
  }, [showAlert]);

  const createEvent = useCallback(async (
    eventData: Omit<Event, 'id' | 'participants' | 'createdAt'>
  ): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建活动失败');
      }

      dispatch({ type: 'ADD_EVENT', payload: data });
      dispatch({ type: 'SET_NEW_EVENT_ID', payload: data.id });
      setTimeout(() => dispatch({ type: 'SET_NEW_EVENT_ID', payload: null }), 500);
      showAlert('活动创建成功！', 'success');
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'list' });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建活动失败';
      showAlert(errorMessage, 'error');
      return false;
    }
  }, [showAlert]);

  const signIn = useCallback(async (eventId: string, participantId: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:3001/api/events/${eventId}/signin/${participantId}`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '签到失败');
      }

      dispatch({ type: 'UPDATE_EVENT', payload: data.event });
      showAlert('签到成功！', 'success');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '签到失败';
      showAlert(errorMessage, 'error');
      return false;
    }
  }, [showAlert]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <EventContext.Provider value={{
      state,
      dispatch,
      showAlert,
      fetchEvents,
      enroll,
      createEvent,
      signIn,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
