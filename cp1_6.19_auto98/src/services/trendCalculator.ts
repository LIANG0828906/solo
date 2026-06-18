import { Feedback } from '../store/feedbackReducer';

export interface TrendPoint {
  date: string;
  counts: Record<string, number>;
  total: number;
}

export interface TrendResult {
  points: TrendPoint[];
  activeTags: string[];
  totalCount: number;
  tagColors: Record<string, string>;
}

export type TimeRange = '7d' | '30d' | 'all';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateRange(range: TimeRange): { start: Date; end: Date } | null {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (range === 'all') return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days = range === '7d' ? 6 : 29;
  start.setDate(start.getDate() - days);

  return { start, end };
}

function generateDateSequence(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (cur <= endDate) {
    dates.push(formatDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function calculateTrend(
  feedbacks: Feedback[],
  range: TimeRange
): TrendResult {
  const dateRange = getDateRange(range);
  let filtered = feedbacks;
  let dateSequence: string[];

  if (dateRange) {
    filtered = feedbacks.filter((fb) => {
      const t = fb.createdAt.getTime();
      return (
        t >= dateRange.start.getTime() && t <= dateRange.end.getTime()
      );
    });
    dateSequence = generateDateSequence(dateRange.start, dateRange.end);
  } else {
    if (feedbacks.length === 0) {
      dateSequence = [formatDate(new Date())];
    } else {
      const dates = feedbacks.map((fb) =>
        formatDate(new Date(fb.createdAt))
      );
      const unique = Array.from(new Set(dates)).sort();
      const minD = new Date(unique[0]);
      const maxD = new Date(unique[unique.length - 1]);
      dateSequence = generateDateSequence(minD, maxD);
      if (dateSequence.length === 0) {
        dateSequence = [formatDate(new Date())];
      }
    }
  }

  const tagColors: Record<string, string> = {};
  const tagTotals: Record<string, number> = {};

  const emptyCounts: Record<string, number> = {};
  feedbacks.forEach((fb) => {
    fb.tags.forEach((t) => {
      emptyCounts[t.name] = 0;
      tagColors[t.name] = t.color;
      tagTotals[t.name] = 0;
    });
  });

  const pointsMap: Record<string, TrendPoint> = {};
  dateSequence.forEach((d) => {
    pointsMap[d] = {
      date: d,
      counts: { ...emptyCounts },
      total: 0,
    };
  });

  let totalCount = 0;

  filtered.forEach((fb) => {
    const key = formatDate(new Date(fb.createdAt));
    const point = pointsMap[key];
    if (!point) return;

    totalCount += 1;
    point.total += 1;

    fb.tags.forEach((t) => {
      point.counts[t.name] = (point.counts[t.name] || 0) + 1;
      tagTotals[t.name] = (tagTotals[t.name] || 0) + 1;
    });
  });

  const activeTags = Object.entries(tagTotals)
    .filter(([, v]) => v > 0)
    .map(([k]) => k);

  const points = dateSequence.map((d) => pointsMap[d]);

  return {
    points,
    activeTags,
    totalCount,
    tagColors,
  };
}

export function formatAxisDate(dateStr: string, range: TimeRange): string {
  const [, m, d] = dateStr.split('-');
  if (range === 'all') {
    return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
  }
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}
