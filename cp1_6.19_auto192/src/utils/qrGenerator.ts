import type { BrewRecord, CoffeeBean } from '../types';
import { pourMethodLabels } from '../types';

export interface BrewStoryData {
  record: BrewRecord;
  bean: CoffeeBean | undefined;
  shareUrl: string;
}

export const generateBrewStoryUrl = (recordId: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/#/story/${recordId}`;
};

export const getBrewStoryData = (
  recordId: string,
  beans: CoffeeBean[],
  records: BrewRecord[]
): BrewStoryData | null => {
  const record = records.find((r) => r.id === recordId);
  if (!record) return null;

  const bean = beans.find((b) => b.id === record.beanId);
  const shareUrl = generateBrewStoryUrl(recordId);

  return { record, bean, shareUrl };
};

export const generateQRContent = (
  record: BrewRecord,
  bean: CoffeeBean | undefined
): string => {
  const data = {
    bean: bean
      ? {
          name: bean.name,
          origin: bean.origin,
          altitude: bean.altitude,
          processMethod: bean.processMethod,
          roastLevel: bean.roastLevel,
          flavorTags: bean.flavorTags,
          flavorProfile: bean.flavorProfile,
        }
      : null,
    brew: {
      coffeeAmount: record.coffeeAmount,
      waterAmount: record.waterAmount,
      waterTemp: record.waterTemp,
      grindSize: record.grindSize,
      brewTime: record.brewTime,
      pourMethod: pourMethodLabels[record.pourMethod],
      rating: record.rating,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
    },
  };

  return JSON.stringify(data);
};

export const formatBrewTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getBestDrinkingWindow = (
  createdAt: Date
): { start: Date; end: Date; isActive: boolean; remaining: number } => {
  const now = new Date();
  const start = new Date(createdAt.getTime() + 2 * 60 * 1000);
  const end = new Date(createdAt.getTime() + 15 * 60 * 1000);
  const remaining = end.getTime() - now.getTime();
  const isActive = now >= start && now <= end;

  return { start, end, isActive, remaining };
};

export const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '已过期';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
