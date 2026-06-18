import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  UseExhibitionStore,
  Exhibition,
  WorkMaterial,
  WallPlacement,
  VenueTemplate,
} from '@/types';
import {
  loadExhibitions,
  saveExhibitions,
  loadWorkMaterials,
  saveWorkMaterials,
  loadWallPlacements,
  saveWallPlacements,
} from '@/utils/storage';

export const useExhibitionStore = create<UseExhibitionStore>((set, get) => ({
  exhibitions: loadExhibitions(),
  currentExhibitionId: null,
  workMaterials: loadWorkMaterials(),
  wallPlacements: loadWallPlacements(),
  selectedWorkId: null,
  isTourMode: false,
  tourSpeed: 1,
  tourPaused: false,
  currentTourWorkId: null,
  draggingWorkId: null,

  createExhibition: (data) => {
    const newExhibition: Exhibition = {
      id: uuidv4(),
      name: data.name || '未命名展览',
      description: data.description || '',
      venueTemplate: (data.venueTemplate as VenueTemplate) || 'white_gallery',
      wallLayout: data.wallLayout ?? 0,
      isPublished: false,
      visitCount: 0,
      createdAt: Date.now(),
    };
    const state = get();
    const exhibitions = [...state.exhibitions, newExhibition];
    saveExhibitions(exhibitions);
    set({ exhibitions, currentExhibitionId: newExhibition.id });
    return newExhibition;
  },

  setCurrentExhibition: (id) => {
    set({ currentExhibitionId: id, selectedWorkId: null, isTourMode: false });
  },

  addWorkMaterial: (work) => {
    const state = get();
    if (!state.currentExhibitionId) {
      throw new Error('请先创建展览');
    }
    const newWork: WorkMaterial = {
      ...work,
      id: uuidv4(),
      exhibitionId: state.currentExhibitionId,
    };
    const workMaterials = [...state.workMaterials, newWork];
    saveWorkMaterials(workMaterials);
    set({ workMaterials });
    return newWork;
  },

  removeWorkMaterial: (workId) => {
    const state = get();
    const workMaterials = state.workMaterials.filter((w) => w.id !== workId);
    const wallPlacements = state.wallPlacements.filter((p) => p.workId !== workId);
    saveWorkMaterials(workMaterials);
    saveWallPlacements(wallPlacements);
    set({
      workMaterials,
      wallPlacements,
      selectedWorkId: state.selectedWorkId === workId ? null : state.selectedWorkId,
    });
  },

  addWorkToWall: (workId, wallIndex, posX, posY) => {
    const state = get();
    if (!state.currentExhibitionId) return;

    const existing = state.wallPlacements.find((p) => p.workId === workId);
    if (existing) {
      const wallPlacements = state.wallPlacements.map((p) =>
        p.workId === workId
          ? { ...p, wallIndex, positionX: posX, positionY: posY }
          : p
      );
      saveWallPlacements(wallPlacements);
      set({ wallPlacements });
      return;
    }

    const newPlacement: WallPlacement = {
      id: uuidv4(),
      exhibitionId: state.currentExhibitionId,
      workId,
      wallIndex,
      positionX: posX,
      positionY: posY,
      scale: 1,
      rotation: 0,
    };
    const wallPlacements = [...state.wallPlacements, newPlacement];
    saveWallPlacements(wallPlacements);
    set({ wallPlacements });
  },

  removeWorkFromWall: (workId) => {
    const state = get();
    const wallPlacements = state.wallPlacements.filter((p) => p.workId !== workId);
    saveWallPlacements(wallPlacements);
    set({
      wallPlacements,
      selectedWorkId: state.selectedWorkId === workId ? null : state.selectedWorkId,
    });
  },

  updateWorkPlacement: (workId, updates) => {
    const state = get();
    const wallPlacements = state.wallPlacements.map((p) =>
      p.workId === workId ? { ...p, ...updates } : p
    );
    saveWallPlacements(wallPlacements);
    set({ wallPlacements });
  },

  setSelectedWork: (workId) => {
    set({ selectedWorkId: workId });
  },

  toggleTour: () => {
    const state = get();
    set({
      isTourMode: !state.isTourMode,
      tourPaused: false,
      currentTourWorkId: null,
      selectedWorkId: null,
    });
  },

  setTourSpeed: (speed) => {
    set({ tourSpeed: speed });
  },

  toggleTourPause: () => {
    const state = get();
    set({ tourPaused: !state.tourPaused });
  },

  setCurrentTourWork: (workId) => {
    const state = get();
    if (state.currentTourWorkId !== workId) {
      set({ currentTourWorkId: workId });
    }
  },

  setDraggingWork: (workId) => {
    set({ draggingWorkId: workId });
  },

  publishExhibition: (id) => {
    const state = get();
    const exhibitions = state.exhibitions.map((e) =>
      e.id === id ? { ...e, isPublished: true } : e
    );
    saveExhibitions(exhibitions);
    set({ exhibitions });
  },

  unpublishExhibition: (id) => {
    const state = get();
    const exhibitions = state.exhibitions.map((e) =>
      e.id === id ? { ...e, isPublished: false } : e
    );
    saveExhibitions(exhibitions);
    set({ exhibitions });
  },

  incrementVisitCount: (id) => {
    const state = get();
    const exhibitions = state.exhibitions.map((e) =>
      e.id === id ? { ...e, visitCount: e.visitCount + 1 } : e
    );
    saveExhibitions(exhibitions);
    set({ exhibitions });
  },

  getShareLink: (id) => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}#view/${id}`;
  },

  getExhibitionById: (id) => {
    return get().exhibitions.find((e) => e.id === id);
  },

  getWorksByExhibition: (exhibitionId) => {
    return get().workMaterials.filter((w) => w.exhibitionId === exhibitionId);
  },

  getPlacementsByExhibition: (exhibitionId) => {
    return get().wallPlacements.filter((p) => p.exhibitionId === exhibitionId);
  },

  getWorkById: (workId) => {
    return get().workMaterials.find((w) => w.id === workId);
  },

  getPlacementByWorkId: (workId) => {
    return get().wallPlacements.find((p) => p.workId === workId);
  },
}));
