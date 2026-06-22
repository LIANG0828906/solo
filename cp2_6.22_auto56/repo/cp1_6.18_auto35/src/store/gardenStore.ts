import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Plant, WeatherType, PlantSpecies, WeatherData, Particle, Ripple } from '../types';
import { generateWeather } from '../api/weatherApi';
import {
  calculateGrowthIncrease,
  calculateGrowthStage,
  calculateHealth,
  waterPlant,
  fertilizePlant,
  decayPlantStats
} from '../utils/plantGrowth';

const GRID_SIZE = 16;

interface GardenState {
  plants: (Plant | null)[];
  weather: WeatherData;
  selectedSeed: PlantSpecies | null;
  isDrawerOpen: boolean;
  lastUpdate: number;
  particles: Particle[];
  ripples: Ripple[];
  weatherTransition: { isActive: boolean; from: WeatherType | null; to: WeatherType };
  harvestedCount: number;
  
  setWeather: (weather: WeatherData) => void;
  triggerWeatherTransition: (from: WeatherType, to: WeatherType) => void;
  completeWeatherTransition: () => void;
  setSelectedSeed: (seed: PlantSpecies | null) => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  plantSeed: (position: number) => void;
  waterPlantAt: (position: number) => void;
  fertilizePlantAt: (position: number) => void;
  harvestPlant: (position: number) => void;
  harvestAllFlowering: () => number;
  addRipple: (plantId: string, x: number, y: number, type: 'water' | 'fertilize') => void;
  removeRipple: (id: string) => void;
  addParticles: (x: number, y: number, count: number, color: string) => void;
  removeParticle: (id: string) => void;
  tick: (deltaTime: number) => void;
}

function createInitialPlants(): (Plant | null)[] {
  return Array(GRID_SIZE).fill(null);
}

function createPlant(species: PlantSpecies, position: number): Plant {
  const now = Date.now();
  return {
    id: uuidv4(),
    species,
    stage: 'seedling',
    growth: 0,
    health: 100,
    humidity: 70,
    nutrients: 60,
    position,
    plantedAt: now,
    lastWatered: now,
    lastFertilized: now
  };
}

export const useGardenStore = create<GardenState>((set, get) => ({
  plants: createInitialPlants(),
  weather: generateWeather(),
  selectedSeed: null,
  isDrawerOpen: false,
  lastUpdate: Date.now(),
  particles: [],
  ripples: [],
  weatherTransition: { isActive: false, from: null, to: 'sunny' },
  harvestedCount: 0,

  setWeather: (weather) => set({ weather }),
  
  triggerWeatherTransition: (from, to) => set({
    weatherTransition: { isActive: true, from, to }
  }),
  
  completeWeatherTransition: () => set({
    weatherTransition: { isActive: false, from: null, to: get().weatherTransition.to }
  }),

  setSelectedSeed: (seed) => set({ selectedSeed: seed }),

  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),

  plantSeed: (position) => {
    const { selectedSeed, plants } = get();
    if (!selectedSeed || plants[position]) return;
    
    const newPlants = [...plants];
    newPlants[position] = createPlant(selectedSeed, position);
    set({ plants: newPlants, selectedSeed: null });
  },

  waterPlantAt: (position) => {
    const { plants } = get();
    const plant = plants[position];
    if (!plant) return;
    
    const newPlants = [...plants];
    newPlants[position] = waterPlant(plant);
    set({ plants: newPlants });
  },

  fertilizePlantAt: (position) => {
    const { plants } = get();
    const plant = plants[position];
    if (!plant) return;
    
    const newPlants = [...plants];
    newPlants[position] = fertilizePlant(plant);
    set({ plants: newPlants });
  },

  harvestPlant: (position) => {
    const { plants } = get();
    const plant = plants[position];
    if (!plant || plant.stage !== 'flowering') return;
    
    const newPlants = [...plants];
    newPlants[position] = null;
    set((state) => ({ 
      plants: newPlants, 
      harvestedCount: state.harvestedCount + 1 
    }));
  },

  harvestAllFlowering: () => {
    const { plants } = get();
    let harvested = 0;
    const newPlants = plants.map((plant) => {
      if (plant && plant.stage === 'flowering') {
        harvested++;
        return null;
      }
      return plant;
    });
    set((state) => ({ 
      plants: newPlants, 
      harvestedCount: state.harvestedCount + harvested 
    }));
    return harvested;
  },

  addRipple: (plantId, x, y, type) => {
    const ripple: Ripple = { id: uuidv4(), plantId, x, y, type };
    set((state) => ({ ripples: [...state.ripples, ripple] }));
    setTimeout(() => {
      get().removeRipple(ripple.id);
    }, 400);
  },

  removeRipple: (id) => {
    set((state) => ({ ripples: state.ripples.filter((r) => r.id !== id) }));
  },

  addParticles: (x, y, count, color) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: uuidv4(),
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 6,
        color,
        life: 1
      });
    }
    set((state) => ({ particles: [...state.particles, ...newParticles] }));
  },

  removeParticle: (id) => {
    set((state) => ({ particles: state.particles.filter((p) => p.id !== id) }));
  },

  tick: (deltaTime) => {
    const { plants, weather, lastUpdate } = get();
    const actualDelta = deltaTime || (Date.now() - lastUpdate);
    
    const newPlants = plants.map((plant) => {
      if (!plant) return null;
      
      let updated = decayPlantStats(plant, actualDelta);
      const growthIncrease = calculateGrowthIncrease(updated, weather.type, actualDelta);
      const newGrowth = Math.min(100, updated.growth + growthIncrease);
      const newStage = calculateGrowthStage(newGrowth);
      const newHealth = calculateHealth(updated);
      
      return {
        ...updated,
        growth: newGrowth,
        stage: newStage,
        health: newHealth
      };
    });
    
    const updatedParticles = get().particles
      .map((p) => ({
        ...p,
        x: p.x + p.dx,
        y: p.y + p.dy,
        dy: p.dy + 0.15,
        life: p.life - 0.02
      }))
      .filter((p) => p.life > 0);
    
    set({
      plants: newPlants,
      particles: updatedParticles,
      lastUpdate: Date.now()
    });
  }
}));
