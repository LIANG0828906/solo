export interface Herb {
  id: string;
  name: string;
  nature: '辛温' | '甘寒' | '苦寒';
  stock: number;
  price: number;
  unit: string;
  origin: string;
  contraindications: string[];
  tabooPairs: string[];
}

export interface PrescriptionItem {
  herbId: string;
  herbName: string;
  dosage: number;
  unitPrice: number;
}

export interface Prescription {
  id: string;
  name: string;
  createdAt: Date;
  items: PrescriptionItem[];
  totalAmount: number;
}

export interface Transaction {
  id: string;
  timestamp: Date;
  prescription: Prescription;
  totalAmount: number;
  handledBy: string;
}

export interface StockLog {
  id: string;
  herbId: string;
  herbName: string;
  change: number;
  reason: string;
  timestamp: Date;
}

export const TABOO_PAIRS: [string, string][] = [
  ['甘草', '甘遂'],
  ['甘草', '大戟'],
  ['甘草', '芫花'],
  ['甘草', '海藻'],
  ['乌头', '半夏'],
  ['乌头', '瓜蒌'],
  ['乌头', '贝母'],
  ['乌头', '白蔹'],
  ['乌头', '白及'],
  ['藜芦', '人参'],
  ['藜芦', '丹参'],
  ['藜芦', '玄参'],
  ['藜芦', '沙参'],
  ['藜芦', '细辛'],
  ['藜芦', '芍药'],
];
