import type { GrowthRecord, ChartOption, ChartDataPoint } from './types';

const getWeekNumber = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const now = new Date(year, month - 1, day);
  const start = new Date(year, 0, 1);
  const diff = now.getTime() - start.getTime();
  const week = Math.ceil((diff + start.getDay() * 86400000) / 604800000);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
};

const generateWeeklyChartConfig = (
  records: GrowthRecord[],
  initialHeight: number,
  initialLeaves: number,
  createdAt: string
): ChartOption => {
  const weeklyData = new Map<string, { heights: number[]; leaves: number[]; date: string }>();

  const createDate = new Date(createdAt);
  const initialWeek = getWeekNumber(createDate);
  weeklyData.set(initialWeek, {
    heights: [initialHeight],
    leaves: [initialLeaves],
    date: formatDate(createDate),
  });

  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const record of sortedRecords) {
    const date = new Date(record.timestamp);
    const week = getWeekNumber(date);

    if (!weeklyData.has(week)) {
      weeklyData.set(week, { heights: [], leaves: [], date: formatDate(date) });
    }

    const weekData = weeklyData.get(week)!;
    if (record.height !== undefined) {
      weekData.heights.push(record.height);
    }
    if (record.leaves !== undefined) {
      weekData.leaves.push(record.leaves);
    }
  }

  const data: ChartDataPoint[] = Array.from(weeklyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, values]) => ({
      week,
      date: values.date,
      height:
        values.heights.length > 0
          ? values.heights.reduce((a, b) => a + b, 0) / values.heights.length
          : 0,
      leaves:
        values.leaves.length > 0
          ? Math.round(
              values.leaves.reduce((a, b) => a + b, 0) / values.leaves.length
            )
          : 0,
    }));

  let lastHeight = initialHeight;
  let lastLeaves = initialLeaves;
  for (const point of data) {
    if (point.height === 0) {
      point.height = lastHeight;
    } else {
      lastHeight = point.height;
    }
    if (point.leaves === 0) {
      point.leaves = lastLeaves;
    } else {
      lastLeaves = point.leaves;
    }
  }

  return {
    data,
    heightAxis: {
      name: '高度 (cm)',
      color: '#3498db',
    },
    leavesAxis: {
      name: '叶片数',
      color: '#2ecc71',
    },
  };
};

export { generateWeeklyChartConfig };
