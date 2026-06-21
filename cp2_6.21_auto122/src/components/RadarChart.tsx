import { useEffect, useRef } from 'react';
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

export function RadarChart({ scores }: RadarChartProps) {
  const chartRef = useRef<ChartJS<'radar'>>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 400, 400);
    gradient.addColorStop(0, 'rgba(108, 92, 231, 0.6)');
    gradient.addColorStop(1, 'rgba(253, 121, 168, 0.6)');

    if (chartRef.current) {
      const datasets = chartRef.current.data.datasets;
      if (datasets[0]) {
        (datasets[0] as ChartJS<'radar'>['data']['datasets'][0]).backgroundColor = gradient;
      }
    }
  }, [scores]);

  const currentScores = scores || DEFAULT_DATA;

  const data: ChartData<'radar'> = {
    labels: ['市场需求', '技术可行性', '投资成本'],
    datasets: [
      {
        label: '评估得分',
        data: [currentScores.marketDemand, currentScores.technicalDifficulty, currentScores.investmentCost],
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
  };

  const options: ChartOptions<'radar'> = {
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
  };

  return (
    <div className="radar-container">
      <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
        <Radar ref={chartRef} data={data} options={options} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
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
            <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 }}>
              综合得分
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
