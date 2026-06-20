import { create } from 'zustand';
import type { BoneNode } from '@/data/speciesData';

export interface PointCloudPoint {
  position: [number, number, number];
}

export interface AppState {
  selectedSpecies: string;
  density: number;
  thickness: number;
  showLabels: boolean;
  pointCloudData: PointCloudPoint[] | null;
  selectedNode: BoneNode | null;
  isLoading: boolean;
  uploadedImage: string | null;
  setSelectedSpecies: (species: string) => void;
  setDensity: (density: number) => void;
  setThickness: (thickness: number) => void;
  setShowLabels: (show: boolean) => void;
  setPointCloudData: (data: PointCloudPoint[] | null) => void;
  setSelectedNode: (node: BoneNode | null) => void;
  setIsLoading: (loading: boolean) => void;
  setUploadedImage: (image: string | null) => void;
  resetModel: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedSpecies: 'bird',
  density: 5,
  thickness: 1.0,
  showLabels: false,
  pointCloudData: null,
  selectedNode: null,
  isLoading: false,
  uploadedImage: null,
  setSelectedSpecies: (species) => set({ selectedSpecies: species, selectedNode: null }),
  setDensity: (density) => set({ density }),
  setThickness: (thickness) => set({ thickness }),
  setShowLabels: (show) => set({ showLabels: show }),
  setPointCloudData: (data) => set({ pointCloudData: data }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setUploadedImage: (image) => set({ uploadedImage: image }),
  resetModel: () => set({ pointCloudData: null, uploadedImage: null, selectedNode: null }),
}));
