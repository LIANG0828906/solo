import { create } from 'zustand';
import { Artwork, PlacementWithArtwork } from './types';

interface GalleryStore {
  artworks: Artwork[];
  placements: PlacementWithArtwork[];
  selectedArtwork: Artwork | null;
  selectedPlacementId: string | null;
  detailArtwork: Artwork | null;
  isDetailVisible: boolean;

  setArtworks: (artworks: Artwork[]) => void;
  setPlacements: (placements: PlacementWithArtwork[]) => void;
  setSelectedArtwork: (artwork: Artwork | null) => void;
  setSelectedPlacementId: (id: string | null) => void;
  setDetailArtwork: (artwork: Artwork | null) => void;
  setIsDetailVisible: (visible: boolean) => void;
  addArtwork: (artwork: Artwork) => void;
  updatePlacement: (id: string, updates: Partial<PlacementWithArtwork>) => void;
  addPlacement: (placement: PlacementWithArtwork) => void;
  removePlacement: (id: string) => void;
}

export const useGalleryStore = create<GalleryStore>((set) => ({
  artworks: [],
  placements: [],
  selectedArtwork: null,
  selectedPlacementId: null,
  detailArtwork: null,
  isDetailVisible: false,

  setArtworks: (artworks) => set({ artworks }),
  setPlacements: (placements) => set({ placements }),
  setSelectedArtwork: (selectedArtwork) => set({ selectedArtwork }),
  setSelectedPlacementId: (selectedPlacementId) => set({ selectedPlacementId }),
  setDetailArtwork: (detailArtwork) => set({ detailArtwork }),
  setIsDetailVisible: (isDetailVisible) => set({ isDetailVisible }),
  addArtwork: (artwork) => set((state) => ({ artworks: [artwork, ...state.artworks] })),
  updatePlacement: (id, updates) => set((state) => ({
    placements: state.placements.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),
  addPlacement: (placement) => set((state) => ({ placements: [...state.placements, placement] })),
  removePlacement: (id) => set((state) => ({
    placements: state.placements.filter((p) => p.id !== id),
  })),
}));
