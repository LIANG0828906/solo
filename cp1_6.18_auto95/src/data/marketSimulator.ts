import { MarketData, CandleData } from '../services/types';

type DataCallback = (data: MarketData) => void;
type CandleCallback = (candle: CandleData) => void;

class MarketSimulator {
  private symbol: string;
  private currentPrice: number;
  private intervalId: number | null = null;
  private candleIntervalId: number | null = null;
  private isRunning: boolean = false;
  private dataCallbacks: DataCallback[] = [];
  private candleCallbacks: CandleCallback[] = [];
  private tickCount: number = 0;
  private candleOpen: number = 0;
  private candleHigh: number = 0;
  private candleLow: number = Infinity;
  private candleClose: number = 0;
  private candleVolume: number = 0;
  private candleTimestamp: number = 0;
  private history: CandleData[] = [];
  private maxHistory: number = 100;
  private tickData: MarketData[] = [];
  private maxTickHistory: number = 200;

  constructor(symbol: string = 'SIMULATED_STOCK', initialPrice: number = 100) {
    this.symbol = symbol;
    this.currentPrice = initialPrice;
    this.candleOpen = initialPrice;
    this.candleHigh = initialPrice;
    this.candleLow = initialPrice;
    this.candleClose = initialPrice;
    this.candleTimestamp = Date.now();
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tickCount = 0;
    this.candleOpen = this.currentPrice;
    this.candleHigh = this.currentPrice;
    this.candleLow = this.currentPrice;
    this.candleClose = this.currentPrice;
    this.candleTimestamp = Date.now();

    this.intervalId = window.setInterval(() => this.tick(), 100);
    this.candleIntervalId = window.setInterval(() => this.finalizeCandle(), 300);
  }

  stop(): void {
    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.candleIntervalId !== null) {
      clearInterval(this.candleIntervalId);
      this.candleIntervalId = null;
    }
  }

  resume(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = window.setInterval(() => this.tick(), 100);
    this.candleIntervalId = window.setInterval(() => this.finalizeCandle(), 300);
  }

  pause(): void {
    this.stop();
  }

  isActive(): boolean {
    return this.isRunning;
  }

  onData(callback: DataCallback): () => void {
    this.dataCallbacks.push(callback);
    return () => {
      this.dataCallbacks = this.dataCallbacks.filter((cb) => cb !== callback);
    };
  }

  onCandle(callback: CandleCallback): () => void {
    this.candleCallbacks.push(callback);
    return () => {
      this.candleCallbacks = this.candleCallbacks.filter((cb) => cb !== callback);
    };
  }

  getSymbol(): string {
    return this.symbol;
  }

  getCurrentPrice(): number {
    return this.currentPrice;
  }

  getCandleHistory(): CandleData[] {
    return [...this.history];
  }

  getTickHistory(): MarketData[] {
    return [...this.tickData];
  }

  private tick(): void {
    const trend = Math.sin(this.tickCount / 50) * 0.002;
    const noise = (Math.random() - 0.5) * 0.015;
    const changePercent = trend + noise;

    const priceChange = this.currentPrice * changePercent;
    const newPrice = Math.max(this.currentPrice + priceChange, 1);

    const open = this.currentPrice;
    const close = newPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.003);
    const volume = Math.floor(Math.random() * 10000) + 1000;

    const data: MarketData = {
      symbol: this.symbol,
      timestamp: Date.now(),
      open,
      high,
      low,
      close: newPrice,
      volume,
    };

    this.currentPrice = newPrice;
    this.candleHigh = Math.max(this.candleHigh, high);
    this.candleLow = Math.min(this.candleLow, low);
    this.candleClose = newPrice;
    this.candleVolume += volume;

    this.tickData.push(data);
    if (this.tickData.length > this.maxTickHistory) {
      this.tickData.shift();
    }

    this.tickCount++;

    this.dataCallbacks.forEach((cb) => cb(data));
  }

  private finalizeCandle(): void {
    const candle: CandleData = {
      timestamp: this.candleTimestamp,
      open: this.candleOpen,
      high: this.candleHigh,
      low: this.candleLow,
      close: this.candleClose,
      volume: this.candleVolume,
    };

    this.history.push(candle);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.candleCallbacks.forEach((cb) => cb(candle));

    this.candleOpen = this.currentPrice;
    this.candleHigh = this.currentPrice;
    this.candleLow = this.currentPrice;
    this.candleClose = this.currentPrice;
    this.candleVolume = 0;
    this.candleTimestamp = Date.now();
  }

  getLatestCandle(): CandleData | null {
    if (this.history.length === 0) return null;
    return this.history[this.history.length - 1];
  }
}

export const marketSimulator = new MarketSimulator('MOCK_STOCK', 100);
export default MarketSimulator;
