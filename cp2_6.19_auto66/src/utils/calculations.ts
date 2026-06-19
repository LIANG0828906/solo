import type { Asset, AssetType } from '@/types';

export const calculateReturnRate = (buyPrice: number, currentPrice: number): number => {
  if (buyPrice <= 0) return 0;
  return ((currentPrice - buyPrice) / buyPrice) * 100;
};

export const calculateMarketValue = (currentPrice: number, quantity: number): number => {
  return currentPrice * quantity;
};

export const calculateTotalReturn = (asset: Asset): number => {
  return (asset.currentPrice - asset.buyPrice) * asset.quantity;
};

export const calculateHoldingDays = (buyDate: string): number => {
  const buy = new Date(buyDate);
  const today = new Date();
  const diffTime = today.getTime() - buy.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateTotalMarketValue = (assets: Asset[]): number => {
  return assets.reduce((sum, asset) => sum + calculateMarketValue(asset.currentPrice, asset.quantity), 0);
};

export const calculateTotalPortfolioReturn = (assets: Asset[]): number => {
  return assets.reduce((sum, asset) => sum + calculateTotalReturn(asset), 0);
};

export const calculatePortfolioReturnRate = (assets: Asset[]): number => {
  const totalCost = assets.reduce((sum, asset) => sum + asset.buyPrice * asset.quantity, 0);
  const totalValue = calculateTotalMarketValue(assets);
  if (totalCost <= 0) return 0;
  return ((totalValue - totalCost) / totalCost) * 100;
};

export const getTopPerformer = (assets: Asset[]): Asset | null => {
  if (assets.length === 0) return null;
  return assets.reduce((top, asset) => {
    const topRate = calculateReturnRate(top.buyPrice, top.currentPrice);
    const assetRate = calculateReturnRate(asset.buyPrice, asset.currentPrice);
    return assetRate > topRate ? asset : top;
  });
};

export const getWorstPerformer = (assets: Asset[]): Asset | null => {
  if (assets.length === 0) return null;
  return assets.reduce((worst, asset) => {
    const worstRate = calculateReturnRate(worst.buyPrice, worst.currentPrice);
    const assetRate = calculateReturnRate(asset.buyPrice, asset.currentPrice);
    return assetRate < worstRate ? asset : worst;
  });
};

export const calculateAvgReturnRate = (assets: Asset[]): number => {
  if (assets.length === 0) return 0;
  const totalRate = assets.reduce((sum, asset) => sum + calculateReturnRate(asset.buyPrice, asset.currentPrice), 0);
  return totalRate / assets.length;
};

export interface TypeAllocation {
  type: AssetType;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export const calculateTypeAllocation = (assets: Asset[]): TypeAllocation[] => {
  const typeValues: Record<AssetType, number> = { stock: 0, fund: 0, bank: 0, bond: 0, gold: 0, other: 0 };
  const totalValue = calculateTotalMarketValue(assets);

  assets.forEach((asset) => {
    typeValues[asset.type] += calculateMarketValue(asset.currentPrice, asset.quantity);
  });

  const typeLabels: Record<AssetType, string> = {
    stock: '股票',
    fund: '基金',
    bank: '银行理财',
    bond: '债券',
    gold: '黄金',
    other: '其他',
  };

  const typeColors: Record<AssetType, string> = {
    stock: '#FF6B6B',
    fund: '#50C878',
    bank: '#4A90D9',
    bond: '#F59E0B',
    gold: '#D4AF37',
    other: '#94A3B8',
  };

  return (Object.keys(typeValues) as AssetType[]).map((type) => ({
    type,
    label: typeLabels[type],
    value: typeValues[type],
    percentage: totalValue > 0 ? (typeValues[type] / totalValue) * 100 : 0,
    color: typeColors[type],
  }));
};

export const getDateRange = (period: 'month' | 'quarter'): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();

  if (period === 'month') {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setMonth(start.getMonth() - 3);
  }

  return { start, end };
};

export const filterAssetsByDateRange = (
  assets: Asset[],
  startDate: Date,
  endDate: Date
): Asset[] => {
  return assets.filter((asset) => {
    const buyDate = new Date(asset.buyDate);
    return buyDate >= startDate && buyDate <= endDate;
  });
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const generateMonthlyTrendData = (assets: Asset[], months: number = 6): Array<{ month: string; value: number }> => {
  const result: Array<{ month: string; value: number }> = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const monthAssets = assets.filter((asset) => new Date(asset.buyDate) <= date);
    const value = calculateTotalMarketValue(monthAssets);

    result.push({ month: monthStr, value });
  }

  return result;
};
