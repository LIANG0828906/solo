export interface Medicine {
  id: string;
  name: string;
  traditionalName: string;
  stock: number;
  unitPrice: number;
  category: string;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  traditionalName: string;
  quantity: number;
  unitPrice: number;
}

export interface OperationLog {
  id: string;
  timestamp: number;
  type: 'prescription' | 'restock';
  medicines: { name: string; quantity: number }[];
  totalPrice: number;
}

export interface TrendData {
  date: string;
  count: number;
}
