import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { RadarDataItem } from '@/types';
import { isNutrientDeficient, isNutrientExcess } from '@/utils/nutritionCalc';
import { useMemo } from 'react';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  data: RadarDataItem[];
}

export default function RadarChart({ data }: RadarChartProps) {
  const chartData = useMemo(() => {
    const labels = data.map((d) => d.label);
    const currentValues = data.map((d) => Math.min(d.percentage, 150));
    const recommendedValues = data.map(() => 100);

    const hasDeficiency = data.some((d) => isNutrientDeficient(d.percentage));
    const hasExcess = data.some((d) => isNutrientExcess(d.percentage));

    let bgColor = 'rgba(78, 205, 196, 0.2)';
    let borderColor = '#4ecdc4';

    if (hasExcess) {
      bgColor = 'rgba(255, 107, 107, 0.25)';
      borderColor = '#ff6b6b';
    } else if (hasDeficiency) {
      bgColor = 'rgba(108, 156, 240, 0.25)';
      borderColor = '#6c9cf0';
    }

    return {
      labels,
      datasets: [
        {
          label: '当前摄入',
          data: currentValues,
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 2,
          pointBackgroundColor: borderColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: '推荐值',
          data: recommendedValues,
          backgroundColor: 'rgba(200, 200, 200, 0.1)',
          borderColor: 'rgba(200, 200, 200, 0.5)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const idx = context.dataIndex;
              const item = data[idx];
              if (context.datasetIndex === 0) {
                return [
                  `当前: ${item.current}${item.label === '热量' ? 'kcal' : item.label === '钠' ? 'mg' : 'g'}`,
                  `占推荐: ${item.percentage}%`,
                ];
              }
              return `推荐: ${item.recommended}${item.label === '热量' ? 'kcal' : item.label === '钠' ? 'mg' : 'g'}`;
            },
          },
        },
      },
      scales: {
        r: {
          min: 0,
          max: 150,
          ticks: {
            stepSize: 50,
            font: {
              size: 10,
            },
            color: '#888',
            backdropColor: 'transparent',
            callback: (value: any) => `${value}%`,
          },
          pointLabels: {
            font: {
              size: 12,
            },
            color: '#5a6c68',
          },
          grid: {
            color: 'rgba(78, 205, 196, 0.1)',
          },
          angleLines: {
            color: 'rgba(78, 205, 196, 0.1)',
          },
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart' as const,
      },
    }),
    [data]
  );

  const hasData = data.some((d) => d.current > 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
        营养雷达图
      </h3>
      <div style={{ flex: 1, minHeight: '200px' }}>
        {hasData ? (
          <Radar data={chartData} options={options} />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            暂无数据
          </div>
        )}
      </div>
      <div style={{ marginTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {data.map((item, idx) => {
          const deficient = isNutrientDeficient(item.percentage);
          const excess = isNutrientExcess(item.percentage);
          return (
            <div
              key={idx}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: excess
                  ? 'rgba(255, 107, 107, 0.15)'
                  : deficient
                  ? 'rgba(108, 156, 240, 0.15)'
                  : 'rgba(78, 205, 196, 0.1)',
                color: excess
                  ? '#ff6b6b'
                  : deficient
                  ? '#6c9cf0'
                  : '#2a9d8f',
                fontWeight: 500,
                animation: deficient ? 'pulse-blue 2s ease-in-out infinite' : 'none',
              }}
            >
              {item.label} {item.percentage}%
            </div>
          );
        })}
      </div>
    </div>
  );
}
