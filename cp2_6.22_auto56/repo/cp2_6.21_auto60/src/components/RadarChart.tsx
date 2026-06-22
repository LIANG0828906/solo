import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Plugin,
  ChartOptions,
} from 'chart.js';
import type { RadarDataItem } from '@/types';
import { isNutrientDeficient, isNutrientExcess, getNutrientStatus } from '@/utils/nutritionCalc';
import { useMemo, useEffect, useRef } from 'react';
import { measureRenderTime, startFrameMonitor, logPerformance } from '@/utils/performance';

const NUTRIENT_COLORS: Record<string, { normal: string; deficient: string; excess: string }> = {
  热量: { normal: '#4ecdc4', deficient: '#6c9cf0', excess: '#ff6b6b' },
  蛋白质: { normal: '#4ecdc4', deficient: '#6c9cf0', excess: '#ff6b6b' },
  脂肪: { normal: '#4ecdc4', deficient: '#6c9cf0', excess: '#ff6b6b' },
  碳水化合物: { normal: '#4ecdc4', deficient: '#6c9cf0', excess: '#ff6b6b' },
  膳食纤维: { normal: '#4ecdc4', deficient: '#6c9cf0', excess: '#ff6b6b' },
  钠: { normal: '#4ecdc4', deficient: '#6c9cf0', excess: '#ff6b6b' },
};

const getColor = (label: string, percentage: number): string => {
  const status = getNutrientStatus(percentage);
  const colors = NUTRIENT_COLORS[label] || NUTRIENT_COLORS['热量'];
  return colors[status];
};

const nutritionStatusPlugin: Plugin<'radar'> = {
  id: 'nutritionStatus',
  afterDraw(chart) {
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data) return;

    const data = (chart.config.data as any).datasets?.[0]?.nutritionData as RadarDataItem[] | undefined;
    if (!data) return;

    const time = performance.now();

    meta.data.forEach((point, index) => {
      const item = data[index];
      if (!item) return;

      const isExcess = isNutrientExcess(item.percentage);
      const isDeficient = isNutrientDeficient(item.percentage);

      if (!isExcess && !isDeficient) return;

      const { x, y } = point.getCenterPoint();
      const baseRadius = 6;

      if (isExcess) {
        const pulse = 1 + 0.3 * Math.sin(time / 200);
        const pulseRadius = baseRadius * pulse;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 107, ${0.3 * (0.5 + 0.5 * Math.sin(time / 200))})`;
        ctx.fill();
        ctx.restore();
      }

      if (isDeficient) {
        const blink = 0.4 + 0.6 * Math.abs(Math.sin(time / 300));
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, baseRadius + 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108, 156, 240, ${0.35 * blink})`;
        ctx.fill();
        ctx.restore();
      }
    });

    if ((chart as any)._rafScheduled) return;
    (chart as any)._rafScheduled = true;
    requestAnimationFrame(() => {
      (chart as any)._rafScheduled = false;
      chart.render('none');
    });
  },
};

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  nutritionStatusPlugin
);

interface RadarChartProps {
  data: RadarDataItem[];
}

export default function RadarChart({ data }: RadarChartProps) {
  const chartRef = useRef<any>(null);
  const frameMonitorRef = useRef<ReturnType<typeof startFrameMonitor> | null>(null);

  useEffect(() => {
    frameMonitorRef.current = startFrameMonitor();
    return () => {
      if (frameMonitorRef.current) {
        const { stop } = frameMonitorRef.current();
        stop();
      }
    };
  }, []);

  const chartData = useMemo(() => {
    return measureRenderTime('RadarChart Data Preparation', () => {
      const labels = data.map((d) => d.label);
      const currentValues = data.map((d) => Math.min(d.percentage, 150));
      const recommendedValues = data.map(() => 100);

      const pointBackgroundColors = data.map((d) => getColor(d.label, d.percentage));
      const pointBorderColors = data.map((d) => {
        const status = getNutrientStatus(d.percentage);
        if (status === 'excess') return '#ff3333';
        if (status === 'deficient') return '#3366cc';
        return '#ffffff';
      });
      const pointRadii = data.map((d) => {
        const status = getNutrientStatus(d.percentage);
        if (status === 'excess') return 6;
        if (status === 'deficient') return 5;
        return 4;
      });
      const pointHoverRadii = data.map((d) => {
        const status = getNutrientStatus(d.percentage);
        if (status === 'excess') return 9;
        if (status === 'deficient') return 8;
        return 6;
      });

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
            pointBackgroundColor: pointBackgroundColors,
            pointBorderColor: pointBorderColors,
            pointBorderWidth: 2,
            pointRadius: pointRadii,
            pointHoverRadius: pointHoverRadii,
            nutritionData: data,
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
    });
  }, [data]);

  const options = useMemo(
    (): ChartOptions<'radar'> => ({
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
        nutritionStatus: {},
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
        easing: 'easeOutQuart',
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
          <Radar
            ref={(el) => {
              chartRef.current = el;
            }}
            data={chartData}
            options={options}
          />
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
          const color = getColor(item.label, item.percentage);
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
                color: color,
                fontWeight: 500,
                animation: deficient ? 'pulse-blue 2s ease-in-out infinite' : excess ? 'pulse-red 1.5s ease-in-out infinite' : 'none',
              }}
            >
              {item.label} {item.percentage}%
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(255, 107, 107, 0); }
        }
        @keyframes pulse-blue {
          0%, 100% { box-shadow: 0 0 0 0 rgba(108, 156, 240, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(108, 156, 240, 0); }
        }
      `}</style>
    </div>
  );
}
