export type EquipmentCategory = '露营' | '徒步' | '攀岩' | '水上' | '冬季';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  basePrice: number;
  stock: number;
  description?: string;
  rentalRateLast7Days: number[];
}

export interface RentalItem {
  id: string;
  equipmentId: string;
  equipmentName: string;
  basePrice: number;
  dateRange: DateRange;
  days: number;
  rentalRate: number;
  dynamicCoefficient: 0.8 | 1.0 | 1.2;
  unitPrice: number;
  totalPrice: number;
}

export interface VoucherData {
  id: string;
  barcodeDigits: string;
  customerName: string;
  customerPhone: string;
  items: RentalItem[];
  startDate: string;
  endDate: string;
  totalAmount: number;
  createdAt: string;
}
