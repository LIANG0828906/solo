import { create } from 'zustand';
import type { PlantNode, SymbiosisLink, SymbiosisType } from '../data/plantData';
import {
  getAllPlants,
  getAllLinks,
  addPlant as dataAddPlant,
  addLink as dataAddLink,
  resetToInitial,
} from '../data/plantData';

export interface DragConnectionState {
  active: boolean;
  sourceId: string | null;
  targetId: string | null;
  mouseX: number;
  mouseY: number;
}

export interface LinkDialogState {
  show: boolean;
  sourceId: string | null;
  targetId: string | null;
}

export interface AppState {
  plants: PlantNode[];
  links: SymbiosisLink[];
  selectedNodeId: string | null;
  searchQuery: string;
  filterType: SymbiosisType | 'all';
  isSidePanelOpen: boolean;
  isDrawerOpen: boolean;
  showAddForm: boolean;
  dragConnection: DragConnectionState;
  linkDialog: LinkDialogState;
  simulationResetKey: number;
  fitViewKey: number;

  loadInitialData: () => void;
  setSelectedNode: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setFilterType: (t: SymbiosisType | 'all') => void;
  toggleSidePanel: () => void;
  toggleDrawer: () => void;
  toggleAddForm: () => void;
  addPlant: (data: Omit<PlantNode, 'id'>) => void;
  addLink: (sourceId: string, targetId: string, type: SymbiosisType, description: string) => void;
  startDragConnection: (sourceId: string, mouseX: number, mouseY: number) => void;
  updateDragConnection: (mouseX: number, mouseY: number, targetId: string | null) => void;
  endDragConnection: () => void;
  openLinkDialog: (sourceId: string, targetId: string) => void;
  closeLinkDialog: () => void;
  resetSimulation: () => void;
  fitView: () => void;
  resetGraph: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  plants: [],
  links: [],
  selectedNodeId: null,
  searchQuery: '',
  filterType: 'all',
  isSidePanelOpen: true,
  isDrawerOpen: false,
  showAddForm: false,
  dragConnection: {
    active: false,
    sourceId: null,
    targetId: null,
    mouseX: 0,
    mouseY: 0,
  },
  linkDialog: {
    show: false,
    sourceId: null,
    targetId: null,
  },
  simulationResetKey: 0,
  fitViewKey: 0,

  loadInitialData: () => {
    set({
      plants: getAllPlants(),
      links: getAllLinks(),
    });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  setFilterType: (t) => set({ filterType: t }),

  toggleSidePanel: () => set({ isSidePanelOpen: !get().isSidePanelOpen }),

  toggleDrawer: () => set({ isDrawerOpen: !get().isDrawerOpen }),

  toggleAddForm: () => set({ showAddForm: !get().showAddForm }),

  addPlant: (data) => {
    const newPlant = dataAddPlant(data);
    set((state) => ({
      plants: [...state.plants, newPlant],
      showAddForm: false,
      selectedNodeId: newPlant.id,
    }));
  },

  addLink: (sourceId, targetId, type, description) => {
    const existing = get().links.find(
      (l) =>
        (l.source === sourceId && l.target === targetId) ||
        (l.source === targetId && l.target === sourceId)
    );
    if (existing) {
      set({ linkDialog: { show: false, sourceId: null, targetId: null } });
      return;
    }
    const newLink = dataAddLink({ source: sourceId, target: targetId, type, description });
    set((state) => ({
      links: [...state.links, newLink],
      linkDialog: { show: false, sourceId: null, targetId: null },
      simulationResetKey: state.simulationResetKey + 1,
    }));
  },

  startDragConnection: (sourceId, mouseX, mouseY) => {
    set({
      dragConnection: {
        active: true,
        sourceId,
        targetId: null,
        mouseX,
        mouseY,
      },
    });
  },

  updateDragConnection: (mouseX, mouseY, targetId) => {
    set((state) => ({
      dragConnection: {
        ...state.dragConnection,
        mouseX,
        mouseY,
        targetId,
      },
    }));
  },

  endDragConnection: () => {
    const { dragConnection } = get();
    if (dragConnection.sourceId && dragConnection.targetId && dragConnection.sourceId !== dragConnection.targetId) {
      set({
        linkDialog: {
          show: true,
          sourceId: dragConnection.sourceId,
          targetId: dragConnection.targetId,
        },
      });
    }
    set({
      dragConnection: {
        active: false,
        sourceId: null,
        targetId: null,
        mouseX: 0,
        mouseY: 0,
      },
    });
  },

  openLinkDialog: (sourceId, targetId) => {
    set({
      linkDialog: {
        show: true,
        sourceId,
        targetId,
      },
    });
  },

  closeLinkDialog: () => {
    set({ linkDialog: { show: false, sourceId: null, targetId: null } });
  },

  resetSimulation: () => {
    set((state) => ({ simulationResetKey: state.simulationResetKey + 1 }));
  },

  fitView: () => {
    set((state) => ({ fitViewKey: state.fitViewKey + 1 }));
  },

  resetGraph: () => {
    resetToInitial();
    set({
      plants: getAllPlants(),
      links: getAllLinks(),
      selectedNodeId: null,
      simulationResetKey: get().simulationResetKey + 1,
    });
  },
}));
