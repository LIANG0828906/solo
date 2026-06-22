import { create } from 'zustand';
import { Herb, Prescription, PrescriptionItem, Transaction, StockLog, TABOO_PAIRS } from './types';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

const initialHerbs: Herb[] = [
  {
    id: '1',
    name: '甘草',
    nature: '甘寒',
    stock: 50,
    price: 2.5,
    unit: '钱',
    origin: '内蒙古',
    contraindications: ['实证中满腹胀忌服'],
    tabooPairs: ['甘遂', '大戟', '芫花', '海藻']
  },
  {
    id: '2',
    name: '甘遂',
    nature: '苦寒',
    stock: 15,
    price: 8.0,
    unit: '钱',
    origin: '陕西',
    contraindications: ['孕妇禁用', '体弱者慎用'],
    tabooPairs: ['甘草']
  },
  {
    id: '3',
    name: '人参',
    nature: '甘寒',
    stock: 20,
    price: 50.0,
    unit: '钱',
    origin: '长白山',
    contraindications: ['实证、热证忌服'],
    tabooPairs: ['藜芦']
  },
  {
    id: '4',
    name: '黄芪',
    nature: '甘寒',
    stock: 40,
    price: 5.0,
    unit: '钱',
    origin: '山西',
    contraindications: ['气滞湿阻、食积内停忌服'],
    tabooPairs: []
  },
  {
    id: '5',
    name: '白术',
    nature: '辛温',
    stock: 35,
    price: 4.0,
    unit: '钱',
    origin: '浙江',
    contraindications: ['阴虚燥渴忌服'],
    tabooPairs: []
  },
  {
    id: '6',
    name: '茯苓',
    nature: '甘寒',
    stock: 45,
    price: 3.0,
    unit: '钱',
    origin: '安徽',
    contraindications: ['虚寒精滑忌服'],
    tabooPairs: []
  },
  {
    id: '7',
    name: '当归',
    nature: '辛温',
    stock: 30,
    price: 6.0,
    unit: '钱',
    origin: '甘肃',
    contraindications: ['湿阻中满、大便溏泄忌服'],
    tabooPairs: []
  },
  {
    id: '8',
    name: '川芎',
    nature: '辛温',
    stock: 25,
    price: 4.5,
    unit: '钱',
    origin: '四川',
    contraindications: ['阴虚火旺、月经过多忌服'],
    tabooPairs: []
  },
  {
    id: '9',
    name: '白芍',
    nature: '甘寒',
    stock: 38,
    price: 3.5,
    unit: '钱',
    origin: '浙江',
    contraindications: ['虚寒腹痛泄泻忌服'],
    tabooPairs: ['藜芦']
  },
  {
    id: '10',
    name: '熟地黄',
    nature: '甘寒',
    stock: 28,
    price: 7.0,
    unit: '钱',
    origin: '河南',
    contraindications: ['脾胃虚弱、气滞痰多忌服'],
    tabooPairs: []
  },
  {
    id: '11',
    name: '桂枝',
    nature: '辛温',
    stock: 42,
    price: 2.0,
    unit: '钱',
    origin: '广东',
    contraindications: ['热病高热、阴虚火旺忌服'],
    tabooPairs: []
  },
  {
    id: '12',
    name: '麻黄',
    nature: '辛温',
    stock: 32,
    price: 3.0,
    unit: '钱',
    origin: '内蒙古',
    contraindications: ['体虚多汗、虚喘忌服'],
    tabooPairs: []
  },
  {
    id: '13',
    name: '杏仁',
    nature: '辛温',
    stock: 36,
    price: 2.8,
    unit: '钱',
    origin: '河北',
    contraindications: ['阴虚咳嗽、大便溏泄忌服'],
    tabooPairs: ['乌头']
  },
  {
    id: '14',
    name: '石膏',
    nature: '甘寒',
    stock: 60,
    price: 1.5,
    unit: '钱',
    origin: '湖北',
    contraindications: ['脾胃虚寒、血虚发热忌服'],
    tabooPairs: []
  },
  {
    id: '15',
    name: '知母',
    nature: '苦寒',
    stock: 22,
    price: 3.2,
    unit: '钱',
    origin: '山西',
    contraindications: ['脾胃虚寒、大便溏泄忌服'],
    tabooPairs: []
  },
  {
    id: '16',
    name: '半夏',
    nature: '辛温',
    stock: 26,
    price: 4.8,
    unit: '钱',
    origin: '四川',
    contraindications: ['阴虚燥咳、孕妇忌服'],
    tabooPairs: ['乌头']
  }
];

const createEmptyPrescription = (): Prescription => ({
  id: generateId(),
  name: '',
  createdAt: new Date(),
  items: [],
  totalAmount: 0
});

interface StoreState {
  herbs: Herb[];
  currentPrescription: Prescription;
  transactions: Transaction[];
  stockLogs: StockLog[];
  selectedHerb: Herb | null;
  showConfirmModal: boolean;
}

interface StoreActions {
  addHerbToPrescription: (herbId: string, dosage: number) => void;
  removeHerbFromPrescription: (herbId: string) => void;
  updatePrescriptionItemDosage: (herbId: string, dosage: number) => void;
  clearPrescription: () => void;
  setPrescriptionName: (name: string) => void;
  checkTabooConflicts: () => { hasConflict: boolean; conflicts: string[] };
  confirmPrescription: () => boolean;
  selectHerb: (herb: Herb | null) => void;
  setShowConfirmModal: (show: boolean) => void;
  getTransactionsByDate: (date: string) => Transaction[];
  exportTransactions: (date?: string) => string;
}

const calculateTotalAmount = (items: PrescriptionItem[], herbs: Herb[]): number => {
  return items.reduce((total, item) => {
    const herb = herbs.find(h => h.id === item.herbId);
    return total + (herb ? herb.price * item.dosage : 0);
  }, 0);
};

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  herbs: initialHerbs,
  currentPrescription: createEmptyPrescription(),
  transactions: [],
  stockLogs: [],
  selectedHerb: null,
  showConfirmModal: false,

  addHerbToPrescription: (herbId: string, dosage: number) => {
    set((state) => {
      const existingItem = state.currentPrescription.items.find(item => item.herbId === herbId);
      let newItems: PrescriptionItem[];

      if (existingItem) {
        newItems = state.currentPrescription.items.map(item =>
          item.herbId === herbId
            ? { ...item, dosage: item.dosage + dosage }
            : item
        );
      } else {
        const herb = state.herbs.find(h => h.id === herbId);
        if (!herb) return state;
        newItems = [...state.currentPrescription.items, {
          herbId,
          herbName: herb.name,
          dosage,
          unitPrice: herb.price
        }];
      }

      const totalAmount = calculateTotalAmount(newItems, state.herbs);

      return {
        currentPrescription: {
          ...state.currentPrescription,
          items: newItems,
          totalAmount
        }
      };
    });
  },

  removeHerbFromPrescription: (herbId: string) => {
    set((state) => {
      const newItems = state.currentPrescription.items.filter(item => item.herbId !== herbId);
      const totalAmount = calculateTotalAmount(newItems, state.herbs);
      return {
        currentPrescription: {
          ...state.currentPrescription,
          items: newItems,
          totalAmount
        }
      };
    });
  },

  updatePrescriptionItemDosage: (herbId: string, dosage: number) => {
    set((state) => {
      const newItems = state.currentPrescription.items.map(item =>
        item.herbId === herbId
          ? { ...item, dosage: Math.max(0, dosage) }
          : item
      ).filter(item => item.dosage > 0);

      const totalAmount = calculateTotalAmount(newItems, state.herbs);

      return {
        currentPrescription: {
          ...state.currentPrescription,
          items: newItems,
          totalAmount
        }
      };
    });
  },

  clearPrescription: () => {
    set({ currentPrescription: createEmptyPrescription() });
  },

  setPrescriptionName: (name: string) => {
    set((state) => ({
      currentPrescription: {
        ...state.currentPrescription,
        name
      }
    }));
  },

  checkTabooConflicts: () => {
    const { currentPrescription, herbs } = get();
    const conflicts: string[] = [];
    const itemNames = currentPrescription.items.map(item => item.herbName);

    for (const [a, b] of TABOO_PAIRS) {
      if (itemNames.includes(a) && itemNames.includes(b)) {
        conflicts.push(`${a} 与 ${b} 为禁忌配伍，不可同用`);
      }
    }

    for (const item of currentPrescription.items) {
      const herb = herbs.find(h => h.id === item.herbId);
      if (herb) {
        for (const taboo of herb.tabooPairs) {
          if (itemNames.includes(taboo) && !conflicts.some(c => 
            (c.includes(herb.name) && c.includes(taboo)) || 
            (c.includes(taboo) && c.includes(herb.name))
          )) {
            conflicts.push(`${herb.name} 与 ${taboo} 为禁忌配伍，不可同用`);
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  },

  confirmPrescription: () => {
    const state = get();
    const { hasConflict } = state.checkTabooConflicts();

    if (hasConflict || state.currentPrescription.items.length === 0) {
      return false;
    }

    for (const item of state.currentPrescription.items) {
      const herb = state.herbs.find(h => h.id === item.herbId);
      if (!herb || herb.stock < item.dosage) {
        return false;
      }
    }

    set((state) => {
      const newHerbs = state.herbs.map(herb => {
        const item = state.currentPrescription.items.find(i => i.herbId === herb.id);
        if (item) {
          return { ...herb, stock: herb.stock - item.dosage };
        }
        return herb;
      });

      const newStockLogs: StockLog[] = state.currentPrescription.items.map(item => {
        const herb = state.herbs.find(h => h.id === item.herbId)!;
        return {
          id: generateId(),
          herbId: item.herbId,
          herbName: item.herbName,
          change: -item.dosage,
          reason: '药方核销',
          timestamp: new Date()
        };
      });

      const transaction: Transaction = {
        id: generateId(),
        timestamp: new Date(),
        prescription: { ...state.currentPrescription },
        totalAmount: state.currentPrescription.totalAmount,
        handledBy: '掌柜'
      };

      return {
        herbs: newHerbs,
        stockLogs: [...state.stockLogs, ...newStockLogs],
        transactions: [...state.transactions, transaction],
        currentPrescription: createEmptyPrescription(),
        showConfirmModal: false
      };
    });

    return true;
  },

  selectHerb: (herb: Herb | null) => {
    set({ selectedHerb: herb });
  },

  setShowConfirmModal: (show: boolean) => {
    set({ showConfirmModal: show });
  },

  getTransactionsByDate: (date: string) => {
    const { transactions } = get();
    const targetDate = new Date(date).toDateString();
    return transactions.filter(t => 
      new Date(t.timestamp).toDateString() === targetDate
    );
  },

  exportTransactions: (date?: string) => {
    const { transactions } = get();
    let data = transactions;

    if (date) {
      data = get().getTransactionsByDate(date);
    }

    const exportData = data.map(t => ({
      id: t.id,
      timestamp: t.timestamp,
      prescriptionName: t.prescription.name,
      items: t.prescription.items,
      totalAmount: t.totalAmount,
      handledBy: t.handledBy
    }));

    return JSON.stringify(exportData, null, 2);
  }
}));
