import { create } from 'zustand';
import { 
  Calculus, ElementType, CombineResponse, RatingResponse, 
  BuildLogEntry, ParticleEffect, ELEMENT_NAMES 
} from '@/types';
import { ELEMENT_BASE_ATTRIBUTES } from '@/utils/constants';
import { combineCalculi, getRating } from '@/utils/api';

interface WorkshopState {
  availableCalculi: Calculus[];
  placedCalculi: Calculus[];
  selectedCalculus: Calculus | null;
  artifactResult: CombineResponse | null;
  ratingResult: RatingResponse | null;
  buildLogs: BuildLogEntry[];
  particleEffects: ParticleEffect[];
  buildStartTime: number;
  historyRecords: RatingResponse['record'][];
  isDragging: boolean;
  dragCalculus: Calculus | null;
  longPressCalculus: Calculus | null;
  
  initCalculi: () => void;
  startDrag: (calculus: Calculus) => void;
  endDrag: () => void;
  placeCalculus: (calculus: Calculus, gridX: number, gridZ: number) => void;
  removeCalculus: (calculusId: string) => void;
  rotateCalculus: (calculusId: string) => void;
  flipCalculus: (calculusId: string) => void;
  selectCalculus: (calculus: Calculus | null) => void;
  setLongPressCalculus: (calculus: Calculus | null) => void;
  calculateArtifact: () => Promise<void>;
  generateRating: () => Promise<void>;
  addBuildLog: (message: string, type?: BuildLogEntry['type']) => void;
  addParticleEffect: (effect: Omit<ParticleEffect, 'id' | 'createdAt'>) => void;
  removeParticleEffect: (id: string) => void;
  resetWorkshop: () => void;
  finishBuild: () => Promise<void>;
}

const generateId = () => `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createCalculus = (element: ElementType, index: number): Calculus => {
  const baseAttrs = ELEMENT_BASE_ATTRIBUTES[element];
  const variation = () => Math.floor(Math.random() * 20) - 10;
  
  return {
    id: generateId(),
    element,
    name: `${ELEMENT_NAMES[element]}筹${index + 1}`,
    rotation: 0,
    flipped: false,
    attributes: {
      hardness: Math.max(10, Math.min(100, baseAttrs.hardness + variation())),
      sharpness: Math.max(10, Math.min(100, baseAttrs.sharpness + variation())),
      resonance: Math.max(10, Math.min(100, baseAttrs.resonance + variation())),
      durability: Math.max(10, Math.min(100, baseAttrs.durability + variation())),
      flexibility: Math.max(10, Math.min(100, baseAttrs.flexibility + variation())),
    },
  };
};

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
  availableCalculi: [],
  placedCalculi: [],
  selectedCalculus: null,
  artifactResult: null,
  ratingResult: null,
  buildLogs: [],
  particleEffects: [],
  buildStartTime: Date.now(),
  historyRecords: [],
  isDragging: false,
  dragCalculus: null,
  longPressCalculus: null,

  initCalculi: () => {
    const elements: ElementType[] = ['wood', 'metal', 'fire', 'water', 'earth'];
    const calculi: Calculus[] = [];
    
    elements.forEach((element, i) => {
      for (let j = 0; j < 3; j++) {
        calculi.push(createCalculus(element, i * 3 + j));
      }
    });
    
    set({ availableCalculi: calculi, buildStartTime: Date.now() });
    get().addBuildLog('工坊已开启，开始造物吧！', 'info');
  },

  startDrag: (calculus) => set({ isDragging: true, dragCalculus: calculus }),
  
  endDrag: () => set({ isDragging: false, dragCalculus: null }),

  placeCalculus: (calculus, gridX, gridZ) => {
    const { availableCalculi, placedCalculi } = get();
    
    const isOccupied = placedCalculi.some(
      c => c.gridPosition?.gridX === gridX && c.gridPosition?.gridZ === gridZ
    );
    if (isOccupied) {
      get().addBuildLog('此位置已有算筹', 'warning');
      return;
    }

    const newAvailable = availableCalculi.filter(c => c.id !== calculus.id);
    const newPlaced = [...placedCalculi, {
      ...calculus,
      gridPosition: { gridX, gridZ },
      position: { x: gridX * 1.2 - 2.4, y: 0.5, z: gridZ * 1.2 - 2.4 },
    }];

    set({ availableCalculi: newAvailable, placedCalculi: newPlaced });
    
    get().addParticleEffect({
      type: 'place',
      position: { x: gridX * 1.2 - 2.4, y: 1, z: gridZ * 1.2 - 2.4 },
      color: '#d4a574',
    });
    
    get().addBuildLog(`放置了${calculus.name}`, 'success');
    get().calculateArtifact();
  },

  removeCalculus: (calculusId) => {
    const { availableCalculi, placedCalculi } = get();
    const calculus = placedCalculi.find(c => c.id === calculusId);
    
    if (!calculus) return;

    const { gridPosition, position, ...rest } = calculus;
    const restoredCalculus: Calculus = {
      ...rest,
      rotation: 0,
      flipped: false,
    };

    set({
      availableCalculi: [...availableCalculi, restoredCalculus],
      placedCalculi: placedCalculi.filter(c => c.id !== calculusId),
      selectedCalculus: null,
    });
    
    get().addBuildLog(`移除了${calculus.name}`, 'info');
    get().calculateArtifact();
  },

  rotateCalculus: (calculusId) => {
    set(state => ({
      placedCalculi: state.placedCalculi.map(c => 
        c.id === calculusId ? { ...c, rotation: (c.rotation + 90) % 360 } : c
      ),
    }));
  },

  flipCalculus: (calculusId) => {
    set(state => ({
      placedCalculi: state.placedCalculi.map(c => 
        c.id === calculusId ? { ...c, flipped: !c.flipped } : c
      ),
    }));
  },

  selectCalculus: (calculus) => set({ selectedCalculus: calculus }),
  
  setLongPressCalculus: (calculus) => set({ longPressCalculus: calculus }),

  calculateArtifact: async () => {
    const { placedCalculi } = get();
    
    if (placedCalculi.length === 0) {
      set({ artifactResult: null });
      return;
    }

    const gridPositions = placedCalculi.map(c => ({
      calculusId: c.id,
      gridX: c.gridPosition!.gridX,
      gridZ: c.gridPosition!.gridZ,
    }));

    const result = await combineCalculi({ calculi: placedCalculi, gridPositions });
    
    result.relations.forEach(rel => {
      const fromCalc = placedCalculi.find(c => c.element === rel.from);
      const toCalc = placedCalculi.find(c => c.element === rel.to);
      
      if (fromCalc && toCalc && fromCalc.position && toCalc.position) {
        const midPos = {
          x: (fromCalc.position.x + toCalc.position.x) / 2,
          y: 1.5,
          z: (fromCalc.position.z + toCalc.position.z) / 2,
        };
        
        get().addParticleEffect({
          type: rel.type,
          position: midPos,
          color: rel.type === 'generates' ? '#f39c12' : '#c0392b',
        });

        const relName = rel.type === 'generates' ? '生' : '克';
        get().addBuildLog(
          `${ELEMENT_NAMES[rel.from]}${relName}${ELEMENT_NAMES[rel.to]}，效果+${rel.effect}`,
          'relation'
        );
      }
    });

    set({ artifactResult: result });
  },

  generateRating: async () => {
    const { artifactResult, placedCalculi, buildStartTime } = get();
    
    if (!artifactResult) return;

    const buildTime = (Date.now() - buildStartTime) / 1000;
    const rating = await getRating({
      artifact: artifactResult,
      calculiCount: placedCalculi.length,
      buildTime,
    });

    set({ ratingResult: rating });
    get().addBuildLog(`器物「${artifactResult.artifactName}」完成！评分：${rating.totalScore}分`, 'success');
  },

  addBuildLog: (message, type = 'info') => {
    const entry: BuildLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      message,
      type,
    };
    
    set(state => ({
      buildLogs: [...state.buildLogs.slice(-49), entry],
    }));
  },

  addParticleEffect: (effect) => {
    const newEffect: ParticleEffect = {
      ...effect,
      id: `particle_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: Date.now(),
    };
    
    set(state => ({
      particleEffects: [...state.particleEffects, newEffect],
    }));

    setTimeout(() => {
      get().removeParticleEffect(newEffect.id);
    }, 2000);
  },

  removeParticleEffect: (id) => {
    set(state => ({
      particleEffects: state.particleEffects.filter(e => e.id !== id),
    }));
  },

  resetWorkshop: () => {
    const { placedCalculi, historyRecords, ratingResult } = get();
    const allCalculi = [...get().availableCalculi, ...placedCalculi.map(c => {
      const { gridPosition, position, ...rest } = c;
      return { ...rest, rotation: 0, flipped: false };
    })];

    const newRecords = ratingResult ? [...historyRecords, ratingResult.record] : historyRecords;

    set({
      availableCalculi: allCalculi,
      placedCalculi: [],
      selectedCalculus: null,
      artifactResult: null,
      ratingResult: null,
      buildLogs: [],
      particleEffects: [],
      buildStartTime: Date.now(),
      historyRecords: newRecords.slice(-10),
    });
    
    get().addBuildLog('工坊已重置', 'info');
  },

  finishBuild: async () => {
    await get().generateRating();
    const { ratingResult, artifactResult, placedCalculi } = get();
    
    if (ratingResult && artifactResult) {
      const allCalculi = [...get().availableCalculi, ...placedCalculi.map(c => {
        const { gridPosition, position, ...rest } = c;
        return { ...rest, rotation: 0, flipped: false };
      })];

      const newRecords = [...get().historyRecords, ratingResult.record].slice(-10);

      setTimeout(() => {
        set({
          availableCalculi: allCalculi,
          placedCalculi: [],
          selectedCalculus: null,
          artifactResult: null,
          ratingResult: null,
          buildLogs: [],
          particleEffects: [],
          buildStartTime: Date.now(),
          historyRecords: newRecords,
        });
        get().addBuildLog('工坊已就绪，继续造物吧！', 'info');
      }, 5000);
    }
  },
}));
