import type { StockHolding, KLineData } from './types';

const HOLDINGS_KEY = 'portfolio_holdings';
const KLINE_PREFIX = 'kline_data_';

export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public getHoldings(): StockHolding[] {
    try {
      const data = localStorage.getItem(HOLDINGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveHoldings(holdings: StockHolding[]): void {
    localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));
  }

  public addHolding(holding: StockHolding): void {
    const holdings = this.getHoldings();
    holdings.push(holding);
    this.saveHoldings(holdings);
  }

  public updateHolding(id: string, updated: Partial<StockHolding>): void {
    const holdings = this.getHoldings();
    const index = holdings.findIndex((h) => h.id === id);
    if (index !== -1) {
      holdings[index] = { ...holdings[index], ...updated };
      this.saveHoldings(holdings);
    }
  }

  public deleteHolding(id: string): void {
    const holdings = this.getHoldings().filter((h) => h.id !== id);
    this.saveHoldings(holdings);
    this.deleteKLineData(id);
  }

  public getKLineData(stockId: string): KLineData[] {
    try {
      const data = localStorage.getItem(KLINE_PREFIX + stockId);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveKLineData(stockId: string, data: KLineData[]): void {
    localStorage.setItem(KLINE_PREFIX + stockId, JSON.stringify(data));
  }

  public deleteKLineData(stockId: string): void {
    localStorage.removeItem(KLINE_PREFIX + stockId);
  }

  public generateKLineData(basePrice: number, count: number = 60): KLineData[] {
    const data: KLineData[] = [];
    let price = basePrice;
    const today = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const volatility = 0.03;
      const open = price;
      const change = (Math.random() - 0.5) * 2 * volatility * price;
      const close = Number((price + change).toFixed(2));

      const bodyHigh = Math.max(open, close);
      const bodyLow = Math.min(open, close);

      const upperShadow = Math.random() * volatility * price * 0.5;
      const lowerShadow = Math.random() * volatility * price * 0.5;

      let high = bodyHigh + upperShadow;
      let low = bodyLow - lowerShadow;

      high = Math.max(high, open, close);
      low = Math.min(low, open, close);

      const volume = Math.floor(Math.random() * 5000000) + 500000;

      data.push({
        date: date.toISOString().split('T')[0],
        open: Number(open.toFixed(2)),
        close: close,
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        volume,
      });

      price = close;
    }

    return data;
  }
}
