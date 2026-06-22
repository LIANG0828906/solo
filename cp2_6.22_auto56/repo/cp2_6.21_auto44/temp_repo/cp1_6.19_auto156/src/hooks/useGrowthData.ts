import { useState, useEffect, useMemo } from 'react';
import type { Plant, ChartDataPoint } from '@/types';
import { formatDate } from '@/utils/plantHelper';

export const useGrowthData = (
  plant: Plant | undefined,
  range: '7d' | '30d' = '7d'
) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (!plant) {
      setData([]);
      return;
    }

    const days = range === '7d' ? 7 : 30;
    const sortedLogs = [...plant.growthLogs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-days);

    const chartData: ChartDataPoint[] = sortedLogs.map((log) => ({
      date: formatDate(log.date),
      height: log.height,
      leafCount: log.leafCount,
      soilMoisture: log.soilMoisture,
    }));

    setData(chartData);
  }, [plant, range]);

  const hasData = useMemo(() => data.length > 0, [data]);

  return {
    data,
    hasData,
  };
};
