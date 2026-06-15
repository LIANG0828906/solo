import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext,
  TooltipItem,
  Tick
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { CrackTimeEstimate } from '../types';

ChartJS.register(
  CategoryScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CrackTimeChartProps {
  data: CrackTimeEstimate[];
}

export const CrackTimeChart: React.FC<CrackTimeChartProps> = ({ data }) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const gradientOffsetRef = useRef(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const animateGradient = () => {
      gradientOffsetRef.current = (gradientOffsetRef.current + 0.005) % 1;
      if (chartRef.current) {
        chartRef.current.update('none');
      }
      animationRef.current = requestAnimationFrame(animateGradient);
    };
    animationRef.current = requestAnimationFrame(animateGradient);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update('none');
    }
  }, [data]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const chartData = {
    labels: data.map(d => d.attackType),
    datasets: [
      {
        label: '破解时间',
        data: data.map(d => Math.max(d.timeSeconds, 1e-6)),
        borderColor: '#00d4ff',
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(0, 212, 255, 0.1)';

          const gradient = ctx.createLinearGradient(
            chartArea.left + gradientOffsetRef.current * chartArea.width,
            chartArea.top,
            chartArea.right - gradientOffsetRef.current * chartArea.width,
            chartArea.bottom
          );
          gradient.addColorStop(0, 'rgba(0, 212, 255, 0.4)');
          gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.2)');
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0.4)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#00d4ff',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#ff6b6b',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeOutQuart' as const
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: '暴力破解时间估算',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 46, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#00d4ff',
        borderColor: '#ff6b6b',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items: TooltipItem<'line'>[]) => `攻击类型: ${items[0].label}`,
          label: (item: TooltipItem<'line'>) => {
            const estimate = data[item.dataIndex];
            return [
              `破解时间: ${estimate.formattedTime}`,
              `秒数: ${estimate.timeSeconds.toExponential(2)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        type: 'logarithmic' as const,
        min: 1e-6,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          },
          callback: function(value: string | number, _index: number, _ticks: Tick[]) {
            const num = Number(value);
            if (num < 1) return '<1s';
            if (num < 60) return Math.round(num) + 's';
            if (num < 3600) return Math.round(num / 60) + 'm';
            if (num < 86400) return Math.round(num / 3600) + 'h';
            if (num < 31536000) return Math.round(num / 86400) + 'd';
            return (num / 31536000).toExponential(1) + 'y';
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        title: {
          display: true,
          text: '破解时间 (对数刻度)',
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div
      className={`chart-card ${isDragging ? 'dragging' : ''}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="chart-drag-handle">
        <span className="drag-dots"></span>
        <span className="drag-dots"></span>
        <span className="drag-dots"></span>
      </div>
      <div className="chart-container">
        {data.length > 0 ? (
          <Line ref={chartRef} data={chartData} options={options} />
        ) : (
          <div className="chart-empty">
            <p>输入密码后显示破解时间估算</p>
          </div>
        )}
      </div>
    </div>
  );
};
