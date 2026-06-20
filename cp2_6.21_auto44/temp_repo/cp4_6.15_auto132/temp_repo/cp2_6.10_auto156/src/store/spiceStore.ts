import { create } from 'zustand';
import type { SpiceState, MixedSpice, Particle, PowderLayer } from '../types';
import { SPICES, getSpiceById } from '../utils/spiceData';
import { generateScentDescription, generateScentReview, generateRandomRecipe } from '../utils/scentGenerator';

const generateId = (): string => Math.random().toString(36).substring(2, 9);

export const useSpiceStore = create<SpiceState>((set, get) => ({
  spices: SPICES,
  mixture: [],
  scentDescription: null,
  scentReview: null,
  isDragging: false,
  draggedSpiceId: null,
  particles: [],
  powderLayers: [],

  addSpice: (spiceId: string, amount: number = 20) => {
    const { mixture, spices } = get();
    const spice = getSpiceById(spiceId);
    if (!spice) return;

    const existingIndex = mixture.findIndex(m => m.spiceId === spiceId);
    let newMixture: MixedSpice[];

    if (existingIndex >= 0) {
      newMixture = [...mixture];
      newMixture[existingIndex] = {
        ...newMixture[existingIndex],
        amount: Math.min(100, newMixture[existingIndex].amount + amount)
      };
    } else {
      newMixture = [...mixture, { spiceId, amount }];
    }

    const total = newMixture.reduce((sum, m) => sum + m.amount, 0);
    if (total > 100) {
      const scale = 100 / total;
      newMixture = newMixture.map(m => ({
        ...m,
        amount: Math.round(m.amount * scale)
      }));
    }

    const newDescription = generateScentDescription(newMixture, spices);
    const spiceColor = spice.color;

    set(state => ({
      mixture: newMixture,
      scentDescription: newDescription,
      scentReview: null,
      powderLayers: [
        ...state.powderLayers,
        {
          id: generateId(),
          color: spiceColor,
          amount,
          timestamp: Date.now()
        }
      ]
    }));
  },

  removeSpice: (spiceId: string) => {
    const { mixture, spices } = get();
    const newMixture = mixture.filter(m => m.spiceId !== spiceId);
    const newDescription = newMixture.length > 0
      ? generateScentDescription(newMixture, spices)
      : null;

    set({
      mixture: newMixture,
      scentDescription: newDescription,
      scentReview: null
    });
  },

  clearMixture: () => {
    set({
      mixture: [],
      scentDescription: null,
      scentReview: null,
      powderLayers: []
    });
  },

  generateScentReview: () => {
    const { mixture, spices } = get();
    if (mixture.length === 0) return;

    const review = generateScentReview(mixture, spices);
    set({ scentReview: review });
  },

  randomRecipe: () => {
    const { spices } = get();
    const recipe = generateRandomRecipe(spices);
    const description = generateScentDescription(recipe, spices);

    const layers: PowderLayer[] = recipe.map((m, index) => {
      const spice = getSpiceById(m.spiceId);
      return {
        id: generateId(),
        color: spice?.color || '#8B4513',
        amount: m.amount,
        timestamp: Date.now() + index * 100
      };
    });

    set({
      mixture: recipe,
      scentDescription: description,
      scentReview: null,
      powderLayers: layers
    });
  },

  startDrag: (spiceId: string) => {
    set({ isDragging: true, draggedSpiceId: spiceId });
  },

  endDrag: () => {
    set({ isDragging: false, draggedSpiceId: null });
  },

  addParticle: (x: number, y: number, color: string) => {
    const particles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      particles.push({
        id: generateId(),
        x,
        y,
        color,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1
      });
    }
    set(state => ({ particles: [...state.particles, ...particles] });
  },

  removeParticle: (id: string) => {
    set(state => ({
      particles: state.particles.filter(p => p.id !== id)
    }));
  },

  addPowderLayer: (color: string, amount: number) => {
    set(state => ({
      powderLayers: [
        ...state.powderLayers,
        {
          id: generateId(),
          color,
          amount,
          timestamp: Date.now()
        }
      ]
    }));
  }
}));
