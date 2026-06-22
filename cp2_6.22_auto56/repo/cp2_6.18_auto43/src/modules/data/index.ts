import {
  HealthRecord,
  WeeklyStats,
  LineChartPoint,
  BarChartItem,
  RangeOption,
  STORAGE_KEY
} from './types';

const pad = (n: number) => n.toString().padStart(2, '0');

export const formatDate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const getAllRecords = (): HealthRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedSampleData();
    const parsed = JSON.parse(raw) as HealthRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const persistRecords = (records: HealthRecord[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const saveRecord = (record: HealthRecord): HealthRecord[] => {
  const all = getAllRecords();
  const idx = all.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  all.sort((a, b) => b.timestamp - a.timestamp);
  persistRecords(all);
  return all;
};

export const deleteRecord = (id: string): HealthRecord[] => {
  const all = getAllRecords().filter((r) => r.id !== id);
  persistRecords(all);
  return all;
};

export const getRecordsByDateRange = (
  records: HealthRecord[],
  startISO: string,
  endISO: string
): HealthRecord[] => {
  if (startISO > endISO) return [];
  return records.filter(
    (r) => r.date >= startISO && r.date <= endISO
  );
};

export const queryByDateRange = getRecordsByDateRange;

export const queryByMedication = (
  records: HealthRecord[],
  name: string
): HealthRecord[] => {
  const lower = name.toLowerCase();
  return records.filter((r) =>
    r.medication.name.toLowerCase().includes(lower)
  );
};

export const getStartOfRange = (range: RangeOption): string => {
  const d = new Date();
  d.setDate(d.getDate() - (range - 1));
  return formatDate(d);
};

export const getDateForLastNDays = (n: number): string[] => {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(formatDate(d));
  }
  return result;
};

export const isAbnormalBP = (systolic?: number, diastolic?: number): boolean => {
  if (systolic === undefined || diastolic === undefined) return false;
  return systolic >= 140 || diastolic >= 90 || systolic < 90 || diastolic < 60;
};

export const computeWeeklyStats = (records: HealthRecord[]): WeeklyStats => {
  const weekStart = getStartOfRange(7);
  const today = formatDate(new Date());
  const weekRecords = queryByDateRange(records, weekStart, today);

  let sysSum = 0, diaSum = 0, bpCount = 0;
  let takenCount = 0, totalMeds = 0;
  const abnormalDates = new Set<string>();

  for (const r of weekRecords) {
    totalMeds++;
    if (r.medication.taken) takenCount++;
    const { systolic, diastolic } = r.metrics;
    if (systolic !== undefined && diastolic !== undefined) {
      sysSum += systolic;
      diaSum += diastolic;
      bpCount++;
      if (isAbnormalBP(systolic, diastolic)) {
        abnormalDates.add(r.date);
      }
    }
  }

  return {
    avgBloodPressure: {
      systolic: bpCount ? Math.round(sysSum / bpCount) : 0,
      diastolic: bpCount ? Math.round(diaSum / bpCount) : 0
    },
    adherenceRate: totalMeds ? Math.round((takenCount / totalMeds) * 100) : 0,
    abnormalDays: abnormalDates.size,
    totalDoses: takenCount
  };
};

export const calculateMonthlyStats = (records: HealthRecord[]): number => {
  if (records.length === 0) return 0;
  const dates = new Set(records.map((r) => r.date));
  const days = Math.max(dates.size, 1);
  const monthsDiff = days / 30;
  if (monthsDiff === 0) {
    const takenCount = records.filter((r) => r.medication.taken).length;
    return takenCount;
  }
  return Math.round(records.filter((r) => r.medication.taken).length / monthsDiff);
};

export const getMonthlyAverageDoses = calculateMonthlyStats;

export const getAbnormalRatio = (records: HealthRecord[]): number => {
  const withBP = records.filter(
    (r) => r.metrics.systolic !== undefined && r.metrics.diastolic !== undefined
  );
  if (withBP.length === 0) return 0;
  const abn = withBP.filter((r) => isAbnormalBP(r.metrics.systolic, r.metrics.diastolic)).length;
  return Math.round((abn / withBP.length) * 100);
};

export const prepareLineChartData = (
  records: HealthRecord[],
  range: RangeOption
): LineChartPoint[] => {
  const dates = getDateForLastNDays(range);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const filtered = queryByDateRange(records, start, end);

  const map = new Map<string, { sys: number[]; dia: number[]; bs: number[] }>();
  for (const d of dates) {
    map.set(d, { sys: [], dia: [], bs: [] });
  }
  for (const r of filtered) {
    const entry = map.get(r.date);
    if (!entry) continue;
    if (r.metrics.systolic !== undefined) entry.sys.push(r.metrics.systolic);
    if (r.metrics.diastolic !== undefined) entry.dia.push(r.metrics.diastolic);
    if (r.metrics.bloodSugar !== undefined) entry.bs.push(r.metrics.bloodSugar);
  }

  const avg = (arr: number[]): number | undefined =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : undefined;

  return dates.map((d) => {
    const e = map.get(d)!;
    return {
      date: d.slice(5),
      systolic: avg(e.sys),
      diastolic: avg(e.dia),
      bloodSugar: avg(e.bs)
    };
  });
};

export const prepareBarChartData = (
  records: HealthRecord[],
  range: RangeOption
): BarChartItem[] => {
  const start = getStartOfRange(range);
  const today = formatDate(new Date());
  const filtered = queryByDateRange(records, start, today);
  const counter = new Map<string, number>();
  for (const r of filtered) {
    const name = r.medication.name.length > 5 ? r.medication.name.slice(0, 5) + '…' : r.medication.name;
    counter.set(name, (counter.get(name) || 0) + 1);
  }
  return Array.from(counter.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};

export const getDailyRecords = (records: HealthRecord[], dateISO: string): HealthRecord[] => {
  return records.filter((r) => r.date === dateISO);
};

export const getCalendarStatus = (
  records: HealthRecord[],
  year: number,
  month: number
): Map<string, 'taken' | 'missed' | 'none'> => {
  const result = new Map<string, 'taken' | 'missed' | 'none'>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    result.set(iso, 'none');
  }
  const monthStart = `${year}-${pad(month + 1)}-01`;
  const monthEnd = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`;
  const monthRecords = queryByDateRange(records, monthStart, monthEnd);
  const daily = new Map<string, HealthRecord[]>();
  for (const r of monthRecords) {
    if (!daily.has(r.date)) daily.set(r.date, []);
    daily.get(r.date)!.push(r);
  }
  for (const [date, list] of daily) {
    const allTaken = list.every((r) => r.medication.taken);
    const anyTaken = list.some((r) => r.medication.taken);
    if (allTaken) result.set(date, 'taken');
    else if (anyTaken) result.set(date, 'missed');
    else result.set(date, 'missed');
  }
  return result;
};

function seedSampleData(): HealthRecord[] {
  const meds = [
    '阿司匹林肠溶片', '氨氯地平片', '二甲双胍片', '缬沙坦胶囊', '美托洛尔片'
  ];
  const result: HealthRecord[] = [];
  const now = Date.now();
  for (let i = 0; i < 45; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = formatDate(d);
    const count = 1 + (i % 2);
    for (let j = 0; j < count; j++) {
      const medIdx = (i + j) % meds.length;
      const hour = 7 + j * 6;
      const time = `${pad(hour)}:${pad((i * 5) % 60)}`;
      const systolic = 115 + ((i * 7 + j * 3) % 40);
      const diastolic = 70 + ((i * 5 + j * 2) % 20);
      const bloodSugar = 5.0 + ((i * 0.3 + j * 0.5) % 4);
      result.push({
        id: `seed-${i}-${j}`,
        date,
        timestamp: now - i * 86400000 - j * 3600000,
        medication: {
          id: `med-${i}-${j}`,
          name: meds[medIdx],
          dosage: `${1 + (i % 2)}片`,
          time,
          taken: i < 35 ? (i % 11 !== 0) : false
        },
        metrics: {
          systolic,
          diastolic,
          bloodSugar: Math.round(bloodSugar * 10) / 10
        },
        note: i % 15 === 0 ? '随餐后服用' : undefined
      });
    }
  }
  persistRecords(result);
  return result;
}
