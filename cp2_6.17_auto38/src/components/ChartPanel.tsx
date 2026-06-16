import ReactECharts from 'echarts-for-react';
import { usePropertyStore } from '@/store/propertyStore';
import { useMemo } from 'react';

export default function ChartPanel() {
  const getMonthlyStats = usePropertyStore((s) => s.getMonthlyStats);
  const selectedPropertyId = usePropertyStore((s) => s.selectedPropertyId);
  const properties = usePropertyStore((s) => s.properties);

  const stats = useMemo(() => getMonthlyStats(), [getMonthlyStats, selectedPropertyId]);

  const selectedPropName = selectedPropertyId
    ? properties.find((p) => p.id === selectedPropertyId)?.name
    : '全部房源';

  const option = {
    title: {
      text: `${selectedPropName} - 月度收入与入住率`,
      left: 'left',
      textStyle: {
        color: '#2C3E50',
        fontSize: 16,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['月度收入', '入住率'],
      top: 0,
      right: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: stats.map((s) => s.month),
        axisPointer: { type: 'shadow' },
        axisLine: { lineStyle: { color: '#BDC3C7' } },
        axisLabel: { color: '#7F8C8D' },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '收入(元)',
        min: 0,
        axisLabel: {
          formatter: '{value}',
          color: '#7F8C8D',
        },
        splitLine: { lineStyle: { color: '#ECF0F1' } },
        nameTextStyle: { color: '#7F8C8D' },
      },
      {
        type: 'value',
        name: '入住率(%)',
        min: 0,
        max: 100,
        interval: 25,
        axisLabel: {
          formatter: '{value}%',
          color: '#7F8C8D',
        },
        splitLine: { show: false },
        nameTextStyle: { color: '#7F8C8D' },
      },
    ],
    series: [
      {
        name: '月度收入',
        type: 'bar',
        data: stats.map((s) => s.revenue),
        itemStyle: {
          color: '#3498DB',
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '35%',
      },
      {
        name: '入住率',
        type: 'line',
        yAxisIndex: 1,
        data: stats.map((s) => s.occupancyRate),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: '#E74C3C',
          width: 3,
        },
        itemStyle: {
          color: '#E74C3C',
        },
      },
    ],
    animationDuration: 200,
  };

  return (
    <div className="chart-panel">
      <ReactECharts
        option={option}
        style={{ height: 360, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
        lazyUpdate={false}
      />
    </div>
  );
}
