import { useState, useEffect, useMemo } from 'react';
import type { EarthquakeEvent, FilterParams } from '@/types';
import { generateMockEarthquakes } from '@/data/mockEarthquakes';

const DAY_MS = 24 * 60 * 60 * 1000;

export const useEarthquakeData = () => {
  const [data, setData] = useState<EarthquakeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(generateMockEarthquakes(30));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return { data, loading };
};

export const useFilteredData = (
  allData: EarthquakeEvent[],
  params: FilterParams,
  selectedDayStart?: number
) => {
  return useMemo(() => {
    const now = Date.now();
    let rangeStart: number;
    switch (params.timeRange) {
      case '7d':
        rangeStart = now - 7 * DAY_MS;
        break;
      case '30d':
        rangeStart = now - 30 * DAY_MS;
        break;
      default:
        rangeStart = 0;
    }

    const dayStart = selectedDayStart ?? 0;
    const dayEnd = dayStart > 0 ? dayStart + DAY_MS : Infinity;

    return allData.filter((eq) => {
      if (eq.time < rangeStart) return false;
      if (eq.magnitude < params.magnitudeMin || eq.magnitude > params.magnitudeMax) return false;
      if (dayStart > 0 && (eq.time < dayStart || eq.time >= dayEnd)) return false;
      return true;
    });
  }, [allData, params, selectedDayStart]);
};

export const getLast7Days = (): number[] => {
  const days: number[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d.getTime());
  }
  return days;
};

export const getDayStart = (timestamp: number): number => {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
