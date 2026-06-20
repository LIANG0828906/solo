import { useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { SkillScores, SkillDimension } from '../types';
import { ALL_DIMENSIONS } from '../constants/skillKeywords';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SkillRadarProps {
  scores: SkillScores;
  animationKey?: string | number;
}

export function SkillRadar({ scores, animationKey }: SkillRadarProps) {
  const chartRef = useRef<ChartJS<'radar'> | null>(null);
  const animProgress = useRef(0);
  const animStart = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const data = useMemo(() => {
    const values = ALL_DIMENSIONS.map((d) => scores[d]);
    return {
      labels: ALL_DIMENSIONS as SkillDimension[],
      datasets: [
        {
          label: '技能评分',
          data: values,
          backgroundColor: 'rgba(144, 202, 249, 0.31)',
          borderColor: '#1565C0',
          borderWidth: 2,
          pointBackgroundColor: '#1565C0',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#42A5F5'
        }
      ]
    };
  }, [scores]);

  const options: ChartOptions<'radar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 900,
        easing: 'easeOutQuart',
        onProgress: (anim) => {
          animProgress.current = anim.currentStep / Math.max(1, anim.numSteps);
          const chart = chartRef.current;
          if (!chart) return;
          const dataset = chart.data.datasets[0];
          const p = animProgress.current;
          const baseVals = ALL_DIMENSIONS.map((d) => scores[d]);
          dataset.data = baseVals.map((v, i) => {
            const delay = i * 0.08;
            const t = Math.max(0, Math.min(1, (p - delay) / Math.max(0.001, 1 - delay)));
            const eased = 1 - Math.pow(1 - t, 3);
            return Math.round(eased * v);
          });
          if (!animStart.current) animStart.current = performance.now();
          chart.update('none');
        },
        onComplete: () => {
          animProgress.current = 1;
          const chart = chartRef.current;
          if (chart) {
            chart.data.datasets[0].data = ALL_DIMENSIONS.map((d) => scores[d]);
            chart.update('none');
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(21, 101, 192, 0.95)',
          padding: 10,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          cornerRadius: 6,
          callbacks: {
            label: (ctx) => ` 得分：${ctx.parsed.r} 分`
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          beginAtZero: true,
          angleLines: {
            color: '#E0E0E0',
            lineWidth: 1
          },
          grid: {
            color: '#E0E0E0',
            lineWidth: 1,
            circular: true
          },
          pointLabels: {
            color: '#37474F',
            font: { size: 13, weight: '600' },
            padding: 12
          },
          ticks: {
            stepSize: 25,
            backdropColor: 'rgba(255, 255, 255, 0.56)',
            color: '#78909C',
            font: { size: 10 },
            padding: 4,
            z: 10,
            showLabelBackdrop: true
          }
        }
      }
    }),
    [scores]
  );

  return (
    <div className="chart-card" key={animationKey}>
      <h3 className="chart-title">技能维度雷达图</h3>
      <div className="radar-container">
        <Radar
          ref={(el) => {
            chartRef.current = el?.chart ?? null;
            animProgress.current = 0;
            animStart.current = 0;
          }}
          data={data}
          options={options}
        />
      </div>
    </div>
  );
}

export default SkillRadar;
