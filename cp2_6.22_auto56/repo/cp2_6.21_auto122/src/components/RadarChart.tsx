import { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
  type Plugin,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { ScoreOutput } from '../utils/scoreCalculator';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarChartProps {
  scores: ScoreOutput | null;
}

const DEFAULT_DATA: ScoreOutput = {
  marketDemand: 50,
  technicalDifficulty: 50,
  investmentCost: 50,
  total: 50,
};

const gradientPlugin: Plugin<'radar'> = {
  id: 'radarGradient',
  beforeRender: (chart) => {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const maxRadius = Math.min(
      (chartArea.right - chartArea.left) / 2,
      (chartArea.bottom - chartArea.top) / 2
    );

    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius
    );
    gradient.addColorStop(0, 'rgba(108, 92, 231, 0.7)');
    gradient.addColorStop(1, 'rgba(253, 121, 168, 0.5)');

    const datasets = chart.data.datasets;
    if (datasets[0]) {
      datasets[0].backgroundColor = gradient;
    }
  },
};

export function RadarChart({ scores }: RadarChartProps) {
  const currentScores = scores || DEFAULT_DATA;

  const data: ChartData<'radar'> = useMemo(
    () => ({
      labels: ['市场需求', '技术可行性', '投资成本'],
      datasets: [
        {
          label: '评估得分',
          data: [
            currentScores.marketDemand,
            currentScores.technicalDifficulty,
            currentScores.investmentCost,
          ],
          backgroundColor: 'rgba(108, 92, 231, 0.4)',
          borderColor: '#fd79a8',
          borderWidth: 2,
          pointBackgroundColor: '#fd79a8',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#fd79a8',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    }),
    [currentScores]
  );

  const options: ChartOptions<'radar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 300,
        easing: 'easeOutQuart',
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          beginAtZero: true,
          ticks: {
            stepSize: 20,
            color: 'rgba(255, 255, 255, 0.5)',
            backdropColor: 'transparent',
            font: {
              size: 11,
            },
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          angleLines: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          pointLabels: {
            color: 'rgba(255, 255, 255, 0.85)',
            font: {
              size: 14,
              weight: 600,
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#16213e',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(108, 92, 231, 0.5)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 13,
            weight: 600,
          },
          bodyFont: {
            size: 12,
          },
        },
      },
    }),
    []
  );

  return (
    <div className="radar-container">
      <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
        <Radar
          data={data}
          options={options}
          plugins={[gradientPlugin]}
        />
        {scores && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6c5ce7, #fd79a8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}
            >
              {scores.total}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              综合得分
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
