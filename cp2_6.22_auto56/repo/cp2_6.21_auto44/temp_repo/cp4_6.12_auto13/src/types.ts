export type OrderStatus =
  | '待确认'
  | '已确认'
  | '浸泡中'
  | '萃取中'
  | '染色中'
  | '固色中'
  | '洗净中'
  | '晾干中'
  | '质检中'
  | '已完成';

export type FabricType = '棉布' | '亚麻' | '真丝' | '混纺';

export interface DyeScheme {
  id: string;
  name: string;
  colorHex: string;
}

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNo: string;
  fabricType: FabricType;
  dyeSchemeId: string;
  widthCm: number;
  lengthCm: number;
  referenceImage?: string;
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
  estimatedCompletion: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeMaterial {
  materialId: string;
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  mainDyeId: string;
  mordant: string;
  temperature: number;
  durationHours: number;
  phValue: number;
  estimatedCost: number;
  materials?: RecipeMaterial[];
}

export interface Material {
  id: string;
  name: string;
  currentStock: number;
  thresholdStock: number;
  monthlyConsumption: number;
  unit: string;
}

export interface RestockSuggestion {
  materialId: string;
  materialName: string;
  currentStock: number;
  suggestedAmount: number;
  unit: string;
}

export const ORDER_STATUSES: OrderStatus[] = [
  '待确认',
  '已确认',
  '浸泡中',
  '萃取中',
  '染色中',
  '固色中',
  '洗净中',
  '晾干中',
  '质检中',
  '已完成',
];
