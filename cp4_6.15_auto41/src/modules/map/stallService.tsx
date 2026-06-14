import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { Stall, Category, SortType } from '@/types';
import { mockStalls } from '@/data/mockStalls';

interface StallServiceContextType {
  stalls: Stall[];
  filteredStalls: Stall[];
  selectedStallId: string | null;
  selectedStall: Stall | null;
  activeCategories: Set<Category>;
  sortType: SortType;
  userPosition: { lat: number; lng: number };
  addStall: (stall: Omit<Stall, 'id' | 'createdAt' | 'distance'>) => void;
  updateStall: (id: string, updates: Partial<Stall>) => void;
  deleteStall: (id: string) => void;
  toggleStallStatus: (id: string) => void;
  setSelectedStallId: (id: string | null) => void;
  toggleCategory: (category: Category) => void;
  setSortType: (sort: SortType) => void;
  updateStallPosition: (id: string, lat: number, lng: number) => void;
  getStallById: (id: string) => Stall | undefined;
}

const StallServiceContext = createContext<StallServiceContextType | undefined>(undefined);

const DEFAULT_USER_POSITION = { lat: 39.9042, lng: 116.4074 };

const ALL_CATEGORIES: Category[] = ['handcraft', 'books', 'clothing', 'electronics', 'food'];

function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function StallServiceProvider({ children }: { children: ReactNode }) {
  const [stalls, setStalls] = useState<Stall[]>(mockStalls);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(ALL_CATEGORIES));
  const [sortType, setSortType] = useState<SortType>('distance');
  const [userPosition] = useState(DEFAULT_USER_POSITION);

  const stallsWithDistance = useMemo(() => {
    return stalls.map(stall => ({
      ...stall,
      distance: calculateDistance(
        userPosition.lat, userPosition.lng,
        stall.position.lat, stall.position.lng
      )
    }));
  }, [stalls, userPosition]);

  const filteredStalls = useMemo(() => {
    let result = stallsWithDistance.filter(stall => activeCategories.has(stall.category));

    const closedStalls = result.filter(s => !s.isOpen);
    const openStalls = result.filter(s => s.isOpen);

    const sortFn = (a: Stall, b: Stall): number => {
      switch (sortType) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'rating':
          return b.rating - a.rating;
        case 'latest':
          return b.createdAt - a.createdAt;
        default:
          return 0;
      }
    };

    openStalls.sort(sortFn);
    closedStalls.sort(sortFn);

    return [...openStalls, ...closedStalls];
  }, [stallsWithDistance, activeCategories, sortType]);

  const selectedStall = useMemo(() => {
    if (!selectedStallId) return null;
    return stallsWithDistance.find(s => s.id === selectedStallId) || null;
  }, [stallsWithDistance, selectedStallId]);

  const addStall = useCallback((stallData: Omit<Stall, 'id' | 'createdAt' | 'distance'>) => {
    const newStall: Stall = {
      ...stallData,
      id: generateId(),
      createdAt: Date.now(),
      distance: 0
    };
    setStalls(prev => [...prev, newStall]);
  }, []);

  const updateStall = useCallback((id: string, updates: Partial<Stall>) => {
    setStalls(prev => prev.map(stall =>
      stall.id === id ? { ...stall, ...updates } : stall
    ));
  }, []);

  const deleteStall = useCallback((id: string) => {
    setStalls(prev => prev.filter(stall => stall.id !== id));
    setSelectedStallId(current => current === id ? null : current);
  }, []);

  const toggleStallStatus = useCallback((id: string) => {
    setStalls(prev => prev.map(stall =>
      stall.id === id ? { ...stall, isOpen: !stall.isOpen } : stall
    ));
  }, []);

  const toggleCategory = useCallback((category: Category) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const updateStallPosition = useCallback((id: string, lat: number, lng: number) => {
    setStalls(prev => prev.map(stall =>
      stall.id === id
        ? { ...stall, position: { lat, lng } }
        : stall
    ));
  }, []);

  const getStallById = useCallback((id: string) => {
    return stallsWithDistance.find(s => s.id === id);
  }, [stallsWithDistance]);

  useEffect(() => {
    if (selectedStallId) {
      const stall = stalls.find(s => s.id === selectedStallId);
      if (!stall) {
        setSelectedStallId(null);
      }
    }
  }, [stalls, selectedStallId]);

  const value = useMemo(() => ({
    stalls: stallsWithDistance,
    filteredStalls,
    selectedStallId,
    selectedStall,
    activeCategories,
    sortType,
    userPosition,
    addStall,
    updateStall,
    deleteStall,
    toggleStallStatus,
    setSelectedStallId,
    toggleCategory,
    setSortType,
    updateStallPosition,
    getStallById
  }), [
    stallsWithDistance,
    filteredStalls,
    selectedStallId,
    selectedStall,
    activeCategories,
    sortType,
    userPosition,
    addStall,
    updateStall,
    deleteStall,
    toggleStallStatus,
    toggleCategory,
    updateStallPosition,
    getStallById
  ]);

  return (
    <StallServiceContext.Provider value={value}>
      {children}
    </StallServiceContext.Provider>
  );
}

export function useStallService() {
  const context = useContext(StallServiceContext);
  if (!context) {
    throw new Error('useStallService must be used within a StallServiceProvider');
  }
  return context;
}
