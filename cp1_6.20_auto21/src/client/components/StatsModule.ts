import { api } from '../utils/api';
import { Stats } from '../types';

export class StatsModule {
  private static cache: Stats | null = null;
  private static lastFetchTime: number = 0;
  private static readonly CACHE_DURATION = 30000;

  static async getStats(forceRefresh: boolean = false): Promise<Stats> {
    const now = Date.now();
    
    if (!forceRefresh && this.cache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cache;
    }

    const stats = await api.getStats();
    this.cache = stats;
    this.lastFetchTime = now;
    return stats;
  }

  static clearCache(): void {
    this.cache = null;
    this.lastFetchTime = 0;
  }

  static calculateStatusPercentages(stats: Stats): Record<string, number> {
    const total = stats.totalCount || 1;
    return Object.fromEntries(
      Object.entries(stats.statusCounts).map(([status, count]) => [
        status,
        Math.round((count / total) * 1000) / 10
      ])
    );
  }

  static calculatePriorityPercentages(stats: Stats): Record<string, number> {
    const total = stats.totalCount || 1;
    return Object.fromEntries(
      Object.entries(stats.priorityCounts).map(([priority, count]) => [
        priority,
        Math.round((count / total) * 1000) / 10
      ])
    );
  }

  static getLast7DaysCounts(stats: Stats): { date: string; count: number }[] {
    const result: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: stats.dailyCounts[dateStr] || 0
      });
    }
    
    return result;
  }
}
