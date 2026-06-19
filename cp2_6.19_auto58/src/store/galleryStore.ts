import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Artwork {
  id: string;
  imageUrl: string;
  originalUrl: string;
  description: string;
  wallIndex: number;
  slotIndex: number;
}

export type LightingMode = 'day' | 'night';

interface CameraPosition {
  x: number;
  y: number;
  z: number;
}

interface GalleryState {
  artworks: Artwork[];
  lightingMode: LightingMode;
  cameraPosition: CameraPosition;
  selectedArtwork: Artwork | null;
  findNextSlot: () => { wallIndex: number; slotIndex: number } | null;
  addArtwork: (file: File, imageUrl: string, originalUrl: string) => void;
  removeArtwork: (id: string) => void;
  setLightingMode: (mode: LightingMode) => void;
  setCameraPosition: (pos: CameraPosition) => void;
  setSelectedArtwork: (artwork: Artwork | null) => void;
  resetCamera: () => void;
}

const ROOM_WIDTH = 20;
const ROOM_DEPTH = 20;
const CAMERA_HEIGHT = 1.6;

export const ENTRY_POSITION: CameraPosition = {
  x: 0,
  y: CAMERA_HEIGHT,
  z: ROOM_DEPTH / 2 - 1,
};

const SLOTS_PER_WALL = 6;
const TOTAL_SLOTS = 4 * SLOTS_PER_WALL;

export const useGalleryStore = create<GalleryState>((set, get) => ({
  artworks: [],
  lightingMode: 'day',
  cameraPosition: ENTRY_POSITION,
  selectedArtwork: null,

  findNextSlot: () => {
    const { artworks } = get();
    const occupied = new Set(
      artworks.map((a) => `${a.wallIndex}-${a.slotIndex}`)
    );
    for (let wall = 0; wall < 4; wall++) {
      for (let slot = 0; slot < SLOTS_PER_WALL; slot++) {
        if (!occupied.has(`${wall}-${slot}`)) {
          return { wallIndex: wall, slotIndex: slot };
        }
      }
    }
    return null;
  },

  addArtwork: (file, imageUrl, originalUrl) => {
    const slot = get().findNextSlot();
    if (!slot) return;

    const artwork: Artwork = {
      id: uuidv4(),
      imageUrl,
      originalUrl,
      description: file.name,
      wallIndex: slot.wallIndex,
      slotIndex: slot.slotIndex,
    };
    set((state) => ({ artworks: [...state.artworks, artwork] }));
  },

  removeArtwork: (id) => {
    set((state) => ({
      artworks: state.artworks.filter((a) => a.id !== id),
    }));
  },

  setLightingMode: (mode) => {
    set({ lightingMode: mode });
  },

  setCameraPosition: (pos) => {
    set({ cameraPosition: pos });
  },

  setSelectedArtwork: (artwork) => {
    set({ selectedArtwork: artwork });
  },

  resetCamera: () => {
    set({ cameraPosition: ENTRY_POSITION });
  },
}));

export { SLOTS_PER_WALL, TOTAL_SLOTS, ROOM_WIDTH, ROOM_DEPTH, CAMERA_HEIGHT };
