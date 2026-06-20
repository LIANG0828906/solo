import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Medicine, PrescriptionItem, OperationLog, TrendData } from '../types';
import { initialMedicines, initialLogs } from '../utils/mockData';

interface MedicineStore {
  medicines: Medicine[];
  prescriptionItems: PrescriptionItem[];
  operationLogs: OperationLog[];
  isAnimating: boolean;
  completedItems: Set<string>;
  showBanner: boolean;

  addPrescriptionItem: (medicine: Medicine, quantity: number) => void;
  removePrescriptionItem: (id: string) => void;
  updatePrescriptionQuantity: (id: string, quantity: number) => void;
  clearPrescription: () => void;
  submitPrescription: () => Promise<void>;
  updateStock: (medicineId: string, amount: number) => void;
  addLog: (log: Omit<OperationLog, 'id'>) => void;
  setIsAnimating: (value: boolean) => void;
  setCompletedItem: (id: string) => void;
  clearCompletedItems: () => void;
  setShowBanner: (value: boolean) => void;
  getTotalPrice: () => number;
  getPendingPrescriptions: () => number;
  get7DayTrend: () => TrendData[];
  getLowStockMedicines: () => Medicine[];
}

export const useMedicineStore = create<MedicineStore>((set, get) => ({
  medicines: initialMedicines,
  prescriptionItems: [],
  operationLogs: initialLogs,
  isAnimating: false,
  completedItems: new Set(),
  showBanner: false,

  addPrescriptionItem: (medicine: Medicine, quantity: number) => {
    set((state) => {
      const existingItem = state.prescriptionItems.find(
        (item) => item.medicineId === medicine.id
      );
      if (existingItem) {
        return {
          prescriptionItems: state.prescriptionItems.map((item) =>
            item.medicineId === medicine.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return {
        prescriptionItems: [
          ...state.prescriptionItems,
          {
            id: uuidv4(),
            medicineId: medicine.id,
            medicineName: medicine.name,
            traditionalName: medicine.traditionalName,
            quantity,
            unitPrice: medicine.unitPrice,
          },
        ],
      };
    });
  },

  removePrescriptionItem: (id: string) => {
    set((state) => ({
      prescriptionItems: state.prescriptionItems.filter((item) => item.id !== id),
    }));
  },

  updatePrescriptionQuantity: (id: string, quantity: number) => {
    if (quantity <= 0) {
      get().removePrescriptionItem(id);
      return;
    }
    set((state) => ({
      prescriptionItems: state.prescriptionItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    }));
  },

  clearPrescription: () => {
    set({ prescriptionItems: [] });
  },

  submitPrescription: async () => {
    const { prescriptionItems, addLog, updateStock } = get();
    if (prescriptionItems.length === 0) return;

    set({ isAnimating: true, completedItems: new Set() });

    for (let i = 0; i < prescriptionItems.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const item = prescriptionItems[i];
      updateStock(item.medicineId, -item.quantity);
      set((state) => {
        const newCompleted = new Set(state.completedItems);
        newCompleted.add(item.id);
        return { completedItems: newCompleted };
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    addLog({
      timestamp: Date.now(),
      type: 'prescription',
      medicines: prescriptionItems.map((item) => ({
        name: item.medicineName,
        quantity: item.quantity,
      })),
      totalPrice: get().getTotalPrice(),
    });

    set({ showBanner: true, isAnimating: false });
    set({ prescriptionItems: [] });

    setTimeout(() => {
      set({ showBanner: false, completedItems: new Set() });
    }, 2000);
  },

  updateStock: (medicineId: string, amount: number) => {
    set((state) => ({
      medicines: state.medicines.map((med) =>
        med.id === medicineId
          ? { ...med, stock: Math.max(0, med.stock + amount) }
          : med
      ),
    }));
  },

  addLog: (log: Omit<OperationLog, 'id'>) => {
    set((state) => ({
      operationLogs: [
        { id: uuidv4(), ...log },
        ...state.operationLogs,
      ],
    }));
  },

  setIsAnimating: (value: boolean) => {
    set({ isAnimating: value });
  },

  setCompletedItem: (id: string) => {
    set((state) => {
      const newCompleted = new Set(state.completedItems);
      newCompleted.add(id);
      return { completedItems: newCompleted };
    });
  },

  clearCompletedItems: () => {
    set({ completedItems: new Set() });
  },

  setShowBanner: (value: boolean) => {
    set({ showBanner: value });
  },

  getTotalPrice: () => {
    return get().prescriptionItems.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
  },

  getPendingPrescriptions: () => {
    return get().prescriptionItems.length;
  },

  get7DayTrend: () => {
    const { operationLogs } = get();
    const trend: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const count = operationLogs.filter(
        (log) => log.timestamp >= dayStart.getTime() && log.timestamp <= dayEnd.getTime()
      ).length;

      trend.push({ date: dateStr, count });
    }

    return trend;
  },

  getLowStockMedicines: () => {
    return get().medicines.filter((med) => med.stock < 100);
  },
}));
