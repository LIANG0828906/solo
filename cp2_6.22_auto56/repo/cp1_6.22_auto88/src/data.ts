import type { Stock, StockDataPoint } from './types';
import { STOCK_LIST, STOCK_COLORS, CONFIG } from './types';

export class DataGenerator {
  private stocks: Stock[] = [];
  private intervalId: number | null = null;
  private callback: ((stocks: Stock[]) => void) | null = null;

  constructor() {
    this.initStocks();
    this.generateInitialData();
  }

  private initStocks(): void {
    this.stocks = STOCK_LIST.map((item, index) => ({
      id: `stock-${index}`,
      code: item.code,
      name: item.name,
      basePrice: item.basePrice,
      data: [],
      color: STOCK_COLORS[index % STOCK_COLORS.length],
      annotations: [],
      lastPrice: item.basePrice,
      prevPrice: item.basePrice
    }));
  }

  private generateInitialData(): void {
    const now = Date.now();
    const interval = CONFIG.PUSH_INTERVAL;
    const count = Math.floor(CONFIG.MAX_DATA_POINTS * 0.6);

    for (let i = 0; i < count; i++) {
      const timestamp = now - (count - i) * interval;
      this.stocks.forEach(stock => {
        const point = this.generateNextPointInternal(stock, timestamp);
        stock.data.push(point);
        stock.lastPrice = point.price;
        stock.prevPrice = point.price;
      });
    }
  }

  private generateNextPointInternal(stock: Stock, timestamp: number): StockDataPoint {
    const lastPrice = stock.data.length > 0 ? stock.data[stock.data.length - 1].price : stock.basePrice;
    
    const drift = CONFIG.TREND_STRENGTH * (Math.random() - 0.5);
    const shock = CONFIG.VOLATILITY * (Math.random() - 0.5);
    const change = lastPrice * (drift + shock);
    
    let newPrice = lastPrice + change;
    const minPrice = stock.basePrice * 0.7;
    const maxPrice = stock.basePrice * 1.3;
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
    
    const baseVolume = 1000000;
    const volume = Math.floor(baseVolume * (0.8 + Math.random() * 0.4));

    return {
      timestamp,
      price: newPrice,
      volume
    };
  }

  public generateNextPoint(stock: Stock): StockDataPoint {
    const timestamp = Date.now();
    const point = this.generateNextPointInternal(stock, timestamp);
    
    stock.prevPrice = stock.lastPrice;
    stock.lastPrice = point.price;
    
    if (stock.data.length >= CONFIG.MAX_DATA_POINTS) {
      stock.data.shift();
    }
    stock.data.push(point);
    
    return point;
  }

  public startPushing(callback: (stocks: Stock[]) => void): void {
    this.callback = callback;
    
    if (this.intervalId !== null) {
      return;
    }

    const pushData = (): void => {
      this.stocks.forEach(stock => {
        this.generateNextPoint(stock);
      });
      
      if (this.callback) {
        this.callback(this.stocks);
      }
    };

    for (let i = 0; i < 100; i++) {
      pushData();
    }

    this.intervalId = window.setInterval(pushData, CONFIG.PUSH_INTERVAL);
  }

  public stopPushing(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.callback = null;
  }

  public getStocks(): Stock[] {
    return this.stocks;
  }

  public addAnnotation(stockId: string, text: string, color: string): void {
    const stock = this.stocks.find(s => s.id === stockId);
    if (stock && stock.data.length > 0) {
      const lastPoint = stock.data[stock.data.length - 1];
      stock.annotations.push({
        id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stockId,
        timestamp: lastPoint.timestamp,
        text,
        color
      });
    }
  }
}
