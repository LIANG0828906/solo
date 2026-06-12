import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'throwing'
  | 'drying'
  | 'bisque'
  | 'glazing'
  | 'finishing'
  | 'completed';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'throwing',
  'drying',
  'bisque',
  'glazing',
  'finishing',
  'completed',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  preparing: '泥坯准备中',
  throwing: '拉坯成型',
  drying: '修坯干燥',
  bisque: '素烧',
  glazing: '釉烧',
  finishing: '打磨出窑',
  completed: '已完成',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#BDBDBD',
  confirmed: '#90A4AE',
  preparing: '#7986CB',
  throwing: '#42A5F5',
  drying: '#26C6DA',
  bisque: '#FFA726',
  glazing: '#FF7043',
  finishing: '#EC407A',
  completed: '#66BB6A',
};

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: number;
  note?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  phone: string;
  shape: string;
  diameter: number;
  height: number;
  baseDiameter: number;
  bodyType: string;
  note?: string;
  imageUrl?: string;
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
  createdAt: number;
}

export interface GlazeIngredient {
  name: string;
  percentage: number;
}

export interface Glaze {
  id: string;
  name: string;
  description: string;
  colorStart: string;
  colorEnd: string;
  ingredients: GlazeIngredient[];
  firingTemp: number;
  firingTime: number;
  notes?: string;
  createdAt: number;
}

export interface GreenwareItem {
  id: string;
  shape: string;
  quantity: number;
  size?: string;
}

export interface RawMaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
}

export interface FinishedProductItem {
  id: string;
  shape: string;
  glaze: string;
  quantity: number;
  quality: number;
  image?: string;
}

export interface TemperatureRecord {
  timestamp: number;
  temperature: number;
}

export interface KilnSlot {
  row: number;
  col: number;
  orderId?: string;
  content?: string;
}

export interface KilnBatch {
  id: string;
  name: string;
  startedAt?: number;
  finishedAt?: number;
  targetTemp: number;
  currentTemp: number;
  status: 'idle' | 'firing' | 'cooling' | 'done';
  slots: KilnSlot[];
  temperatureRecords: TemperatureRecord[];
  report?: string;
  createdAt: number;
}

export interface InventoryWarning {
  id: string;
  materialId: string;
  materialName: string;
  message: string;
  dismissed: boolean;
  dismissedAt?: number;
  createdAt: number;
}

interface AppState {
  orders: Order[];
  glazes: Glaze[];
  greenware: GreenwareItem[];
  rawMaterials: RawMaterialItem[];
  finishedProducts: FinishedProductItem[];
  kilnBatches: KilnBatch[];
  selectedOrderId: string | null;
  orderStatusFilter: OrderStatus | 'all';
  inventoryWarnings: InventoryWarning[];
  warningDismissed: boolean;
  loadAll: () => void;
  setOrders: (orders: Order[]) => void;
  setGlazes: (glazes: Glaze[]) => void;
  addOrder: (order: Omit<Order, 'id' | 'orderNo' | 'status' | 'statusHistory' | 'createdAt'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  selectOrder: (orderId: string | null) => void;
  setOrderStatusFilter: (filter: OrderStatus | 'all') => void;
  addGlaze: (glaze: Omit<Glaze, 'id' | 'createdAt'>) => void;
  updateGlaze: (id: string, glaze: Partial<Glaze>) => void;
  deleteGlaze: (id: string) => void;
  updateGreenware: (items: GreenwareItem[]) => void;
  updateRawMaterials: (items: RawMaterialItem[]) => void;
  updateFinishedProducts: (items: FinishedProductItem[]) => void;
  addKilnBatch: (batch: Omit<KilnBatch, 'id' | 'createdAt' | 'slots' | 'temperatureRecords' | 'status' | 'currentTemp'>) => void;
  updateKilnBatch: (id: string, batch: Partial<KilnBatch>) => void;
  addTemperatureRecord: (batchId: string, temp: number) => void;
  dismissWarning: (warningId: string) => void;
  dismissWarningBanner: () => void;
}

const generateOrderNo = () => {
  const date = new Date();
  const prefix = `PO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
};

const createMockOrders = (): Order[] => {
  const now = Date.now();
  return [
    {
      id: uuidv4(),
      orderNo: generateOrderNo(),
      customerName: '张三',
      phone: '13800138001',
      shape: '茶壶',
      diameter: 12,
      height: 10,
      baseDiameter: 6,
      bodyType: '紫砂泥',
      note: '希望壶嘴出水顺畅',
      status: 'throwing',
      statusHistory: [
        { status: 'pending', timestamp: now - 86400000 * 3 },
        { status: 'confirmed', timestamp: now - 86400000 * 2.5 },
        { status: 'preparing', timestamp: now - 86400000 * 2 },
        { status: 'throwing', timestamp: now - 86400000 },
      ],
      createdAt: now - 86400000 * 3,
    },
    {
      id: uuidv4(),
      orderNo: generateOrderNo(),
      customerName: '李四',
      phone: '13800138002',
      shape: '茶碗',
      diameter: 9,
      height: 5,
      baseDiameter: 4,
      bodyType: '高岭土',
      note: '',
      status: 'bisque',
      statusHistory: [
        { status: 'pending', timestamp: now - 86400000 * 5 },
        { status: 'confirmed', timestamp: now - 86400000 * 4.5 },
        { status: 'preparing', timestamp: now - 86400000 * 4 },
        { status: 'throwing', timestamp: now - 86400000 * 3 },
        { status: 'drying', timestamp: now - 86400000 * 2 },
        { status: 'bisque', timestamp: now - 86400000 },
      ],
      createdAt: now - 86400000 * 5,
    },
    {
      id: uuidv4(),
      orderNo: generateOrderNo(),
      customerName: '王五',
      phone: '13800138003',
      shape: '花瓶',
      diameter: 15,
      height: 25,
      baseDiameter: 8,
      bodyType: '陶土',
      note: '用于客厅装饰',
      status: 'pending',
      statusHistory: [
        { status: 'pending', timestamp: now - 3600000 },
      ],
      createdAt: now - 3600000,
    },
    {
      id: uuidv4(),
      orderNo: generateOrderNo(),
      customerName: '赵六',
      phone: '13800138004',
      shape: '茶杯',
      diameter: 7,
      height: 6,
      baseDiameter: 3,
      bodyType: '青瓷泥',
      note: '',
      status: 'completed',
      statusHistory: [
        { status: 'pending', timestamp: now - 86400000 * 10 },
        { status: 'confirmed', timestamp: now - 86400000 * 9.5 },
        { status: 'preparing', timestamp: now - 86400000 * 9 },
        { status: 'throwing', timestamp: now - 86400000 * 8 },
        { status: 'drying', timestamp: now - 86400000 * 7 },
        { status: 'bisque', timestamp: now - 86400000 * 6 },
        { status: 'glazing', timestamp: now - 86400000 * 4 },
        { status: 'finishing', timestamp: now - 86400000 * 2 },
        { status: 'completed', timestamp: now - 86400000 },
      ],
      createdAt: now - 86400000 * 10,
    },
  ];
};

const createMockGlazes = (): Glaze[] => {
  const now = Date.now();
  return [
    {
      id: uuidv4(),
      name: '粉青瓷',
      description: '温润淡雅的粉青色，适合茶具',
      colorStart: '#B2DFDB',
      colorEnd: '#80CBC4',
      ingredients: [
        { name: '长石', percentage: 40 },
        { name: '石英', percentage: 25 },
        { name: '高岭土', percentage: 20 },
        { name: '氧化铁', percentage: 2 },
        { name: '氧化镁', percentage: 13 },
      ],
      firingTemp: 1280,
      firingTime: 12,
      createdAt: now - 86400000 * 30,
    },
    {
      id: uuidv4(),
      name: '天目釉',
      description: '深邃的黑褐色，带兔毫纹理',
      colorStart: '#4E342E',
      colorEnd: '#3E2723',
      ingredients: [
        { name: '长石', percentage: 35 },
        { name: '氧化铁', percentage: 15 },
        { name: '锰矿', percentage: 5 },
        { name: '草木灰', percentage: 25 },
        { name: '高岭土', percentage: 20 },
      ],
      firingTemp: 1300,
      firingTime: 14,
      createdAt: now - 86400000 * 20,
    },
    {
      id: uuidv4(),
      name: '吴须釉',
      description: '沉稳的灰蓝色调',
      colorStart: '#B0BEC5',
      colorEnd: '#78909C',
      ingredients: [
        { name: '长石', percentage: 45 },
        { name: '石英', percentage: 20 },
        { name: '钴料', percentage: 2 },
        { name: '高岭土', percentage: 18 },
        { name: '白云石', percentage: 15 },
      ],
      firingTemp: 1260,
      firingTime: 10,
      createdAt: now - 86400000 * 15,
    },
    {
      id: uuidv4(),
      name: '酱黄釉',
      description: '古朴的酱黄色，适合仿古器皿',
      colorStart: '#FFB74D',
      colorEnd: '#F57C00',
      ingredients: [
        { name: '长石', percentage: 30 },
        { name: '氧化铁', percentage: 10 },
        { name: '草木灰', percentage: 30 },
        { name: '高岭土', percentage: 20 },
        { name: '方解石', percentage: 10 },
      ],
      firingTemp: 1250,
      firingTime: 11,
      createdAt: now - 86400000 * 10,
    },
  ];
};

const createMockGreenware = (): GreenwareItem[] => [
  { id: uuidv4(), shape: '茶壶', quantity: 8, size: '中号' },
  { id: uuidv4(), shape: '茶碗', quantity: 15, size: '标准' },
  { id: uuidv4(), shape: '花瓶', quantity: 3, size: '大号' },
  { id: uuidv4(), shape: '茶杯', quantity: 20, size: '小号' },
];

const createMockRawMaterials = (): RawMaterialItem[] => [
  { id: uuidv4(), name: '高岭土', quantity: 5, unit: 'kg', threshold: 10 },
  { id: uuidv4(), name: '长石', quantity: 25, unit: 'kg', threshold: 15 },
  { id: uuidv4(), name: '石英', quantity: 18, unit: 'kg', threshold: 10 },
  { id: uuidv4(), name: '氧化铁', quantity: 2, unit: 'kg', threshold: 3 },
  { id: uuidv4(), name: '紫砂泥', quantity: 50, unit: 'kg', threshold: 20 },
  { id: uuidv4(), name: '草木灰', quantity: 3, unit: 'kg', threshold: 5 },
];

const createMockFinishedProducts = (): FinishedProductItem[] => [
  { id: uuidv4(), shape: '茶壶', glaze: '粉青瓷', quantity: 5, quality: 5 },
  { id: uuidv4(), shape: '茶碗', glaze: '天目釉', quantity: 12, quality: 4 },
  { id: uuidv4(), shape: '茶杯', glaze: '吴须釉', quantity: 18, quality: 5 },
  { id: uuidv4(), shape: '花瓶', glaze: '酱黄釉', quantity: 2, quality: 3 },
];

const createMockKilnBatches = (): KilnBatch[] => {
  const now = Date.now();
  const slots: KilnSlot[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      slots.push({ row: r, col: c });
    }
  }
  slots[0].orderId = 'demo1';
  slots[0].content = '茶壶';
  slots[2].orderId = 'demo2';
  slots[2].content = '茶碗';
  slots[7].orderId = 'demo3';
  slots[7].content = '花瓶';

  return [
    {
      id: uuidv4(),
      name: '2024年第3窑',
      startedAt: now - 86400000 * 2,
      finishedAt: now - 86400000,
      targetTemp: 1280,
      currentTemp: 25,
      status: 'done',
      slots,
      temperatureRecords: [
        { timestamp: now - 86400000 * 2, temperature: 25 },
        { timestamp: now - 86400000 * 2 + 3600000, temperature: 200 },
        { timestamp: now - 86400000 * 2 + 7200000, temperature: 500 },
        { timestamp: now - 86400000 * 2 + 10800000, temperature: 800 },
        { timestamp: now - 86400000 * 2 + 14400000, temperature: 1000 },
        { timestamp: now - 86400000 * 2 + 21600000, temperature: 1280 },
        { timestamp: now - 86400000 * 2 + 28800000, temperature: 1280 },
        { timestamp: now - 86400000 * 1.5, temperature: 800 },
        { timestamp: now - 86400000 * 1.2, temperature: 400 },
        { timestamp: now - 86400000, temperature: 50 },
      ],
      report: '本窑整体发色良好，粉青瓷釉面温润，天目釉兔毫纹理清晰，成品率约92%。',
      createdAt: now - 86400000 * 3,
    },
  ];
};

export const useAppStore = create<AppState>((set, get) => ({
  orders: [],
  glazes: [],
  greenware: [],
  rawMaterials: [],
  finishedProducts: [],
  kilnBatches: [],
  selectedOrderId: null,
  orderStatusFilter: 'all',
  inventoryWarnings: [],
  warningDismissed: false,

  loadAll: () => {
    const warnings: InventoryWarning[] = [];
    const rawMaterials = createMockRawMaterials();
    rawMaterials.forEach((m) => {
      if (m.quantity < m.threshold) {
        warnings.push({
          id: uuidv4(),
          materialId: m.id,
          materialName: m.name,
          message: `${m.name}库存不足，当前 ${m.quantity}${m.unit}，阈值 ${m.threshold}${m.unit}`,
          dismissed: false,
          createdAt: Date.now(),
        });
      }
    });

    set({
      orders: createMockOrders(),
      glazes: createMockGlazes(),
      greenware: createMockGreenware(),
      rawMaterials,
      finishedProducts: createMockFinishedProducts(),
      kilnBatches: createMockKilnBatches(),
      inventoryWarnings: warnings,
    });
  },

  setOrders: (orders) => set({ orders }),
  setGlazes: (glazes) => set({ glazes }),

  addOrder: (orderData) => {
    const newOrder: Order = {
      ...orderData,
      id: uuidv4(),
      orderNo: generateOrderNo(),
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: Date.now() }],
      createdAt: Date.now(),
    };
    set((state) => ({ orders: [newOrder, ...state.orders] }));
    return newOrder;
  },

  updateOrderStatus: (orderId, status, note) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              statusHistory: [
                ...order.statusHistory,
                { status, timestamp: Date.now(), note },
              ],
            }
          : order
      ),
    }));
  },

  selectOrder: (orderId) => set({ selectedOrderId: orderId }),
  setOrderStatusFilter: (filter) => set({ orderStatusFilter: filter }),

  addGlaze: (glazeData) => {
    const newGlaze: Glaze = {
      ...glazeData,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    set((state) => ({ glazes: [...state.glazes, newGlaze] }));
  },

  updateGlaze: (id, glaze) => {
    set((state) => ({
      glazes: state.glazes.map((g) => (g.id === id ? { ...g, ...glaze } : g)),
    }));
  },

  deleteGlaze: (id) => {
    set((state) => ({
      glazes: state.glazes.filter((g) => g.id !== id),
    }));
  },

  updateGreenware: (items) => set({ greenware: items }),
  updateRawMaterials: (items) => {
    const warnings: InventoryWarning[] = [];
    items.forEach((m) => {
      if (m.quantity < m.threshold) {
        warnings.push({
          id: uuidv4(),
          materialId: m.id,
          materialName: m.name,
          message: `${m.name}库存不足，当前 ${m.quantity}${m.unit}，阈值 ${m.threshold}${m.unit}`,
          dismissed: false,
          createdAt: Date.now(),
        });
      }
    });
    set({ rawMaterials: items, inventoryWarnings: warnings });
  },
  updateFinishedProducts: (items) => set({ finishedProducts: items }),

  addKilnBatch: (batchData) => {
    const slots: KilnSlot[] = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        slots.push({ row: r, col: c });
      }
    }
    const newBatch: KilnBatch = {
      ...batchData,
      id: uuidv4(),
      currentTemp: 25,
      status: 'idle',
      slots,
      temperatureRecords: [],
      createdAt: Date.now(),
    };
    set((state) => ({ kilnBatches: [newBatch, ...state.kilnBatches] }));
  },

  updateKilnBatch: (id, batch) => {
    set((state) => ({
      kilnBatches: state.kilnBatches.map((b) => (b.id === id ? { ...b, ...batch } : b)),
    }));
  },

  addTemperatureRecord: (batchId, temp) => {
    set((state) => ({
      kilnBatches: state.kilnBatches.map((b) =>
        b.id === batchId
          ? {
              ...b,
              currentTemp: temp,
              temperatureRecords: [
                ...b.temperatureRecords,
                { timestamp: Date.now(), temperature: temp },
              ],
            }
          : b
      ),
    }));
  },

  dismissWarning: (warningId) => {
    set((state) => ({
      inventoryWarnings: state.inventoryWarnings.map((w) =>
        w.id === warningId ? { ...w, dismissed: true, dismissedAt: Date.now() } : w
      ),
    }));
  },

  dismissWarningBanner: () => set({ warningDismissed: true }),
}));
