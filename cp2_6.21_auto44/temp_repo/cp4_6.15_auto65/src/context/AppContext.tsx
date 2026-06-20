// 共享状态上下文管理
// 管理所有资源列表、预约列表和当前登录用户状态
// 数据流向：用户操作 -> AppContext 更新 -> UI 组件重渲染
// 被调用方：src/pages/Dashboard.tsx, src/pages/AdminPanel.tsx, src/components/*
// 调用方：src/App.tsx

import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AppState,
  AppAction,
  Resource,
  Reservation,
  BlockedPeriod,
  User,
  FilterType,
  RESOURCE_COLORS,
} from '@/types';
import { isSameDay, startOfDay, endOfDay, areIntervalsOverlapping } from 'date-fns';

const initialResources: Resource[] = [
  { id: '1', name: '工位A1', type: 'station', capacity: 1, color: RESOURCE_COLORS.station },
  { id: '2', name: '工位A2', type: 'station', capacity: 1, color: RESOURCE_COLORS.station },
  { id: '3', name: '工位A3', type: 'station', capacity: 1, color: RESOURCE_COLORS.station },
  { id: '4', name: '工位B1', type: 'station', capacity: 1, color: RESOURCE_COLORS.station },
  { id: '5', name: '会议室A', type: 'meeting_room', capacity: 8, color: RESOURCE_COLORS.meeting_room },
  { id: '6', name: '会议室B', type: 'meeting_room', capacity: 12, color: RESOURCE_COLORS.meeting_room },
  { id: '7', name: '讨论区1号', type: 'discussion_area', capacity: 6, color: RESOURCE_COLORS.discussion_area },
  { id: '8', name: '讨论区2号', type: 'discussion_area', capacity: 4, color: RESOURCE_COLORS.discussion_area },
  { id: '9', name: '露台座位1', type: 'terrace', capacity: 2, color: RESOURCE_COLORS.terrace },
  { id: '10', name: '露台座位2', type: 'terrace', capacity: 2, color: RESOURCE_COLORS.terrace },
];

const today = new Date();
const initialReservations: Reservation[] = [
  {
    id: 'r1',
    resourceId: '5',
    userId: 'u1',
    userName: '张三',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
    note: '项目周会',
    createdAt: new Date(),
  },
  {
    id: 'r2',
    resourceId: '5',
    userId: 'u2',
    userName: '李四',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
    note: '客户访谈',
    createdAt: new Date(),
  },
  {
    id: 'r3',
    resourceId: '7',
    userId: 'u3',
    userName: '王五',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
    note: '头脑风暴',
    createdAt: new Date(),
  },
  {
    id: 'r4',
    resourceId: '1',
    userId: 'u1',
    userName: '张三',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0),
    note: '',
    createdAt: new Date(),
  },
  {
    id: 'r5',
    resourceId: '9',
    userId: 'u4',
    userName: '赵六',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
    note: '户外办公',
    createdAt: new Date(),
  },
];

const initialBlockedPeriods: BlockedPeriod[] = [];

const initialUser: User = {
  id: 'u1',
  name: '张三',
  role: 'admin',
};

const initialState: AppState = {
  resources: initialResources,
  reservations: initialReservations,
  blockedPeriods: initialBlockedPeriods,
  currentUser: initialUser,
  filterType: 'all',
  searchQuery: '',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'ADD_RESOURCE':
      return { ...state, resources: [...state.resources, action.payload] };

    case 'DELETE_RESOURCE':
      return {
        ...state,
        resources: state.resources.filter((r) => r.id !== action.payload),
        reservations: state.reservations.filter((r) => r.resourceId !== action.payload),
      };

    case 'ADD_RESERVATION':
      return { ...state, reservations: [...state.reservations, action.payload] };

    case 'DELETE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.filter((r) => r.id !== action.payload),
      };

    case 'ADD_BLOCKED_PERIOD':
      return { ...state, blockedPeriods: [...state.blockedPeriods, action.payload] };

    case 'DELETE_BLOCKED_PERIOD':
      return {
        ...state,
        blockedPeriods: state.blockedPeriods.filter((b) => b.id !== action.payload),
      };

    case 'SET_FILTER_TYPE':
      return { ...state, filterType: action.payload };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addResource: (resource: Omit<Resource, 'id'>) => void;
  deleteResource: (id: string) => void;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  deleteReservation: (id: string) => void;
  addBlockedPeriod: (blocked: Omit<BlockedPeriod, 'id'>) => void;
  deleteBlockedPeriod: (id: string) => void;
  setFilterType: (type: FilterType) => void;
  setSearchQuery: (query: string) => void;
  checkConflict: (resourceId: string, startTime: Date, endTime: Date, excludeId?: string) => string | null;
  isDateBlocked: (date: Date) => boolean;
  filteredResources: Resource[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const checkConflict = (resourceId: string, startTime: Date, endTime: Date, excludeId?: string): string | null => {
    const dateStr = startTime.toISOString().split('T')[0];
    const isBlocked = state.blockedPeriods.some((b) => b.date === dateStr && b.isAllDay);
    if (isBlocked) {
      return '该日期为节假日，不可预约';
    }

    const conflicting = state.reservations.find((r) => {
      if (r.id === excludeId) return false;
      if (r.resourceId !== resourceId) return false;
      return areIntervalsOverlapping(
        { start: startTime, end: endTime },
        { start: new Date(r.startTime), end: new Date(r.endTime) }
      );
    });

    if (conflicting) {
      return `该时段已被 ${conflicting.userName} 预约`;
    }

    return null;
  };

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return state.blockedPeriods.some((b) => b.date === dateStr && b.isAllDay);
  };

  const addResource = (resource: Omit<Resource, 'id'>) => {
    const newResource: Resource = { ...resource, id: uuidv4() };
    dispatch({ type: 'ADD_RESOURCE', payload: newResource });
  };

  const deleteResource = (id: string) => {
    dispatch({ type: 'DELETE_RESOURCE', payload: id });
  };

  const addReservation = (
    reservation: Omit<Reservation, 'id' | 'createdAt'>
  ): { success: boolean; error?: string } => {
    const conflict = checkConflict(
      reservation.resourceId,
      new Date(reservation.startTime),
      new Date(reservation.endTime)
    );
    if (conflict) {
      return { success: false, error: conflict };
    }

    const newReservation: Reservation = {
      ...reservation,
      id: uuidv4(),
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_RESERVATION', payload: newReservation });
    return { success: true };
  };

  const deleteReservation = (id: string) => {
    dispatch({ type: 'DELETE_RESERVATION', payload: id });
  };

  const addBlockedPeriod = (blocked: Omit<BlockedPeriod, 'id'>) => {
    const exists = state.blockedPeriods.some((b) => b.date === blocked.date);
    if (!exists) {
      const newBlocked: BlockedPeriod = { ...blocked, id: uuidv4() };
      dispatch({ type: 'ADD_BLOCKED_PERIOD', payload: newBlocked });
    }
  };

  const deleteBlockedPeriod = (id: string) => {
    dispatch({ type: 'DELETE_BLOCKED_PERIOD', payload: id });
  };

  const setFilterType = (type: FilterType) => {
    dispatch({ type: 'SET_FILTER_TYPE', payload: type });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const filteredResources = useMemo(() => {
    let result = state.resources;
    if (state.filterType !== 'all') {
      result = result.filter((r) => r.type === state.filterType);
    }
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(query));
    }
    return result;
  }, [state.resources, state.filterType, state.searchQuery]);

  const value: AppContextType = {
    state,
    dispatch,
    addResource,
    deleteResource,
    addReservation,
    deleteReservation,
    addBlockedPeriod,
    deleteBlockedPeriod,
    setFilterType,
    setSearchQuery,
    checkConflict,
    isDateBlocked,
    filteredResources,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
