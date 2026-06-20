import { useMemo, useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { MatchComparison, SkillDimension } from '../types';
import { ALL_DIMENSIONS } from '../constants/skillKeywords';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

interface MatchBarChartProps {
  comparisons: MatchComparison[];
  animationKey?: string | number;
}

export function MatchBarChart({ comparisons, animationKey }: MatchBarChartProps) {
  const [key, setKey] = useState(0);
  const warnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const chartEl = useRef<ChartJS<'bar'> | null>(null);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [animationKey]);

  const data = useMemo(() => {
    const resumeScores: number[] = [];
    const baselineScores: number[] = [];
    ALL_DIMENSIONS.forEach((dim) => {
      const c = comparisons.find((x) => x.dimension === dim);
      resumeScores.push(c?.resumeScore ?? 0);
      baselineScores.push(c?.baselineScore ?? 0);
    });

    return {
      labels: ALL_DIMENSIONS as SkillDimension[],
      datasets: [
        {
          type: 'bar' as const,
          label: '当前简历得分',
          data: resumeScores,
          backgroundColor: '#1565C0',
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.55,
          categoryPercentage: 0.7,
          order: 2
        },
        {
          type: 'bar' as const,
          label: '岗位基准线',
          data: baselineScores,
          backgroundColor: 'transparent',
          borderColor: '#BDBDBD',
          borderWidth: 2,
          borderDash: [6, 4],
          borderSkipped: false,
          borderRadius: 4,
          barPercentage: 0.7,
          categoryPercentage: 0.85,
          order: 1,
          pointStyle: false
        }
      ]
    };
  }, [comparisons]);

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: 'easeOutCubic'
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'rect',
            padding: 20,
            font: { size: 12 },
            color: '#546E7A'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(21, 101, 192, 0.95)',
          padding: 10,
          cornerRadius: 6,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          callbacks: {
            afterBody: (items) => {
              if (items.length === 0) return '';
              const label = items[0].label as SkillDimension;
              const c = comparisons.find((x) => x.dimension === label);
              if (!c) return '';
              const diff = c.diffPercent;
              const sign = diff > 0 ? '+' : '';
              const color = diff < -20 ? '⚠️' : diff < 0 ? '▼' : diff === 0 ? '=' : '▲';
              return `\n${color} 差异：${sign}${diff}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 12, weight: '600' },
            color: '#37474F',
            padding: 8
          },
          border: { color: '#E0E0E0' }
        },
        y: {
          min: 0,
          max: 100,
          grid: {
            color: '#E0E0E0',
            lineWidth: 1
          },
          ticks: {
            stepSize: 20,
            font: { size: 11 },
            color: '#78909C',
            padding: 6,
            callback: (val) => `${val}`
          },
          border: { color: '#E0E0E0' },
          title: {
            display: true,
            text: '分数（0~100）',
            color: '#546E7A',
            font: { size: 11 }
          }
        }
      }
    }),
    [comparisons]
  );

  return (
    <div className="chart-card barchart-card" key={key}>
      <h3 className="chart-title">维度对比柱状图</h3>
      <div className="barchart-container">
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {comparisons
            .filter((c) => c.hasWarning)
            .map((c) => {
              const idx = ALL_DIMENSIONS.indexOf(c.dimension);
              return (
                <div
                  key={c.dimension}
                  className="warn-tag"
                  ref={(el) => (warnRefs.current[c.dimension] = el)}
                  style={{
                    left: `${(idx + 0.5) * (100 / ALL_DIMENSIONS.length)}%`
                  }}
                  title={`${c.dimension} 低于岗位基准 ${-c.diffPercent}%`}
                >
                  !
                </div>
              );
            })}
        </div>
        <Bar
          ref={(el) => {
            chartEl.current = el?.chart ?? null;
          }}
          data={data}
          options={options}
        />
      </div>
    </div>
  );
}

export default MatchBarChart;
