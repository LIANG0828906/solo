import { v4 as uuidv4 } from 'uuid';
import type {
  PickingRecord,
  ProcessingRecord,
  TastingRecord,
  Inventory,
  Order,
  GlobalStats,
  TeaVariety,
  TeaGrade,
  PickingArea,
  AromaType,
  ProcessingStatus,
  ShippingMethod,
  OrderStatus,
} from './types';

const pickingRecords = new Map<string, PickingRecord>();
const processingRecords = new Map<string, ProcessingRecord>();
const tastingRecords = new Map<string, TastingRecord>();
const inventory = new Map<string, Inventory>();
const orders = new Map<string, Order>();

const TEA_VARIETIES: TeaVariety[] = ['龙井', '碧螺春', '铁观音', '普洱', '大红袍'];
const PICKING_AREAS: PickingArea[] = ['东区', '西区', '南区', '北区'];
const AROMA_TYPES: AromaType[] = ['豆香', '栗香', '花香', '蜜香'];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function calculateGrade(totalScore: number): TeaGrade {
  if (totalScore >= 40) return '特级';
  if (totalScore >= 30) return '一级';
  if (totalScore >= 20) return '二级';
  return '次级';
}

function getInventoryKey(variety: TeaVariety, grade: TeaGrade): string {
  return `${variety}-${grade}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + hours * 60 * 60 * 1000);
  return result;
}

export async function initializeData(): Promise<void> {
  const now = new Date();
  
  const pickers = ['张三', '李四', '王五', '赵六', '陈七'];
  
  for (let i = 0; i < 10; i++) {
    const pickDate = addDays(now, -Math.floor(Math.random() * 7));
    const record: PickingRecord = {
      id: uuidv4(),
      variety: TEA_VARIETIES[i % 5],
      pickTime: pickDate.toISOString(),
      picker: pickers[i % 5],
      weight: 200 + Math.floor(Math.random() * 800),
      area: PICKING_AREAS[i % 4],
      createdAt: pickDate.toISOString(),
    };
    pickingRecords.set(record.id, record);
  }
  
  const pickingArray = Array.from(pickingRecords.values());
  
  for (let i = 0; i < 5; i++) {
    const startDate = addDays(now, -Math.floor(Math.random() * 3));
    const statuses: ProcessingStatus[] = ['待炒', '炒制中', '已完成', '已完成', '已完成'];
    const status = statuses[i];
    const record: ProcessingRecord = {
      id: uuidv4(),
      pickingId: pickingArray[i].id,
      variety: pickingArray[i].variety,
      temperature: 80 + Math.floor(Math.random() * 23) * 10,
      duration: 5 + Math.floor(Math.random() * 12) * 5,
      stirCount: status === '待炒' ? 0 : Math.floor(Math.random() * 50),
      status,
      color: status === '已完成' ? `rgb(${100 + Math.random() * 55}, ${150 + Math.random() * 60}, ${80 + Math.random() * 40})` : '',
      aroma: AROMA_TYPES[Math.floor(Math.random() * 4)],
      startTime: startDate.toISOString(),
      endTime: status === '已完成' ? addHours(startDate, 1).toISOString() : undefined,
    };
    processingRecords.set(record.id, record);
  }
  
  const processingArray = Array.from(processingRecords.values()).filter(p => p.status === '已完成');
  
  for (let i = 0; i < Math.min(3, processingArray.length); i++) {
    const scores = [
      7 + Math.floor(Math.random() * 4),
      7 + Math.floor(Math.random() * 4),
      7 + Math.floor(Math.random() * 4),
      7 + Math.floor(Math.random() * 4),
      7 + Math.floor(Math.random() * 4),
    ];
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const grade = calculateGrade(totalScore);
    const record: TastingRecord = {
      id: uuidv4(),
      processingId: processingArray[i].id,
      variety: processingArray[i].variety,
      appearance: scores[0],
      liquor: scores[1],
      aroma: scores[2],
      taste: scores[3],
      leaf: scores[4],
      totalScore,
      grade,
      comment: ['茶汤清澈，香气馥郁，回甘持久', '滋味醇厚，汤色明亮，品质优良', '口感丰富，香气高扬，值得推荐'][i],
      createdAt: addDays(now, -Math.floor(Math.random() * 2)).toISOString(),
    };
    tastingRecords.set(record.id, record);
    
    const key = getInventoryKey(record.variety, grade);
    const existing = inventory.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      inventory.set(key, { variety: record.variety, grade, quantity: 2 + Math.floor(Math.random() * 5) });
    }
  }
  
  for (const variety of TEA_VARIETIES) {
    const grades: TeaGrade[] = ['特级', '一级', '二级'];
    for (const grade of grades) {
      const key = getInventoryKey(variety, grade);
      if (!inventory.has(key)) {
        inventory.set(key, { variety, grade, quantity: 1 + Math.floor(Math.random() * 3) });
      }
    }
  }
  
  const shippingMethods: ShippingMethod[] = ['陆运', '海运', '空运'];
  for (let i = 0; i < 2; i++) {
    const orderDate = addHours(now, -i * 12);
    const order: Order = {
      id: uuidv4(),
      variety: TEA_VARIETIES[i],
      quantity: 0.5 + Math.floor(Math.random() * 5) * 0.5,
      shippingMethod: shippingMethods[i],
      status: i === 0 ? '待处理' : '已发货',
      createdAt: orderDate.toISOString(),
      deadline: addHours(orderDate, 48).toISOString(),
    };
    orders.set(order.id, order);
  }
}

export async function getPickingRecords(): Promise<PickingRecord[]> {
  await delay(30);
  return Array.from(pickingRecords.values()).sort(
    (a, b) => new Date(b.pickTime).getTime() - new Date(a.pickTime).getTime()
  );
}

export async function getRecentPickingRecords(): Promise<PickingRecord[]> {
  await delay(30);
  const sevenDaysAgo = addDays(new Date(), -7).getTime();
  return Array.from(pickingRecords.values())
    .filter(r => new Date(r.pickTime).getTime() >= sevenDaysAgo)
    .sort((a, b) => new Date(b.pickTime).getTime() - new Date(a.pickTime).getTime());
}

export async function createPickingRecord(data: Omit<PickingRecord, 'id' | 'createdAt'>): Promise<PickingRecord> {
  await delay(30);
  const record: PickingRecord = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  pickingRecords.set(record.id, record);
  return record;
}

export async function updatePickingRecord(id: string, data: Partial<PickingRecord>): Promise<PickingRecord | null> {
  await delay(30);
  const record = pickingRecords.get(id);
  if (!record) return null;
  const updated = { ...record, ...data };
  pickingRecords.set(id, updated);
  return updated;
}

export async function deletePickingRecord(id: string): Promise<boolean> {
  await delay(30);
  return pickingRecords.delete(id);
}

export async function getProcessingRecords(): Promise<ProcessingRecord[]> {
  await delay(30);
  return Array.from(processingRecords.values()).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

export async function getProcessingQueue(): Promise<ProcessingRecord[]> {
  await delay(30);
  return Array.from(processingRecords.values())
    .filter(r => r.status !== '已完成')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export async function createProcessingRecord(data: Omit<ProcessingRecord, 'id' | 'stirCount' | 'status' | 'startTime'>): Promise<ProcessingRecord> {
  await delay(30);
  const record: ProcessingRecord = {
    ...data,
    id: uuidv4(),
    stirCount: 0,
    status: '待炒',
    startTime: new Date().toISOString(),
  };
  processingRecords.set(record.id, record);
  return record;
}

export async function updateProcessingRecord(id: string, data: Partial<ProcessingRecord>): Promise<ProcessingRecord | null> {
  await delay(30);
  const record = processingRecords.get(id);
  if (!record) return null;
  const updated = { ...record, ...data };
  processingRecords.set(id, updated);
  return updated;
}

export async function incrementStirCount(id: string): Promise<ProcessingRecord | null> {
  await delay(30);
  const record = processingRecords.get(id);
  if (!record) return null;
  const updated = { ...record, stirCount: record.stirCount + 1 };
  processingRecords.set(id, updated);
  return updated;
}

export async function completeProcessing(id: string, color: string, aroma: AromaType): Promise<ProcessingRecord | null> {
  await delay(30);
  const record = processingRecords.get(id);
  if (!record) return null;
  const updated: ProcessingRecord = {
    ...record,
    status: '已完成',
    color,
    aroma,
    endTime: new Date().toISOString(),
  };
  processingRecords.set(id, updated);
  return updated;
}

export async function getTastingRecords(): Promise<TastingRecord[]> {
  await delay(30);
  return Array.from(tastingRecords.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createTastingRecord(data: Omit<TastingRecord, 'id' | 'totalScore' | 'grade' | 'createdAt'>): Promise<TastingRecord> {
  await delay(30);
  const totalScore = data.appearance + data.liquor + data.aroma + data.taste + data.leaf;
  const grade = calculateGrade(totalScore);
  const record: TastingRecord = {
    ...data,
    id: uuidv4(),
    totalScore,
    grade,
    createdAt: new Date().toISOString(),
  };
  tastingRecords.set(record.id, record);
  
  const key = getInventoryKey(record.variety, grade);
  const existing = inventory.get(key);
  const quantityKg = 0.5;
  if (existing) {
    existing.quantity += quantityKg;
  } else {
    inventory.set(key, { variety: record.variety, grade, quantity: quantityKg });
  }
  
  return record;
}

export async function updateTastingRecord(id: string, data: Partial<TastingRecord>): Promise<TastingRecord | null> {
  await delay(30);
  const record = tastingRecords.get(id);
  if (!record) return null;
  
  const updatedData = { ...record, ...data };
  if (data.appearance !== undefined || data.liquor !== undefined || 
      data.aroma !== undefined || data.taste !== undefined || data.leaf !== undefined) {
    updatedData.totalScore = updatedData.appearance + updatedData.liquor + 
                             updatedData.aroma + updatedData.taste + updatedData.leaf;
    updatedData.grade = calculateGrade(updatedData.totalScore);
  }
  
  tastingRecords.set(id, updatedData);
  return updatedData;
}

export async function getOrders(): Promise<Order[]> {
  await delay(30);
  const now = new Date().getTime();
  
  for (const [id, order] of orders) {
    if (order.status === '待处理' && now > new Date(order.deadline).getTime()) {
      orders.set(id, { ...order, status: '超时' });
    }
  }
  
  return Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createOrder(data: Omit<Order, 'id' | 'status' | 'createdAt' | 'deadline'>): Promise<Order | { error: string }> {
  await delay(30);
  
  const availableInventory = Array.from(inventory.values())
    .filter(i => i.variety === data.variety && i.quantity > 0)
    .sort((a, b) => {
      const gradeOrder: Record<TeaGrade, number> = { '特级': 0, '一级': 1, '二级': 2, '次级': 3 };
      return gradeOrder[a.grade] - gradeOrder[b.grade];
    });
  
  const totalAvailable = availableInventory.reduce((sum, i) => sum + i.quantity, 0);
  
  if (totalAvailable < data.quantity) {
    return { error: `库存不足！当前${data.variety}可用库存仅${totalAvailable}斤` };
  }
  
  let remaining = data.quantity;
  for (const inv of availableInventory) {
    if (remaining <= 0) break;
    const deduct = Math.min(inv.quantity, remaining);
    inv.quantity -= deduct;
    remaining -= deduct;
  }
  
  const order: Order = {
    ...data,
    id: uuidv4(),
    status: '待处理',
    createdAt: new Date().toISOString(),
    deadline: addHours(new Date(), 48).toISOString(),
  };
  orders.set(order.id, order);
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  await delay(30);
  const order = orders.get(id);
  if (!order) return null;
  const updated = { ...order, status };
  orders.set(id, updated);
  return updated;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  await delay(30);
  
  const totalPickingWeight = Array.from(pickingRecords.values())
    .reduce((sum, r) => sum + r.weight, 0);
  
  const totalProcessingBatches = processingRecords.size;
  
  const tastingArray = Array.from(tastingRecords.values());
  const averageTastingScore = tastingArray.length > 0
    ? tastingArray.reduce((sum, r) => sum + r.totalScore, 0) / tastingArray.length
    : 0;
  
  const now = new Date().getTime();
  let pendingOrders = 0;
  for (const order of orders.values()) {
    if (order.status === '待处理') {
      if (now > new Date(order.deadline).getTime()) {
        order.status = '超时';
        orders.set(order.id, order);
      } else {
        pendingOrders++;
      }
    }
  }
  
  return {
    totalPickingWeight,
    totalProcessingBatches,
    averageTastingScore,
    pendingOrders,
  };
}

export async function getInventory(): Promise<Inventory[]> {
  await delay(30);
  return Array.from(inventory.values());
}

export async function getAvailableQuantity(variety: TeaVariety): Promise<number> {
  await delay(30);
  return Array.from(inventory.values())
    .filter(i => i.variety === variety)
    .reduce((sum, i) => sum + i.quantity, 0);
}
