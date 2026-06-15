import { create } from 'zustand';
import type { 
  ProcessStage, 
  MoldPattern, 
  InkBatch, 
  Order, 
  Materials, 
  ProcessData,
  InkGrade 
} from '../types';

const MOLD_PATTERNS: Record<MoldPattern, string> = {
  dragon: '龙纹',
  phoenix: '凤纹',
  pineCrane: '松鹤',
  fiveFu: '五福',
  longevity: '寿字',
  doubleCoin: '双钱'
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const GAMEDAY_MS = 30000;
const DRY_DAYS = 14;

interface GameState {
  materials: Materials;
  money: number;
  reputation: number;
  inventory: InkBatch[];
  orders: Order[];
  processData: ProcessData;
  currentPanel: 'workbench' | 'inventory' | 'orders';
  showSweep: boolean;
  showModal: string | null;
  
  setPanel: (panel: 'workbench' | 'inventory' | 'orders') => void;
  setTemperature: (temp: number) => void;
  addGlue: () => void;
  addWater: () => void;
  updateMixtureProgress: (progress: number) => void;
  advanceStage: (stage: ProcessStage) => void;
  addPounding: () => void;
  selectMold: (mold: MoldPattern) => void;
  startPressing: () => void;
  stopPressing: () => void;
  completeMolding: () => void;
  checkDrying: () => void;
  setGildingCoverage: (batchId: string, coverage: number) => void;
  completeGilding: (batchId: string) => void;
  fulfillOrder: (orderId: string, batchIds: string[]) => void;
  addOrder: (order: Order) => void;
  setShowModal: (modal: string | null) => void;
  triggerSweep: () => void;
  playSound: (type: 'guzheng' | 'success' | 'error') => void;
}

const initialProcessData: ProcessData = {
  currentStage: 'smoke',
  temperature: 60,
  glueAdded: false,
  mixtureProgress: 0,
  poundingCount: 0,
  hardness: 0,
  hardnessHistory: [0],
  selectedMold: null,
  pressingProgress: 0,
  isPressing: false
};

const initialOrders: Order[] = [
  {
    id: 'order1',
    pattern: 'dragon',
    requiredGrade: 'superior',
    quantity: 3,
    reward: 9,
    fulfilled: 0
  },
  {
    id: 'order2',
    pattern: 'longevity',
    requiredGrade: 'common',
    quantity: 5,
    reward: 10,
    fulfilled: 0
  },
  {
    id: 'order3',
    pattern: 'phoenix',
    requiredGrade: 'superior',
    quantity: 2,
    reward: 6,
    fulfilled: 0
  },
  {
    id: 'order4',
    pattern: 'fiveFu',
    requiredGrade: 'common',
    quantity: 4,
    reward: 8,
    fulfilled: 0
  }
];

export const useGameStore = create<GameState>((set, get) => ({
  materials: { glue: 10, pineSoot: 20, water: 15 },
  money: 50,
  reputation: 100,
  inventory: [],
  orders: initialOrders,
  processData: initialProcessData,
  currentPanel: 'workbench',
  showSweep: false,
  showModal: null,

  setPanel: (panel) => set({ currentPanel: panel }),

  setTemperature: (temp) => set((state) => ({
    processData: { ...state.processData, temperature: temp }
  })),

  addGlue: () => set((state) => {
    if (state.materials.glue <= 0 || state.processData.glueAdded) return state;
    return {
      materials: { ...state.materials, glue: state.materials.glue - 1 },
      processData: { ...state.processData, glueAdded: true }
    };
  }),

  addWater: () => set((state) => {
    if (state.materials.water <= 0) return state;
    const newHardness = Math.max(0, state.processData.hardness - 1);
    return {
      materials: { ...state.materials, water: state.materials.water - 1 },
      processData: {
        ...state.processData,
        hardness: newHardness,
        hardnessHistory: [...state.processData.hardnessHistory, newHardness]
      }
    };
  }),

  updateMixtureProgress: (progress) => set((state) => ({
    processData: { ...state.processData, mixtureProgress: progress }
  })),

  advanceStage: (stage) => set((state) => ({
    processData: { ...state.processData, currentStage: stage }
  })),

  addPounding: () => set((state) => {
    const newCount = state.processData.poundingCount + 1;
    const newHardness = Math.floor(newCount / 20);
    const hardness = Math.min(5, newHardness);
    const hardnessHistory = [...state.processData.hardnessHistory, hardness];
    
    if (hardness >= 5 && !state.showModal) {
      setTimeout(() => get().setShowModal('water'), 100);
    }
    
    return {
      processData: {
        ...state.processData,
        poundingCount: newCount,
        hardness,
        hardnessHistory
      }
    };
  }),

  selectMold: (mold) => set((state) => ({
    processData: { ...state.processData, selectedMold: mold }
  })),

  startPressing: () => set((state) => ({
    processData: { ...state.processData, isPressing: true }
  })),

  stopPressing: () => set((state) => ({
    processData: { ...state.processData, isPressing: false }
  })),

  completeMolding: () => set((state) => {
    const { selectedMold, hardness } = state.processData;
    if (!selectedMold) return state;
    
    const now = Date.now();
    const newBatch: InkBatch = {
      id: generateId(),
      pattern: selectedMold,
      hardness,
      gildingCoverage: 0,
      grade: 'common',
      createdAt: now,
      dryCompleteAt: now + (DRY_DAYS * GAMEDAY_MS),
      isDried: false,
      isGilded: false
    };
    
    return {
      inventory: [...state.inventory, newBatch],
      processData: {
        ...initialProcessData,
        currentStage: 'smoke'
      },
      materials: {
        ...state.materials,
        pineSoot: Math.max(0, state.materials.pineSoot - 1)
      }
    };
  }),

  checkDrying: () => set((state) => {
    const now = Date.now();
    const updatedInventory = state.inventory.map(batch => ({
      ...batch,
      isDried: batch.isDried || now >= batch.dryCompleteAt
    }));
    return { inventory: updatedInventory };
  }),

  setGildingCoverage: (batchId, coverage) => set((state) => ({
    inventory: state.inventory.map(batch =>
      batch.id === batchId
        ? { ...batch, gildingCoverage: Math.min(100, coverage) }
        : batch
    )
  })),

  completeGilding: (batchId) => set((state) => ({
    inventory: state.inventory.map(batch => {
      if (batch.id !== batchId) return batch;
      const grade: InkGrade = batch.gildingCoverage >= 80 ? 'superior' :
                              batch.gildingCoverage >= 50 ? 'common' : 'inferior';
      return { ...batch, isGilded: true, grade };
    })
  })),

  fulfillOrder: (orderId, batchIds) => set((state) => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return state;
    
    const batches = state.inventory.filter(b => batchIds.includes(b.id));
    const validBatches = batches.filter(b =>
      b.pattern === order.pattern &&
      b.grade === order.requiredGrade &&
      b.isGilded
    );
    
    if (validBatches.length < order.quantity) {
      const reputationLoss = Math.min(10, state.reputation);
      return {
        reputation: state.reputation - reputationLoss,
        money: Math.max(0, state.money - 5)
      };
    }
    
    const remainingInventory = state.inventory.filter(b => !batchIds.includes(b.id));
    const updatedOrders = state.orders.map(o =>
      o.id === orderId
        ? { ...o, fulfilled: o.fulfilled + order.quantity }
        : o
    );
    
    const reward = order.reward;
    const reputationGain = 5;
    
    return {
      inventory: remainingInventory,
      orders: updatedOrders,
      money: state.money + reward,
      reputation: Math.min(100, state.reputation + reputationGain)
    };
  }),

  addOrder: (order) => set((state) => {
    if (state.orders.some(o => o.id === order.id)) return state;
    return {
      orders: [...state.orders, order]
    };
  }),

  setShowModal: (modal) => set({ showModal: modal }),

  triggerSweep: () => {
    set({ showSweep: true });
    setTimeout(() => set({ showSweep: false }), 800);
  },

  playSound: (type) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'guzheng') {
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(659.25, audioContext.currentTime + 0.1);
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (type === 'success') {
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } else if (type === 'error') {
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  }
}));

export { MOLD_PATTERNS, GAMEDAY_MS, DRY_DAYS };
