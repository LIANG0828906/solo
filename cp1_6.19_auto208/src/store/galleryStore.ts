import { create } from 'zustand';
import type { Poster, DerivedVersion, BehaviorParams, PosterTemplate } from '@/types';
import { createMockPosters } from '@/utils/mockData';
import { generateLongId } from '@/utils/uuid';

interface GalleryState {
  posters: Poster[];
  selectedPosterId: string | null;
  isUploadModalOpen: boolean;

  setSelectedPoster: (id: string | null) => void;
  addPoster: (data: {
    name: string;
    author: string;
    previewImage: string;
    template: PosterTemplate;
  }) => void;
  addDerivedVersion: (posterId: string, version: DerivedVersion) => void;
  setUploadModalOpen: (open: boolean) => void;
  getSelectedPoster: () => Poster | undefined;
  applyBehaviorSnapshot: (posterId: string, snapshot: BehaviorParams) => void;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  posters: createMockPosters(),
  selectedPosterId: null,
  isUploadModalOpen: false,
  _pendingSnapshot: null,

  setSelectedPoster: (id) => set({ selectedPosterId: id }),

  addPoster: (data) =>
    set((state) => ({
      posters: [
        {
          id: generateLongId(),
          name: data.name,
          author: data.author,
          createdAt: new Date().toISOString(),
          previewImage: data.previewImage,
          template: data.template,
          derivedVersions: [],
        },
        ...state.posters,
      ],
    })),

  addDerivedVersion: (posterId, version) =>
    set((state) => ({
      posters: state.posters.map((p) =>
        p.id === posterId
          ? {
              ...p,
              derivedVersions: [version, ...p.derivedVersions].slice(0, 20),
            }
          : p
      ),
    })),

  setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),

  getSelectedPoster: () => {
    const state = get();
    return state.posters.find((p) => p.id === state.selectedPosterId);
  },

  applyBehaviorSnapshot: () => {
  },
}));
