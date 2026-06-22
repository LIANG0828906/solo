import { create } from 'zustand';
import type { Artwork } from '@/types';

interface GalleryStore {
  selectedArtworkId: string | null;
  hoveredArtworkId: string | null;
  isNavigationOpen: boolean;
  isDetailPanelOpen: boolean;
  artworks: Artwork[];
  setSelectedArtwork: (id: string | null) => void;
  setHoveredArtwork: (id: string | null) => void;
  setNavigationOpen: (open: boolean) => void;
  setDetailPanelOpen: (open: boolean) => void;
  setArtworks: (artworks: Artwork[]) => void;
  updateArtworkColors: (id: string, colors: string[]) => void;
  updateArtworkSpeed: (id: string, speed: number) => void;
  resetArtwork: (id: string) => void;
}

export const useGalleryStore = create<GalleryStore>((set) => ({
  selectedArtworkId: null,
  hoveredArtworkId: null,
  isNavigationOpen: false,
  isDetailPanelOpen: false,
  artworks: [],

  setSelectedArtwork: (id) => set({ selectedArtworkId: id }),
  setHoveredArtwork: (id) => set({ hoveredArtworkId: id }),
  setNavigationOpen: (open) => set({ isNavigationOpen: open }),
  setDetailPanelOpen: (open) => set({ isDetailPanelOpen: open }),
  setArtworks: (artworks) => set({ artworks }),

  updateArtworkColors: (id, colors) =>
    set((state) => ({
      artworks: state.artworks.map((artwork) =>
        artwork.id === id ? { ...artwork, colorPalette: colors } : artwork
      ),
    })),

  updateArtworkSpeed: (id, speed) =>
    set((state) => ({
      artworks: state.artworks.map((artwork) =>
        artwork.id === id ? { ...artwork, particleSpeed: speed } : artwork
      ),
    })),

  resetArtwork: (id) =>
    set((state) => ({
      artworks: state.artworks.map((artwork) =>
        artwork.id === id
          ? {
              ...artwork,
              colorPalette: [...artwork.initialColorPalette],
              particleSpeed: artwork.initialParticleSpeed,
            }
          : artwork
      ),
    })),
}));
