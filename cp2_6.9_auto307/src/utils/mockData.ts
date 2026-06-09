import type { Medicine, OperationLog } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const initialMedicines: Medicine[] = [
  { id: '1', name: '黄芪', traditionalName: '黃芪', stock: 500, unitPrice: 0.5, category: '补气' },
  { id: '2', name: '当归', traditionalName: '當歸', stock: 300, unitPrice: 0.8, category: '补血' },
  { id: '3', name: '人参', traditionalName: '人蔘', stock: 100, unitPrice: 5.0, category: '补气' },
  { id: '4', name: '白术', traditionalName: '白朮', stock: 250, unitPrice: 0.6, category: '健脾' },
  { id: '5', name: '茯苓', traditionalName: '茯苓', stock: 400, unitPrice: 0.4, category: '利水' },
  { id: '6', name: '川芎', traditionalName: '川芎', stock: 200, unitPrice: 0.7, category: '活血' },
  { id: '7', name: '甘草', traditionalName: '甘草', stock: 350, unitPrice: 0.3, category: '调和' },
  { id: '8', name: '熟地', traditionalName: '熟地', stock: 180, unitPrice: 0.9, category: '补血' },
  { id: '9', name: '白芍', traditionalName: '白芍', stock: 220, unitPrice: 0.45, category: '补血' },
  { id: '10', name: '桂枝', traditionalName: '桂枝', stock: 280, unitPrice: 0.35, category: '解表' },
  { id: '11', name: '柴胡', traditionalName: '柴胡', stock: 150, unitPrice: 0.55, category: '清热' },
  { id: '12', name: '陈皮', traditionalName: '陳皮', stock: 320, unitPrice: 0.25, category: '理气' },
];

const generateMockLogs = (): OperationLog[] => {
  const logs: OperationLog[] = [];
  const medicineNames = ['黄芪', '当归', '人参', '白术', '茯苓', '川芎', '甘草', '熟地'];
  const now = Date.now();
  
  for (let i = 0; i < 15; i++) {
    const medicineCount = Math.floor(Math.random() * 4) + 2;
    const medicines: { name: string; quantity: number }[] = [];
    let totalPrice = 0;
    
    for (let j = 0; j < medicineCount; j++) {
      const name = medicineNames[Math.floor(Math.random() * medicineNames.length)];
      const quantity = Math.floor(Math.random() * 30) + 10;
      if (!medicines.find(m => m.name === name)) {
        medicines.push({ name, quantity });
        totalPrice += quantity * (Math.random() * 5 + 0.3);
      }
    }
    
    logs.push({
      id: uuidv4(),
      timestamp: now - i * 3600000 * (Math.random() * 5 + 1),
      type: 'prescription',
      medicines,
      totalPrice: Math.round(totalPrice * 100) / 100,
    });
  }
  
  return logs.sort((a, b) => b.timestamp - a.timestamp);
};

export const initialLogs: OperationLog[] = generateMockLogs();
