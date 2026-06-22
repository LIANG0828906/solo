import { create } from 'zustand';
import axios from 'axios';

export interface Flower {
  id: string;
  name: string;
  price: number;
  stock: number;
  color: string;
  imageUrl: string;
}

export interface WorkbenchFlower {
  id: string;
  flowerId: string;
  name: string;
  color: string;
  price: number;
  quantity: number;
  position: { x: number; y: number };
}

export interface Scheme {
  id: string;
  name: string;
  flowers: WorkbenchFlower[];
  packagingStyle: string;
  packagingFeeRatio: number;
  totalPrice: number;
  createdAt?: string;
}

interface FlowerStore {
  flowers: Flower[];
  selectedFlowers: WorkbenchFlower[];
  packagingStyle: string;
  packagingFeeRatio: number;
  savedSchemes: Scheme[];
  isModalOpen: boolean;
  selectedFlower: Flower | null;
  previewUrl: string | null;
  
  fetchFlowers: () => Promise<void>;
  addFlower: (flower: Flower, quantity: number) => void;
  removeFlower: (id: string) => void;
  updateFlowerPosition: (id: string, x: number, y: number) => void;
  setPackagingStyle: (style: string) => void;
  setPackagingFeeRatio: (ratio: number) => void;
  saveScheme: (name: string) => Promise<void>;
  deleteScheme: (id: string) => Promise<void>;
  fetchSchemes: () => Promise<void>;
  openModal: (flower: Flower) => void;
  closeModal: () => void;
  setPreviewUrl: (url: string | null) => void;
  calculateTotal: () => number;
  calculatePackagingFee: () => number;
  getFlowerCount: () => number;
  getFlowerTypeCount: () => number;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useFlowerStore = create<FlowerStore>((set, get) => ({
  flowers: [],
  selectedFlowers: [],
  packagingStyle: 'kraft',
  packagingFeeRatio: 0.15,
  savedSchemes: [],
  isModalOpen: false,
  selectedFlower: null,
  previewUrl: null,

  fetchFlowers: async () => {
    try {
      const response = await axios.get('/api/flowers');
      set({ flowers: response.data });
    } catch (error) {
      console.error('Failed to fetch flowers:', error);
    }
  },

  addFlower: (flower: Flower, quantity: number) => {
    const state = get();
    if (state.selectedFlowers.length >= 30) return;
    
    const positions = [
      { x: 350, y: 250 },
      { x: 280, y: 200 },
      { x: 420, y: 200 },
      { x: 250, y: 280 },
      { x: 450, y: 280 },
      { x: 350, y: 180 },
      { x: 350, y: 320 },
    ];
    
    const posIndex = state.selectedFlowers.length % positions.length;
    const offset = Math.floor(state.selectedFlowers.length / positions.length) * 30;
    
    const newFlower: WorkbenchFlower = {
      id: generateId(),
      flowerId: flower.id,
      name: flower.name,
      color: flower.color,
      price: flower.price,
      quantity: quantity,
      position: {
        x: positions[posIndex].x + offset,
        y: positions[posIndex].y + offset,
      },
    };
    
    set({ selectedFlowers: [...state.selectedFlowers, newFlower] });
  },

  removeFlower: (id: string) => {
    set((state) => ({
      selectedFlowers: state.selectedFlowers.filter((f) => f.id !== id),
    }));
  },

  updateFlowerPosition: (id: string, x: number, y: number) => {
    set((state) => ({
      selectedFlowers: state.selectedFlowers.map((f) =>
        f.id === id ? { ...f, position: { x, y } } : f
      ),
    }));
  },

  setPackagingStyle: (style: string) => {
    set({ packagingStyle: style });
  },

  setPackagingFeeRatio: (ratio: number) => {
    set({ packagingFeeRatio: ratio });
  },

  saveScheme: async (name: string) => {
    const state = get();
    const totalPrice = state.calculateTotal() + state.calculatePackagingFee();
    
    const scheme = {
      name,
      flowers: state.selectedFlowers,
      packagingStyle: state.packagingStyle,
      packagingFeeRatio: state.packagingFeeRatio,
      totalPrice,
    };
    
    try {
      const response = await axios.post('/api/schemes', scheme);
      set((state) => ({
        savedSchemes: [...state.savedSchemes, response.data],
      }));
    } catch (error) {
      console.error('Failed to save scheme:', error);
    }
  },

  deleteScheme: async (id: string) => {
    try {
      await axios.delete(`/api/schemes/${id}`);
      set((state) => ({
        savedSchemes: state.savedSchemes.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete scheme:', error);
    }
  },

  fetchSchemes: async () => {
    try {
      const response = await axios.get('/api/schemes');
      set({ savedSchemes: response.data });
    } catch (error) {
      console.error('Failed to fetch schemes:', error);
    }
  },

  openModal: (flower: Flower) => {
    set({ isModalOpen: true, selectedFlower: flower });
  },

  closeModal: () => {
    set({ isModalOpen: false, selectedFlower: null });
  },

  setPreviewUrl: (url: string | null) => {
    set({ previewUrl: url });
  },

  calculateTotal: () => {
    const state = get();
    return state.selectedFlowers.reduce(
      (sum, flower) => sum + flower.price * flower.quantity,
      0
    );
  },

  calculatePackagingFee: () => {
    const state = get();
    return state.calculateTotal() * state.packagingFeeRatio;
  },

  getFlowerCount: () => {
    const state = get();
    return state.selectedFlowers.reduce((sum, f) => sum + f.quantity, 0);
  },

  getFlowerTypeCount: () => {
    const state = get();
    return state.selectedFlowers.length;
  },
}));
