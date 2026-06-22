import { create } from 'zustand';
import { StarMapState, StarTableItem } from './types';

export const useStarMapStore = create<StarMapState>((set) => ({
  selectedConstellation: null,
  hoveredStar: null,
  starTable: [],
  customConnections: [],
  
  setSelectedConstellation: (id: string | null) => 
    set({ selectedConstellation: id }),
  
  setHoveredStar: (id: string | null) => 
    set({ hoveredStar: id }),
  
  addStarToTable: (starId: string) => 
    set((state) => {
      if (state.starTable.length >= 6) return state;
      if (state.starTable.some(item => item.starId === starId)) return state;
      return {
        starTable: [...state.starTable, { starId, order: state.starTable.length }]
      };
    }),
  
  removeStarFromTable: (starId: string) => 
    set((state) => {
      const filtered = state.starTable
        .filter(item => item.starId !== starId)
        .map((item, index) => ({ ...item, order: index }));
      return { starTable: filtered };
    }),
  
  reorderStarTable: (items: StarTableItem[]) => 
    set({ starTable: items.map((item, index) => ({ ...item, order: index })) }),
  
  clearStarTable: () => 
    set({ starTable: [], customConnections: [] }),
  
  updateCustomConnections: (connections: [number, number][]) => 
    set({ customConnections: connections })
}));
