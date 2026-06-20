import { getValuation as apiGetValuation } from '../../shared/api/apiClient';
import type { ValuationRequest, ValuationResponse } from '../../shared/types';

interface CacheEntry {
  data: ValuationResponse;
  expiresAt: number;
}

const CACHE_TTL = 5 * 60 * 1000;

export class ValuationEngine {
  private static cache = new Map<string, CacheEntry>();

  private static buildCacheKey(payload: ValuationRequest): string {
    return `${payload.brand}|${payload.model}|${payload.usageYears}|${payload.condition}`;
  }

  private static isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static getCacheSize(): number {
    return this.cache.size;
  }

  static async getValuation(payload: ValuationRequest): Promise<ValuationResponse> {
    const key = this.buildCacheKey(payload);
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    const data = await apiGetValuation(payload);

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return data;
  }

  static formatPrice(price: number): string {
    if (price === null || price === undefined || !isFinite(price)) {
      return '¥0';
    }
    const rounded = Math.round(price);
    return `¥${rounded.toLocaleString('zh-CN')}`;
  }

  static formatPriceWithRange(min: number, max: number): string {
    return `${this.formatPrice(min)} - ${this.formatPrice(max)}`;
  }
}

export default ValuationEngine;
