export interface Drink {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  maxStock: number;
  costRatio: number;
}

export interface Vessel {
  id: string;
  name: string;
  price: number;
}

export interface Shichen {
  id: string;
  name: string;
  hourRange: string;
  priceModifier: number;
}

export interface OrderRequest {
  drinkId: string;
  quantity: number;
  vesselId: string;
  shichenId: string;
  customerName: string;
  payment: {
    ivoryChips: number;
    silkBolts: number;
  };
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  bill?: {
    drinkName: string;
    unit: string;
    quantity: number;
    basePrice: number;
    vesselPrice: number;
    vesselName: string;
    shichenName: string;
    priceModifier: number;
    subtotal: number;
    totalPrice: number;
    cost: number;
    profit: number;
    payment: {
      ivoryChips: number;
      silkBolts: number;
      totalPaid: number;
    };
    change: {
      ivoryChips: number;
      silkBolts: number;
      cash: number;
      totalChange: number;
    };
  };
  record?: TransactionRecord;
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  date: string;
  type: 'drink' | 'gamble';
  customerName: string;
  drinkName?: string;
  quantity?: number;
  unit?: string;
  vesselName?: string;
  shichenName?: string;
  basePrice?: number;
  priceModifier?: number;
  totalPrice: number;
  cost: number;
  profit: number;
  paymentMethod: string;
  paymentAmount: number;
  change: number;
}

export interface GambleResult {
  winner: 'banker' | 'customer';
  amount: number;
  record: TransactionRecord;
}

export interface InventoryUpdate {
  drinkId: string;
  stock: number;
}
