export interface Goods {
  id: string;
  name: string;
  unitPrice: number;
  stock: number;
  quarterSales: number;
  color: string;
  pattern?: string;
  unit: string;
}

export interface Transaction {
  id: string;
  goodsId: string;
  goodsName: string;
  buyerName: string;
  buyerOrigin: '波斯' | '大食' | '拜占庭' | '大唐';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  tax: number;
  currency: '铜钱' | '波斯银币' | '拜占庭金币';
  currencyAmount: number;
  timestamp: number;
  timeStr: string;
}

export interface CurrencyRate {
  name: string;
  rate: number;
  symbol: string;
}

export type TimeOfDay = {
  hour: number;
  minute: number;
  shichen: string;
  ke: number;
};
