import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { TrendItem, TagStat } from '../api/emotionAPI';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend
);

interface TrendChartProps {
  data: TrendItem[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const labels = data.map(d => d.date.slice(5));

  const lineData = {
    labels,
    datasets: [
      {
        label: '情绪强度',
        data: data.map(d => d.avg_intensity),
        borderColor: '#ff5e62',
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return '#ff9966';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, '#ff9966');
          gradient.addColorStop(1, '#ff5e62');
          return gradient;
        },
        tension: 0.4,
        fill: false,
        pointBackgroundColor: '#ff5e62',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const barData = {
    labels,
    datasets: [
      {
        label: '精力值',
        data: data.map(d => d.avg_energy),
        backgroundColor: '#4fc3f780',
        borderColor: '#4fc3f7',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#5c4a6e',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        padding: 10,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        grid: { color: '#f0ecf4' },
        ticks: { color: '#9e8fb5', font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9e8fb5', font: { size: 11 } },
      },
    },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="form-label" style={{ marginBottom: 8 }}>情绪强度趋势</div>
        <Line data={lineData} options={commonOptions as any} />
      </div>
      <div>
        <div className="form-label" style={{ marginBottom: 8 }}>精力水平</div>
        <Bar data={barData} options={commonOptions as any} />
      </div>
    </div>
  );
};

interface RadarChartProps {
  tagStats: TagStat[];
}

const ALL_TAGS = ['工作加班', '运动健身', '朋友聚会', '深夜失眠', '阅读学习', '旅行出游'];

export const RadarChart: React.FC<RadarChartProps> = ({ tagStats }) => {
  const tagMap = new Map(tagStats.map(t => [t.tag, t.avg_intensity]));
  const values = ALL_TAGS.map(tag => tagMap.get(tag) ?? 0);

  const radarData = {
    labels: ALL_TAGS,
    datasets: [
      {
        label: '平均情绪指数',
        data: values,
        backgroundColor: '#8e24aa40',
        borderColor: '#ab47bc',
        borderWidth: 2,
        pointBackgroundColor: '#8e24aa',
        pointBorderColor: '#ab47bc',
        pointRadius: 4,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#5c4a6e',
        cornerRadius: 8,
      },
    },
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, color: '#9e8fb5', backdropColor: 'transparent' },
        grid: { color: '#e0d6e8' },
        pointLabels: { color: '#5c4a6e', font: { size: 12 } },
        angleLines: { color: '#e0d6e8' },
      },
    },
  };

  return (
    <div className="radar-chart-container">
      <Radar data={radarData} options={radarOptions as any} />
    </div>
  );
};
