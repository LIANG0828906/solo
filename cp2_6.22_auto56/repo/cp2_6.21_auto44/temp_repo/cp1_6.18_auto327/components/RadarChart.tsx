'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { RadarPoint, TrendPoint } from '@/lib/flavorAnalyzer';
import { getFlavorTrend } from '@/lib/flavorAnalyzer';
import type { RecordLike } from '@/lib/flavorAnalyzer';

interface RadarChartProps {
  data: RadarPoint[];
  records?: RecordLike[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RadarChart({ data, records = [], size = 'lg', className = '' }: RadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [hoveredFlavor, setHoveredFlavor] = useState<string | null>(null);

  const sizeConfig = {
    sm: { radius: '55%', center: ['50%', '52%'] },
    md: { radius: '65%', center: ['50%', '52%'] },
    lg: { radius: '70%', center: ['50%', '52%'] },
  };

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const chart = echarts.init(chartRef.current, undefined, {
      renderer: 'canvas',
    });
    chartInstanceRef.current = chart;

    const indicators = data.map((d) => ({
      name: d.flavor,
      max: 100,
      color: '#E0E0E0',
    }));

    const values = data.map((d) => d.intensity);
    const colors = data.map((d) => d.color || '#FFD700');

    const option: echarts.EChartsOption = {
      animationDuration: 1200,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(22, 33, 62, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        textStyle: {
          color: '#E0E0E0',
          fontSize: 13,
        },
        formatter: (params: any) => {
          const idx = params.dataIndex ?? 0;
          const point = data[idx] || data[0];
          if (!point) return '';
          const trend = records ? getFlavorTrend(records, point.flavor) : [];
          let trendHtml = '';
          if (trend.length > 0) {
            const avg = (trend.reduce((s, t) => s + t.rating, 0) / trend.length).toFixed(1);
            trendHtml = `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);font-size:11px;color:rgba(224,224,224,0.6)">
              平均评分: <b style="color:#FFD700">${avg}</b> / 共${trend.length}次
            </div>`;
          }
          return `<div style="padding:4px">
            <div style="font-weight:600;font-size:14px;color:${point.color || '#FFD700'};margin-bottom:4px">
              ${point.flavor}
            </div>
            <div>强度: <b style="color:#fff">${point.intensity}</b> / 100</div>
            ${trendHtml}
          </div>`;
        },
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        radius: sizeConfig[size].radius,
        center: sizeConfig[size].center,
        axisName: {
          color: '#E0E0E0',
          fontSize: size === 'sm' ? 10 : 13,
          fontWeight: 500,
          ...(size === 'sm' ? {} : {
            formatter: (value: string) => `{a|${value}}`,
            rich: {
              a: {
                color: '#E0E0E0',
                fontSize: 13,
                fontWeight: 500,
                padding: [0, 0, 8, 0],
              },
            },
          }),
        },
        splitArea: {
          areaStyle: {
            color: [
              'rgba(255, 255, 255, 0.015)',
              'rgba(255, 255, 255, 0.03)',
              'rgba(255, 255, 255, 0.015)',
              'rgba(255, 255, 255, 0.03)',
            ],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.12)',
          },
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.08)',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: '风味强度',
          type: 'radar',
          symbol: 'circle',
          symbolSize: size === 'sm' ? 6 : 8,
          lineStyle: {
            width: 2.5,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
              { offset: 0, color: '#FFD700' },
              { offset: 1, color: '#FF6347' },
            ]),
            shadowColor: 'rgba(255, 140, 0, 0.5)',
            shadowBlur: 10,
          },
          itemStyle: {
            color: '#FFD700',
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(255, 215, 0, 0.6)',
            shadowBlur: 8,
          },
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
              { offset: 0, color: 'rgba(255, 215, 0, 0.45)' },
              { offset: 0.5, color: 'rgba(255, 140, 0, 0.28)' },
              { offset: 1, color: 'rgba(255, 99, 71, 0.15)' },
            ]),
          },
          data: [
            {
              value: values,
              name: '风味档案',
            },
          ],
        },
      ],
    };

    chart.setOption(option);

    chart.on('mouseover', { seriesType: 'radar' }, (params: any) => {
      if (params.name && typeof params.name === 'string') {
        setHoveredFlavor(params.name);
      }
    });

    chart.on('mouseout', () => {
      setHoveredFlavor(null);
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [JSON.stringify(data), size, records.length]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={chartRef}
        className="radar-expand w-full"
        style={{
          height: size === 'sm' ? '150px' : size === 'md' ? '320px' : '400px',
        }}
      />
      {hoveredFlavor && size !== 'sm' && records && (
        <MiniTrendChart
          flavor={hoveredFlavor}
          records={records}
        />
      )}
    </div>
  );
}

function MiniTrendChart({ flavor, records }: { flavor: string; records: RecordLike[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const trend = getFlavorTrend(records, flavor);

  useEffect(() => {
    if (!ref.current || trend.length === 0) return;

    const chart = echarts.init(ref.current);
    chart.setOption({
      grid: { left: 28, right: 8, top: 8, bottom: 20 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(22, 33, 62, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#E0E0E0', fontSize: 11 },
      },
      xAxis: {
        type: 'category',
        data: trend.map((t) => t.date.slice(5)),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        axisLabel: { color: 'rgba(224,224,224,0.6)', fontSize: 9 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 5,
        interval: 1,
        axisLine: { show: false },
        axisLabel: { color: 'rgba(224,224,224,0.6)', fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      series: [
        {
          type: 'line',
          data: trend.map((t) => t.rating),
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: {
            width: 2,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#FFD700' },
              { offset: 1, color: '#FF6347' },
            ]),
          },
          itemStyle: { color: '#FFD700' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 215, 0, 0.35)' },
              { offset: 1, color: 'rgba(255, 215, 0, 0.02)' },
            ]),
          },
        },
      ],
    });
    return () => chart.dispose();
  }, [flavor, trend.length]);

  if (trend.length < 2) return null;

  return (
    <div className="absolute top-2 right-2 glass-card p-3 w-[220px] z-10 animate-fade-in">
      <div className="text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
        {flavor} · 评分趋势
      </div>
      <div ref={ref} style={{ height: '90px' }} />
    </div>
  );
}
