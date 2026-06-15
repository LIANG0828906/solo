import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Diary, Location, SearchFilters } from '@/types';
import { generateMockData } from '@/utils/mockData';
import { isDateInRange } from '@/utils/dateUtils';

interface DiaryState {
  diaries: Diary[];
  locations: Location[];
  selectedLocationId: string | null;
  searchFilters: SearchFilters;
  searchResults: Diary[];
  isInitialized: boolean;
  
  initializeData: () => void;
  
  addDiary: (diary: Omit<Diary, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDiary: (id: string, updates: Partial<Diary>) => void;
  deleteDiary: (id: string) => void;
  getDiaryById: (id: string) => Diary | undefined;
  
  getDiariesByLocation: (locationId: string) => Diary[];
  getLocationById: (locationId: string) => Location | undefined;
  getFirstDiaryByLocation: (locationId: string) => Diary | undefined;
  
  searchDiaries: (filters: SearchFilters) => void;
  clearSearch: () => void;
  
  setSelectedLocationId: (id: string | null) => void;
}

const initialState = {
  diaries: [],
  locations: [],
  selectedLocationId: null,
  searchFilters: {},
  searchResults: [],
  isInitialized: false,
};

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      initializeData: () => {
        if (get().isInitialized) return;
        
        const { diaries, locations } = get();
        if (diaries.length === 0 || locations.length === 0) {
          const mockData = generateMockData();
          set({
            diaries: mockData.diaries,
            locations: mockData.locations,
            isInitialized: true,
          });
        } else {
          set({ isInitialized: true });
        }
      },
      
      addDiary: (diaryData) => {
        const now = new Date().toISOString();
        const newDiary: Diary = {
          ...diaryData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };
        
        const { diaries, locations } = get();
        const existingLocation = locations.find(
          (l) => l.id === diaryData.locationId
        );
        
        let updatedLocations = locations;
        if (existingLocation) {
          updatedLocations = locations.map((l) =>
            l.id === diaryData.locationId
              ? { ...l, diaryCount: l.diaryCount + 1 }
              : l
          );
        } else {
          const newLocation: Location = {
            id: diaryData.locationId,
            name: diaryData.locationName,
            lat: diaryData.lat,
            lng: diaryData.lng,
            diaryCount: 1,
          };
          updatedLocations = [...locations, newLocation];
        }
        
        set({
          diaries: [...diaries, newDiary],
          locations: updatedLocations,
        });
      },
      
      updateDiary: (id, updates) => {
        const { diaries } = get();
        const updatedDiaries = diaries.map((d) =>
          d.id === id
            ? { ...d, ...updates, updatedAt: new Date().toISOString() }
            : d
        );
        set({ diaries: updatedDiaries });
      },
      
      deleteDiary: (id) => {
        const { diaries, locations } = get();
        const diaryToDelete = diaries.find((d) => d.id === id);
        
        if (!diaryToDelete) return;
        
        const updatedDiaries = diaries.filter((d) => d.id !== id);
        const updatedLocations = locations.map((l) =>
          l.id === diaryToDelete.locationId
            ? { ...l, diaryCount: Math.max(0, l.diaryCount - 1) }
            : l
        ).filter((l) => l.diaryCount > 0);
        
        set({
          diaries: updatedDiaries,
          locations: updatedLocations,
        });
      },
      
      getDiaryById: (id) => {
        return get().diaries.find((d) => d.id === id);
      },
      
      getDiariesByLocation: (locationId) => {
        return get()
          .diaries.filter((d) => d.locationId === locationId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getLocationById: (locationId) => {
        return get().locations.find((l) => l.id === locationId);
      },
      
      getFirstDiaryByLocation: (locationId) => {
        return get()
          .diaries.filter((d) => d.locationId === locationId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      },
      
      searchDiaries: (filters) => {
        const { diaries } = get();
        const results = diaries.filter((diary) => {
          if (filters.startDate || filters.endDate) {
            if (!isDateInRange(diary.createdAt, filters.startDate, filters.endDate)) {
              return false;
            }
          }
          
          if (filters.mood && diary.mood !== filters.mood) {
            return false;
          }
          
          if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            const inTitle = diary.title.toLowerCase().includes(keyword);
            const inContent = diary.content.toLowerCase().includes(keyword);
            const inLocation = diary.locationName.toLowerCase().includes(keyword);
            if (!inTitle && !inContent && !inLocation) {
              return false;
            }
          }
          
          return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        set({
          searchFilters: filters,
          searchResults: results,
        });
      },
      
      clearSearch: () => {
        set({
          searchFilters: {},
          searchResults: [],
        });
      },
      
      setSelectedLocationId: (id) => {
        set({ selectedLocationId: id });
      },
    }),
    {
      name: 'travel-diary-storage',
      partialize: (state) => ({
        diaries: state.diaries,
        locations: state.locations,
      }),
    }
  )
);
