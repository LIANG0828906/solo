import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { eventBus, Emotion } from '@/eventBus';

export interface Echo {
  id: string;
  text: string;
  createdAt: number;
}

export interface Bottle {
  id: string;
  text: string;
  emotion: Emotion;
  createdAt: number;
  isArchived: boolean;
  echoes: Echo[];
}

export interface CurrentEvent {
  id: string;
  time: string;
  emotion: string;
  isNew: boolean;
}

export interface GlobalState {
  bottles: Bottle[];
  currentBottle: Bottle | null;
  stats: {
    thrown: number;
    received: number;
    archived: number;
    weeklyEmotions: Record<string, number[]>;
  };
  currentEvents: CurrentEvent[];
}

type Action =
  | { type: 'ADD_BOTTLE'; bottle: Bottle }
  | { type: 'SET_CURRENT_BOTTLE'; bottle: Bottle | null }
  | { type: 'OPEN_BOTTLE'; id: string }
  | { type: 'ADD_ECHO'; bottleId: string; echo: Echo }
  | { type: 'ARCHIVE_BOTTLES'; ids: string[] }
  | { type: 'UPDATE_STATS' }
  | { type: 'ADD_CURRENT_EVENT'; event: CurrentEvent }
  | { type: 'CLEAR_EVENT_NEW'; id: string }
  | { type: 'LOAD_STATE'; state: GlobalState };

const STORAGE_KEY_BOTTLES = 'driftbottle_bottles';
const STORAGE_KEY_STATS = 'driftbottle_stats';

const getDayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getLast7Days = (): string[] => {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(getDayKey(d.getTime()));
  }
  return days;
};

const computeWeeklyEmotions = (bottles: Bottle[]): Record<string, number[]> => {
  const days = getLast7Days();
  const emotions: Emotion[] = ['happy', 'sad', 'think', 'surprise'];
  const result: Record<string, number[]> = {};
  emotions.forEach(e => {
    result[e] = days.map(day =>
      bottles.filter(b => getDayKey(b.createdAt) === day && b.emotion === e).length
    );
  });
  return result;
};

const initialState: GlobalState = {
  bottles: [],
  currentBottle: null,
  stats: { thrown: 0, received: 0, archived: 0, weeklyEmotions: {} },
  currentEvents: [],
};

function reducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.state;
    case 'ADD_BOTTLE': {
      const bottles = [action.bottle, ...state.bottles];
      const thrown = bottles.filter(b => !b.isArchived).length;
      const archived = bottles.filter(b => b.isArchived).length;
      return {
        ...state,
        bottles,
        stats: {
          thrown,
          received: state.stats.received + 1,
          archived,
          weeklyEmotions: computeWeeklyEmotions(bottles),
        },
      };
    }
    case 'SET_CURRENT_BOTTLE':
      return { ...state, currentBottle: action.bottle };
    case 'OPEN_BOTTLE':
      return { ...state, currentBottle: state.bottles.find(b => b.id === action.id) || null };
    case 'ADD_ECHO': {
      const bottles = state.bottles.map(b =>
        b.id === action.bottleId ? { ...b, echoes: [...b.echoes, action.echo] } : b
      );
      return { ...state, bottles };
    }
    case 'ARCHIVE_BOTTLES': {
      const bottles = state.bottles.map(b =>
        action.ids.includes(b.id) ? { ...b, isArchived: true } : b
      );
      const archived = bottles.filter(b => b.isArchived).length;
      return {
        ...state,
        bottles,
        stats: { ...state.stats, archived, weeklyEmotions: computeWeeklyEmotions(bottles) },
      };
    }
    case 'UPDATE_STATS': {
      const thrown = state.bottles.length;
      const archived = state.bottles.filter(b => b.isArchived).length;
      const received = state.stats.received;
      return {
        ...state,
        stats: { thrown, received, archived, weeklyEmotions: computeWeeklyEmotions(state.bottles) },
      };
    }
    case 'ADD_CURRENT_EVENT': {
      const events = [action.event, ...state.currentEvents].slice(0, 5);
      return { ...state, currentEvents: events };
    }
    case 'CLEAR_EVENT_NEW':
      return {
        ...state,
        currentEvents: state.currentEvents.map(e =>
          e.id === action.id ? { ...e, isNew: false } : e
        ),
      };
    default:
      return state;
  }
}

interface GlobalContextValue {
  state: GlobalState;
  dispatch: React.Dispatch<Action>;
  throwBottle: (text: string, emotion: Emotion) => void;
  receiveBottle: () => void;
  openBottle: (id: string) => void;
  sendEcho: (bottleId: string, echoText: string) => void;
}

const GlobalContext = createContext<GlobalContextValue | null>(null);

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOTTLES);
      if (saved) {
        const bottles: Bottle[] = JSON.parse(saved);
        const thrown = bottles.length;
        const archived = bottles.filter(b => b.isArchived).length;
        dispatch({
          type: 'LOAD_STATE',
          state: {
            bottles,
            currentBottle: null,
            stats: { thrown, received: archived, archived, weeklyEmotions: computeWeeklyEmotions(bottles) },
            currentEvents: [],
          },
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOTTLES, JSON.stringify(state.bottles));
    } catch {}
  }, [state.bottles]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const toArchive = state.bottles
        .filter(b => !b.isArchived && now - b.createdAt > 24 * 60 * 60 * 1000)
        .map(b => b.id);
      if (toArchive.length > 0) {
        dispatch({ type: 'ARCHIVE_BOTTLES', ids: toArchive });
        toArchive.forEach(id => eventBus.emit('BOTTLE_ARCHIVED', { id }));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [state.bottles]);

  const throwBottle = useCallback((text: string, emotion: Emotion) => {
    const bottle: Bottle = {
      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text,
      emotion,
      createdAt: Date.now(),
      isArchived: false,
      echoes: [],
    };
    dispatch({ type: 'ADD_BOTTLE', bottle });
    eventBus.emit('BOTTLE_THROWN', { id: bottle.id, text: bottle.text, emotion: bottle.emotion, createdAt: bottle.createdAt });
    dispatch({
      type: 'ADD_CURRENT_EVENT',
      event: {
        id: bottle.id,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        emotion: bottle.emotion,
        isNew: true,
      },
    });
    setTimeout(() => dispatch({ type: 'CLEAR_EVENT_NEW', id: bottle.id }), 500);
  }, []);

  const receiveBottle = useCallback(() => {
    const active = state.bottles.filter(b => !b.isArchived);
    if (active.length > 0) {
      const random = active[Math.floor(Math.random() * active.length)];
      dispatch({ type: 'SET_CURRENT_BOTTLE', bottle: random });
      eventBus.emit('BOTTLE_RECEIVED', { id: random.id });
    }
  }, [state.bottles]);

  const openBottle = useCallback((id: string) => {
    dispatch({ type: 'OPEN_BOTTLE', id });
    eventBus.emit('BOTTLE_OPENED', { id });
  }, []);

  const sendEcho = useCallback((bottleId: string, echoText: string) => {
    const echo: Echo = {
      id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: echoText,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_ECHO', bottleId, echo });
    eventBus.emit('ECHO_SENT', { bottleId, echoText });
  }, []);

  return (
    <GlobalContext.Provider value={{ state, dispatch, throwBottle, receiveBottle, openBottle, sendEcho }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalState() {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error('useGlobalState must be used within GlobalStateProvider');
  return ctx;
}
