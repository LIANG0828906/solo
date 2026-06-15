import { get, set, del } from 'idb-keyval';
import type { TimeBlock, ReviewData, DailyReport } from '@/types';

const BLOCKS_PREFIX = 'blocks:';
const REVIEWS_PREFIX = 'reviews:';
const REPORT_PREFIX = 'report:';

export async function loadBlocks(date: string): Promise<TimeBlock[]> {
  const data = await get<TimeBlock[]>(BLOCKS_PREFIX + date);
  return data ?? [];
}

export async function saveBlocks(date: string, blocks: TimeBlock[]): Promise<void> {
  await set(BLOCKS_PREFIX + date, blocks);
}

export async function loadReviews(date: string): Promise<Record<string, ReviewData>> {
  const data = await get<Record<string, ReviewData>>(REVIEWS_PREFIX + date);
  return data ?? {};
}

export async function saveReviews(date: string, reviews: Record<string, ReviewData>): Promise<void> {
  await set(REVIEWS_PREFIX + date, reviews);
}

export async function loadReport(date: string): Promise<DailyReport | null> {
  const data = await get<DailyReport>(REPORT_PREFIX + date);
  return data ?? null;
}

export async function saveReport(date: string, report: DailyReport): Promise<void> {
  await set(REPORT_PREFIX + date, report);
}

export async function deleteBlockData(date: string, blockId: string): Promise<void> {
  const blocks = await loadBlocks(date);
  await saveBlocks(date, blocks.filter(b => b.id !== blockId));
}
