import type { ReadingRecord, TimeRange } from '@/types';

export function aggregatePagesByPeriod(records: ReadingRecord[], range: TimeRange) {
  const now = new Date();
  const result: Array<{ name: string; value: number }> = [];

  if (range === 'week') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = records.filter((r) => r.date.startsWith(dateStr));
      const pages = dayRecords.reduce((sum, r) => sum + (r.endPage - r.startPage + 1), 0);
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      result.push({ name: weekDays[date.getDay()], value: pages });
    }
  } else {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = records.filter((r) => r.date.startsWith(dateStr));
      const pages = dayRecords.reduce((sum, r) => sum + (r.endPage - r.startPage + 1), 0);
      if (i % 5 === 0 || i === 0) {
        result.push({ name: `${date.getMonth() + 1}/${date.getDate()}`, value: pages });
      } else {
        result.push({ name: '', value: pages });
      }
    }
  }

  return result;
}

export function aggregateMoodDistribution(records: ReadingRecord[], range: TimeRange) {
  const now = new Date();
  const cutoffDate = new Date();

  if (range === 'week') {
    cutoffDate.setDate(now.getDate() - 7);
  } else {
    cutoffDate.setDate(now.getDate() - 30);
  }

  const filteredRecords = records.filter(
    (r) => new Date(r.date) >= cutoffDate
  );

  const moodCount: Record<string, number> = {};
  for (const record of filteredRecords) {
    moodCount[record.mood] = (moodCount[record.mood] || 0) + 1;
  }

  return Object.entries(moodCount).map(([name, value]) => ({ name, value }));
}

export function calculateStreakData(records: ReadingRecord[], range: TimeRange) {
  const now = new Date();
  const result: Array<{ name: string; value: number }> = [];
  const days = range === 'week' ? 7 : 30;

  const readingDates = new Set(
    records.map((r) => new Date(r.date).toISOString().split('T')[0])
  );

  let streak = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    if (readingDates.has(dateStr)) {
      streak++;
    } else {
      streak = 0;
    }

    if (range === 'week' || i % 5 === 0 || i === 0) {
      result.push({
        name: `${date.getMonth() + 1}/${date.getDate()}`,
        value: streak,
      });
    }
  }

  return result;
}
