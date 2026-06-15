import type { DataRow, ChartType, StatsSummary } from '../types';

export interface ProcessedChartData {
  option: Record<string, unknown>;
  stats: StatsSummary;
}

function toNumber(v: unknown): number {
  if (typeof v === 'number' && !isNaN(v) && isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.\-eE]/g, ''));
    return isNaN(n) || !isFinite(n) ? 0 : n;
  }
  return 0;
}

function calcStats(values: number[], selectedIndex: number | null): StatsSummary {
  if (values.length === 0) {
    return { sum: 0, average: 0, max: 0, min: 0, selectedLabel: null, selectedValue: null };
  }
  let sum = 0;
  let max = -Infinity;
  let min = Infinity;
  for (const v of values) {
    sum += v;
    if (v > max) max = v;
    if (v < min) min = v;
  }
  const stats: StatsSummary = {
    sum: Number(sum.toFixed(2)),
    average: Number((sum / values.length).toFixed(2)),
    max,
    min,
    selectedLabel: null,
    selectedValue: null,
  };
  if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < values.length) {
    stats.selectedValue = values[selectedIndex];
  }
  return stats;
}

export function processData(
  rows: DataRow[],
  labelColumn: string,
  valueColumn: string,
  chartType: ChartType,
  colors: string[],
  selectedIndex: number | null = null,
): ProcessedChartData {
  const labels: string[] = [];
  const values: number[] = [];
  const rowMap = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawLabel = row[labelColumn];
    const rawValue = row[valueColumn];
    const label = rawLabel === undefined || rawLabel === null || rawLabel === ''
      ? `(空${i + 1})`
      : String(rawLabel);
    const val = toNumber(rawValue);
    if (rowMap.has(label)) {
      const idx = rowMap.get(label)!;
      values[idx] += val;
    } else {
      rowMap.set(label, labels.length);
      labels.push(label);
      values.push(val);
    }
  }

  const stats = calcStats(values, selectedIndex);
  if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < labels.length) {
    stats.selectedLabel = labels[selectedIndex];
  }

  const animationDuration = 500;
  const animationEasing = 'cubicOut';

  if (chartType === 'pie') {
    const pieData = labels.map((label, idx) => ({
      name: label,
      value: values[idx],
      selected: idx === selectedIndex,
    }));

    return {
      option: {
        color: colors,
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(26,26,46,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          textStyle: { color: '#fff', fontSize: 12 },
          formatter: (params: { name?: string; value?: number; percent?: number }) =>
            `<b>${params.name ?? ''}</b><br/>数值：${params.value ?? 0}<br/>占比：${params.percent ?? 0}%`,
        },
        legend: {
          type: 'scroll',
          orient: 'horizontal',
          bottom: 0,
          textStyle: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
          pageTextStyle: { color: 'rgba(255,255,255,0.75)' },
        },
        series: [
          {
            name: '数据',
            type: 'pie',
            radius: selectedIndex !== null ? ['35%', '62%'] : ['40%', '65%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            selectedMode: 'single',
            selectedOffset: selectedIndex !== null ? 18 : 12,
            itemStyle: {
              borderRadius: 6,
              borderColor: 'rgba(26,26,46,0.8)',
              borderWidth: 2,
            },
            label: {
              show: labels.length <= 10,
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
              formatter: '{b}\n{d}%',
            },
            labelLine: { show: labels.length <= 10, length: 8, length2: 6 },
            emphasis: {
              scale: true,
              scaleSize: 10,
              label: { show: true, fontSize: 13, fontWeight: 'bold' },
              itemStyle: {
                shadowBlur: 20,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0,0,0,0.5)',
              },
            },
            data: pieData,
          },
        ],
        animationDuration,
        animationEasing,
        animationDurationUpdate: 500,
      },
      stats,
    };
  }

  const isLine = chartType === 'line';
  return {
    option: {
      color: colors,
      tooltip: {
        trigger: isLine ? 'axis' : 'item',
        axisPointer: isLine ? { type: 'line', lineStyle: { color: colors[0], width: 1, type: 'dashed' } } : undefined,
        backgroundColor: 'rgba(26,26,46,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: unknown) => {
          const arr = Array.isArray(params) ? params : [params];
          if (arr.length === 0) return '';
          const first = arr[0] as { axisValue?: string; name?: string; value?: number; seriesName?: string; marker?: string };
          const title = first.axisValue ?? first.name ?? '';
          const lines = arr.map((p: { marker?: string; seriesName?: string; value?: number; name?: string }) => {
            const v = typeof p.value === 'number' ? p.value : (p as unknown as { data?: number[] }).data?.[1] ?? 0;
            return `${p.marker ?? ''}${p.seriesName ?? p.name ?? ''}：<b>${v}</b>`;
          });
          return `<b>${title}</b><br/>${lines.join('<br/>')}`;
        },
      },
      grid: { top: 24, left: 48, right: 20, bottom: 36, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: !isLine,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, interval: 0, rotate: labels.length > 8 ? 30 : 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)', type: 'dashed' } },
      },
      series: [
        {
          name: '数值',
          type: chartType,
          data: values.map((v, idx) => (selectedIndex !== null && idx === selectedIndex
            ? { value: v, itemStyle: { shadowBlur: 14, shadowColor: colors[idx % colors.length] } }
            : v)),
          smooth: isLine,
          symbol: isLine ? 'circle' : undefined,
          symbolSize: isLine ? 6 : undefined,
          showSymbol: true,
          lineStyle: isLine ? { width: 2.5, shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.3)' } : undefined,
          areaStyle: isLine
            ? {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: colors[0] + 'AA' },
                    { offset: 1, color: colors[0] + '10' },
                  ],
                },
              }
            : undefined,
          itemStyle: {
            borderRadius: chartType === 'bar' ? [6, 6, 0, 0] : undefined,
            shadowBlur: 4,
            shadowColor: 'rgba(0,0,0,0.25)',
          },
          barMaxWidth: chartType === 'bar' ? 36 : undefined,
          markPoint: selectedIndex !== null
            ? {
                symbol: 'pin',
                symbolSize: 48,
                data: [{ coord: [labels[selectedIndex], values[selectedIndex]], value: values[selectedIndex] }],
                itemStyle: { color: colors[selectedIndex % colors.length] },
                label: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
              }
            : undefined,
          animationDuration,
          animationEasing,
          animationDurationUpdate: 500,
        },
      ],
    },
    stats,
  };
}
