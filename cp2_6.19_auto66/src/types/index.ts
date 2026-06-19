export type AssetType = 'stock' | 'fund' | 'bank' | 'bond' | 'gold' | 'other';

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
  stock: {
    label: '股票',
    color: '#FF6B6B',
    gradient: 'from-red-500 to-red-600',
  },
  fund: {
    label: '基金',
    color: '#50C878',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  bank: {
    label: '银行理财',
    color: '#4A90D9',
    gradient: 'from-blue-500 to-blue-600',
  },
  bond: {
    label: '债券',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-amber-600',
  },
  gold: {
    label: '黄金',
    color: '#D4AF37',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  other: {
    label: '其他',
    color: '#94A3B8',
    gradient: 'from-slate-400 to-slate-500',
  },
};
