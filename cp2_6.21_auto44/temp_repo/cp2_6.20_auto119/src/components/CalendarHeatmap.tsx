import React from 'react';
import { Heatmap } from '@ant-design/charts';
import { Card } from 'antd';
import dayjs from 'dayjs';

interface CalendarHeatmapProps {
  data: { date: string; value: number }[];
  totalHabits: number;
  onDateClick?: (date: string) => void;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  totalHabits,
  onDateClick,
}) => {
  const currentYear = dayjs().year();
  const startDate = dayjs(`${currentYear}-01-01`);
  const endDate = dayjs(`${currentYear}-12-31`);

  const fullYearData = [];
  for (let d = startDate; d.isBefore(endDate) || d.isSame(endDate); d = d.add(1, 'day')) {
    const dateStr = d.format('YYYY-MM-DD');
    const existing = data.find(item => item.date === dateStr);
    fullYearData.push({
      date: dateStr,
      value: existing?.value ?? 0,
      week: d.week(),
      day: d.day(),
    });
  }

  const getColor = (value: number): string => {
    if (totalHabits === 0 || value === 0) return '#f0f0f0';
    const ratio = value / totalHabits;
    if (ratio <= 0.25) return '#c6e48b';
    if (ratio <= 0.5) return '#7bc96f';
    if (ratio <= 0.75) return '#239a3b';
    return '#196127';
  };

  const config = {
    data: fullYearData,
    xField: 'week',
    yField: 'day',
    colorField: 'value',
    color: (d: { value: number }) => getColor(d.value),
    shape: 'square',
    sizeRatio: 0.9,
    padding: [20, 20, 40, 60],
    tooltip: {
      formatter: (d: { date: string; value: number }) => ({
        name: d.date,
        value: `${d.value}/${totalHabits}`,
      }),
    },
    onReady: (plot: any) => {
      plot.on('element:click', (evt: any) => {
        if (onDateClick && evt.data?.data?.date) {
          onDateClick(evt.data.data.date);
        }
      });
    },
    xAxis: {
      title: null,
      tickLine: null,
      line: null,
      label: false,
    },
    yAxis: {
      title: null,
      tickLine: null,
      line: null,
      label: {
        formatter: (v: string) => ['日', '一', '二', '三', '四', '五', '六'][Number(v)],
      },
    },
    legend: false,
  };

  return (
    <Card title={`${currentYear}年习惯热力图`} style={{ height: '100%' }}>
      <Heatmap {...config} />
    </Card>
  );
};

export default CalendarHeatmap;
