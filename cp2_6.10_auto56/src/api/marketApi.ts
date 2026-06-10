import { MarketTrend } from '../store/useMarketStore';

export interface TransactionRecord {
  id: string;
  timestamp: number;
  transactionAmount: number;
  agentFee: number;
  taxFee: number;
  farmerPrice: number;
  shopkeeperPrice: number;
  marketTrend: MarketTrend;
  cattleId: number;
}

export const getMarketTrend = async (): Promise<{ trend: MarketTrend; timestamp: number }> => {
  const response = await fetch('/api/market-trend');
  return response.json();
};

export const submitTransaction = async (data: Omit<TransactionRecord, 'id' | 'timestamp'>): Promise<TransactionRecord> => {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getTransactionHistory = async (): Promise<TransactionRecord[]> => {
  const response = await fetch('/api/transactions');
  return response.json();
};
