import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { Order, Settings, MaterialRecord, OrderStatus, Process } from './types';
import { PROCESS_DEFINITIONS, DEFAULT_SETTINGS } from './constants';
import { generateOrderNo } from './utils/format';

interface AppState {
  orders: Order[];
  selectedOrderId: string | null;
  settings: Settings;
  activeFilter: OrderStatus | 'all';
  addOrder: (data: { customerName: string; productName: string }) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  selectOrder: (id: string | null) => void;
  setFilter: (filter: OrderStatus | 'all') => void;
  startProcess: (orderId: string, processIndex: number) => void;
  pauseProcess: (orderId: string, processIndex: number) => void;
  completeProcess: (orderId: string, processIndex: number) => void;
  updateMaterial: (orderId: string, processId: string, updates: Partial<MaterialRecord>) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  generateMockData: () => void;
}

const getStatusFromIndex = (index: number): OrderStatus => {
  if (index >= 5) return 'done';
  const statusMap: OrderStatus[] = ['design', 'cutting', 'stitching', 'edge', 'quality'];
  return statusMap[index];
};

const createDefaultProcesses = (): Process[] => {
  return PROCESS_DEFINITIONS.map((def) => ({
    id: uuidv4(),
    name: def.name,
    status: 'pending',
    hourlyRate: def.hourlyRate,
    elapsedMs: 0,
    startTime: null,
    isRunning: false,
  }));
};

const createDefaultMaterials = (processes: Process[]): MaterialRecord[] => {
  return processes.map((process) => ({
    id: uuidv4(),
    processId: process.id,
    leatherArea: 0,
    hardwareCount: 0,
    edgeOilAmount: 0,
  }));
};

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      orders: [],
      selectedOrderId: null,
      settings: DEFAULT_SETTINGS,
      activeFilter: 'all',

      addOrder: (data: { customerName: string; productName: string }) =>
        set((state: AppState) => {
          const processes = createDefaultProcesses();
          const materials = createDefaultMaterials(processes);
          const newOrder: Order = {
            id: uuidv4(),
            orderNo: generateOrderNo(state.orders.length),
            customerName: data.customerName,
            productName: data.productName,
            status: 'design',
            createdAt: new Date().toISOString(),
            currentProcessIndex: 0,
            processes,
            materials,
          };
          state.orders.push(newOrder);
        }),

      updateOrder: (id: string, updates: Partial<Order>) =>
        set((state: AppState) => {
          const order = state.orders.find((o: Order) => o.id === id);
          if (order) {
            Object.assign(order, updates);
          }
        }),

      selectOrder: (id: string | null) =>
        set((state: AppState) => {
          state.selectedOrderId = id;
        }),

      setFilter: (filter: OrderStatus | 'all') =>
        set((state: AppState) => {
          state.activeFilter = filter;
        }),

      startProcess: (orderId: string, processIndex: number) =>
        set((state: AppState) => {
          const order = state.orders.find((o: Order) => o.id === orderId);
          if (order && order.processes[processIndex]) {
            const process = order.processes[processIndex];
            process.status = 'running';
            process.isRunning = true;
            process.startTime = performance.now();
          }
        }),

      pauseProcess: (orderId: string, processIndex: number) =>
        set((state: AppState) => {
          const order = state.orders.find((o: Order) => o.id === orderId);
          if (order && order.processes[processIndex]) {
            const process = order.processes[processIndex];
            if (process.startTime && process.isRunning) {
              process.elapsedMs += performance.now() - process.startTime;
            }
            process.status = 'paused';
            process.isRunning = false;
            process.startTime = null;
          }
        }),

      completeProcess: (orderId: string, processIndex: number) =>
        set((state: AppState) => {
          const order = state.orders.find((o: Order) => o.id === orderId);
          if (order && order.processes[processIndex]) {
            const process = order.processes[processIndex];
            if (process.startTime && process.isRunning) {
              process.elapsedMs += performance.now() - process.startTime;
            }
            process.status = 'completed';
            process.isRunning = false;
            process.startTime = null;

            const nextIndex = processIndex + 1;
            order.currentProcessIndex = nextIndex;
            order.status = getStatusFromIndex(nextIndex);

            if (nextIndex < order.processes.length) {
              order.processes[nextIndex].status = 'pending';
            }
          }
        }),

      updateMaterial: (orderId: string, processId: string, updates: Partial<MaterialRecord>) =>
        set((state: AppState) => {
          const order = state.orders.find((o: Order) => o.id === orderId);
          if (order) {
            const material = order.materials.find((m: MaterialRecord) => m.processId === processId);
            if (material) {
              Object.assign(material, updates);
            }
          }
        }),

      updateSettings: (settings: Partial<Settings>) =>
        set((state: AppState) => {
          Object.assign(state.settings, settings);
        }),

      generateMockData: () =>
        set((state: AppState) => {
          state.orders = [];
          const customerNames = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十'];
          const productNames = ['长款钱包', '短款钱包', '皮带', '手提包', '背包', '钥匙包', '卡包', '护照夹'];

          for (let i = 0; i < 240; i++) {
            const processes = createDefaultProcesses();
            const materials = createDefaultMaterials(processes);
            const currentIndex = Math.floor(Math.random() * 6);
            const status = getStatusFromIndex(currentIndex);

            for (let j = 0; j < currentIndex && j < processes.length; j++) {
              processes[j].status = 'completed';
              processes[j].elapsedMs = Math.floor(Math.random() * 7200000) + 1800000;
            }

            if (currentIndex < processes.length) {
              const currentProcess = processes[currentIndex];
              if (Math.random() > 0.3) {
                currentProcess.status = 'running';
                currentProcess.isRunning = true;
                currentProcess.startTime = performance.now() - Math.floor(Math.random() * 3600000);
              } else {
                currentProcess.status = 'paused';
                currentProcess.elapsedMs = Math.floor(Math.random() * 3600000) + 600000;
              }
            }

            materials.forEach((m: MaterialRecord) => {
              m.leatherArea = Math.floor(Math.random() * 50) + 10;
              m.hardwareCount = Math.floor(Math.random() * 10);
              m.edgeOilAmount = Math.floor(Math.random() * 20) + 5;
            });

            const order: Order = {
              id: uuidv4(),
              orderNo: generateOrderNo(i),
              customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
              productName: productNames[Math.floor(Math.random() * productNames.length)],
              status,
              createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
              currentProcessIndex: currentIndex,
              processes,
              materials,
            };

            state.orders.push(order);
          }
        }),
    })),
    {
      name: 'leather-workshop-storage',
    }
  )
);
