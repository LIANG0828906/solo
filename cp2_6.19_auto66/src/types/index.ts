export type AssetType = 'bank' | 'fund' | 'stock';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  buyPrice: number;
  currentPrice: number;
  quantity: number;
  buyDate: string;
  createdAt: number;
}

export interface AssetFormData {
  name: string;
  type: AssetType;
  buyPrice: number;
  currentPrice: number;
  quantity: number;
  buyDate: string;
}

export interface FormErrors {
  name?: string;
  type?: string;
  buyPrice?: string;
  currentPrice?: string;
  quantity?: string;
  buyDate?: string;
}

export interface ReportData {
  period: 'month' | 'quarter';
  startDate: string;
  endDate: string;
  assets: Asset[];
  totalValue: number;
  totalReturn: number;
  avgReturnRate: number;
  bestPerformer: Asset | null;
  worstPerformer: Asset | null;
  assetCount: number;
}

export interface AssetTypeConfig {
  label: string;
  color: string;
  gradient: string;
}

export const ASSET_TYPE_CONFIG: Record<AssetType, AssetTypeConfig> = {
  bank: {
    label: '银行',
    color: '#4A90D9',
    gradient: 'from-blue-500 to-blue-600',
  },
  fund: {
    label: '基金',
    color: '#50C878',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  stock: {
    label: '股票',
    color: '#FF6B6B',
    gradient: 'from-red-500 to-red-600',
  },
};
