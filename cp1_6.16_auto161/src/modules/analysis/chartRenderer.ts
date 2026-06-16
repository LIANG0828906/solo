import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration,
} from 'chart.js';
import type { AberrationData } from '../../types/optical';
import { FIELD_ANGLES } from './aberrationAnalyzer';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

export type AberrationChart = Chart<'line', number[], string>;

export function createChart(canvasRef: HTMLCanvasElement): AberrationChart {
  const labels = FIELD_ANGLES.map(f => `${f}°`);
  const zeroData = FIELD_ANGLES.map(() => 0);

  const config: ChartConfiguration<'line', number[], string> = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '球差',
          data: zeroData,
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#FF6B6B',
          tension: 0.35,
          fill: true,
        },
        {
          label: '彗差',
          data: zeroData,
          borderColor: '#4ECDC4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#4ECDC4',
          tension: 0.35,
          fill: true,
        },
        {
          label: '色差',
          data: zeroData,
          borderColor: '#45B7D1',
          backgroundColor: 'rgba(69, 183, 209, 0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#45B7D1',
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: 'easeInOutCubic',
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#E0E0E0',
            usePointStyle: true,
            padding: 16,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(42, 42, 53, 0.95)',
          titleColor: '#E0E0E0',
          bodyColor: '#E0E0E0',
          borderColor: '#3A3A45',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(4)} mm`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '视场角度 (°)',
            color: '#A0A0B0',
            font: {
              size: 13,
              weight: 'bold',
            },
          },
          ticks: {
            color: '#A0A0B0',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
        },
        y: {
          title: {
            display: true,
            text: '偏离主光轴距离 (mm)',
            color: '#A0A0B0',
            font: {
              size: 13,
              weight: 'bold',
            },
          },
          ticks: {
            color: '#A0A0B0',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
          beginAtZero: true,
        },
      },
    },
  };

  return new Chart(canvasRef, config);
}

export function updateChart(chart: AberrationChart, aberrationData: AberrationData): void {
  const { datasets } = chart.data;
  if (datasets.length >= 3) {
    datasets[0]!.data = aberrationData.spherical.map(s => s.aberration);
    datasets[1]!.data = aberrationData.coma.map(c => c.aberration);
    datasets[2]!.data = aberrationData.chromatic.map(c => c.aberration);
  }
  chart.update('none');
}

export function updateMetrics(element: HTMLElement, aberrationData: AberrationData): void {
  const rmsEl = element.querySelector('[data-metric="rms"]');
  const strehlEl = element.querySelector('[data-metric="strehl"]');

  if (rmsEl) {
    rmsEl.textContent = `${aberrationData.rmsWavefrontError.toFixed(4)} λ`;
  }
  if (strehlEl) {
    const percentage = (aberrationData.strehlRatio * 100).toFixed(1);
    strehlEl.textContent = `${aberrationData.strehlRatio.toFixed(4)} (${percentage}%)`;
  }
}
