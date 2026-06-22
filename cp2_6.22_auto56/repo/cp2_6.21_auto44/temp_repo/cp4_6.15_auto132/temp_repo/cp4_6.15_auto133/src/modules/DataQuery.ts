import axios from 'axios';

export interface DailyPlay {
  date: string;
  plays: number;
  topTracks: { name: string; plays: number }[];
}

export interface AudienceAge {
  '18-24': number;
  '25-34': number;
  '35-44': number;
  '45+': number;
  unknown: number;
}

export interface StatsResponse {
  dailyPlays: DailyPlay[];
  audienceAge: AudienceAge;
}

export interface HeatmapCell {
  x: number;
  y: number;
  region: string;
  plays: number;
}

export interface HeatmapResponse {
  cells: HeatmapCell[];
}

export interface TrackNode {
  id: string;
  name: string;
  plays: number;
}

export interface TrackFlow {
  source: string;
  target: string;
  percentage: number;
}

export interface FlowResponse {
  nodes: TrackNode[];
  flows: TrackFlow[];
}

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
}

const MAX_CACHE_SIZE = 10;
const CACHE_TTL = 60000;

class DataQuery {
  private statsCache: CacheEntry<StatsResponse>[] = [];
  private heatmapCache: CacheEntry<HeatmapResponse>[] = [];
  private flowCache: CacheEntry<FlowResponse>[] = [];

  private getCacheKey(startDate: string, endDate: string): string {
    return `${startDate}_${endDate}`;
  }

  private getCached<T>(cache: CacheEntry<T>[], key: string): T | null {
    const now = Date.now();
    const entry = cache.find(e => e.key === key);
    if (entry && now - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
    return null;
  }

  private setCached<T>(cache: CacheEntry<T>[], key: string, data: T): void {
    const existingIdx = cache.findIndex(e => e.key === key);
    if (existingIdx >= 0) {
      cache.splice(existingIdx, 1);
    }
    cache.unshift({ key, data, timestamp: Date.now() });
    if (cache.length > MAX_CACHE_SIZE) {
      cache.pop();
    }
  }

  async getStats(startDate: string, endDate: string): Promise<StatsResponse> {
    const cacheKey = this.getCacheKey(startDate, endDate);
    const cached = this.getCached(this.statsCache, cacheKey);
    if (cached) {
      return cached;
    }

    const response = await axios.get<StatsResponse>('/api/stats', {
      params: { startDate, endDate }
    });
    this.setCached(this.statsCache, cacheKey, response.data);
    return response.data;
  }

  async getHeatmap(startDate: string, endDate: string): Promise<HeatmapResponse> {
    const cacheKey = this.getCacheKey(startDate, endDate);
    const cached = this.getCached(this.heatmapCache, cacheKey);
    if (cached) {
      return cached;
    }

    const response = await axios.get<HeatmapResponse>('/api/heatmap', {
      params: { startDate, endDate }
    });
    this.setCached(this.heatmapCache, cacheKey, response.data);
    return response.data;
  }

  async getFlow(): Promise<FlowResponse> {
    const cacheKey = 'all';
    const cached = this.getCached(this.flowCache, cacheKey);
    if (cached) {
      return cached;
    }

    const response = await axios.get<FlowResponse>('/api/flow');
    this.setCached(this.flowCache, cacheKey, response.data);
    return response.data;
  }
}

export const dataQuery = new DataQuery();
