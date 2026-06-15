export type TeaVariety = '龙井' | '碧螺春' | '铁观音' | '普洱' | '大红袍';
export type PickingArea = '东区' | '西区' | '南区' | '北区';
export type ProcessingStatus = '待炒' | '炒制中' | '已完成';
export type AromaType = '豆香' | '栗香' | '花香' | '蜜香';
export type TeaGrade = '特级' | '一级' | '二级' | '次级';
export type OrderStatus = '待处理' | '已发货' | '已签收' | '超时';
export type ShippingMethod = '陆运' | '海运' | '空运';

export interface PickingRecord {
  id: string;
  variety: TeaVariety;
  pickTime: string;
  picker: string;
  weight: number;
  area: PickingArea;
  createdAt: string;
}

export interface ProcessingRecord {
  id: string;
  pickingId: string;
  variety: TeaVariety;
  temperature: number;
  duration: number;
  stirCount: number;
  status: ProcessingStatus;
  color: string;
  aroma: AromaType;
  startTime: string;
  endTime?: string;
}

export interface TastingRecord {
  id: string;
  processingId: string;
  variety: TeaVariety;
  appearance: number;
  liquor: number;
  aroma: number;
  taste: number;
  leaf: number;
  totalScore: number;
  grade: TeaGrade;
  comment: string;
  createdAt: string;
}

export interface Inventory {
  variety: TeaVariety;
  grade: TeaGrade;
  quantity: number;
}

export interface Order {
  id: string;
  variety: TeaVariety;
  quantity: number;
  shippingMethod: ShippingMethod;
  status: OrderStatus;
  createdAt: string;
  deadline: string;
}

export interface GlobalStats {
  totalPickingWeight: number;
  totalProcessingBatches: number;
  averageTastingScore: number;
  pendingOrders: number;
}

export type ModuleTab = 'picking' | 'processing' | 'tasting' | 'orders';
