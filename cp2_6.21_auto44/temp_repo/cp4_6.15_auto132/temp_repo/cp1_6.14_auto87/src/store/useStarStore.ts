import { create } from 'zustand';
import { StarData, StarCluster, StarStoreState } from '../types';
import { generateStarData } from '../utils/stardata';
import { getClusters, addCluster as addClusterToStorage, deleteCluster as deleteClusterFromStorage, updateCluster as updateClusterInStorage } from '../utils/clusterStore';

interface ExtendedStarStore extends StarStoreState {
  stars: StarData[];
  selectedStar: StarData | null;
  highlightedStarId: string | null;
  searchQuery: string;
  isFlying: boolean;
  clusters: StarCluster[];
  selectedClusterId: string | null;
  isClusterPanelOpen: boolean;
  cameraTarget: { x: number; y: number; z: number };
  cameraPosition: { x: number; y: number; z: number };
  setSelectedStar: (star: StarData | null) => void;
  setHighlightedStarId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  flyToStar: (star: StarData) => void;
  setIsFlying: (flying: boolean) => void;
  setCameraPosition: (pos: { x: number; y: number; z: number }) => void;
  setCameraTarget: (pos: { x: number; y: number; z: number }) => void;
  loadClusters: () => void;
  addCluster: (cluster: StarCluster) => void;
  deleteCluster: (clusterId: string) => void;
  updateCluster: (clusterId: string, updates: Partial<StarCluster>) => void;
  setSelectedClusterId: (id: string | null) => void;
  setIsClusterPanelOpen: (open: boolean) => void;
  resetView: () => void;
  clusterStarIds: string[];
  addStarToCluster: (starId: string) => void;
  removeStarFromCluster: (starId: string) => void;
  clearClusterSelection: () => void;
  isCreatingCluster: boolean;
  setIsCreatingCluster: (creating: boolean) => void;
}

const initialCameraPosition = { x: 0, y: 20, z: 150 };
const initialCameraTarget = { x: 0, y: 0, z: 0 };

export const useStarStore = create<ExtendedStarStore>((set, get) => ({
  stars: generateStarData(),
  selectedStar: null,
  highlightedStarId: null,
  searchQuery: '',
  isFlying: false,
  clusters: [],
  selectedClusterId: null,
  isClusterPanelOpen: false,
  cameraTarget: initialCameraTarget,
  cameraPosition: initialCameraPosition,
  clusterStarIds: [],
  isCreatingCluster: false,

  setSelectedStar: (star) => set({ selectedStar: star }),
  setHighlightedStarId: (id) => set({ highlightedStarId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  flyToStar: (star) => {
    set({ 
      highlightedStarId: star.id, 
      isFlying: true,
      selectedStar: star,
    });
  },
  
  setIsFlying: (flying) => set({ isFlying: flying }),
  
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
  setCameraTarget: (pos) => set({ cameraTarget: pos }),
  
  loadClusters: () => {
    const clusters = getClusters();
    set({ clusters });
  },
  
  addCluster: (cluster) => {
    const clusters = addClusterToStorage(cluster);
    set({ clusters, clusterStarIds: [], isCreatingCluster: false });
  },
  
  deleteCluster: (clusterId) => {
    const clusters = deleteClusterFromStorage(clusterId);
    const { selectedClusterId } = get();
    set({ 
      clusters, 
      selectedClusterId: selectedClusterId === clusterId ? null : selectedClusterId 
    });
  },
  
  updateCluster: (clusterId, updates) => {
    const clusters = updateClusterInStorage(clusterId, updates);
    set({ clusters });
  },
  
  setSelectedClusterId: (id) => set({ selectedClusterId: id }),
  setIsClusterPanelOpen: (open) => set({ isClusterPanelOpen: open }),
  
  resetView: () => {
    set({
      cameraPosition: initialCameraPosition,
      cameraTarget: initialCameraTarget,
      selectedStar: null,
      highlightedStarId: null,
      selectedClusterId: null,
      isFlying: true,
    });
    setTimeout(() => set({ isFlying: false }), 2000);
  },
  
  addStarToCluster: (starId) => {
    const { clusterStarIds } = get();
    if (!clusterStarIds.includes(starId)) {
      set({ clusterStarIds: [...clusterStarIds, starId] });
    }
  },
  
  removeStarFromCluster: (starId) => {
    const { clusterStarIds } = get();
    set({ clusterStarIds: clusterStarIds.filter(id => id !== starId) });
  },
  
  clearClusterSelection: () => set({ clusterStarIds: [] }),
  setIsCreatingCluster: (creating) => set({ isCreatingCluster: creating, clusterStarIds: [] }),
}));
