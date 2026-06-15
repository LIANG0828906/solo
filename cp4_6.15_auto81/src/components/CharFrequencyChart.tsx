import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScriptableContext,
  TooltipItem
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { CharFrequency } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CharFrequencyChartProps {
  data: CharFrequency[];
  onDragStart?: () => void;
}

export const CharFrequencyChart: React.FC<CharFrequencyChartProps> = ({ data }) => {
  const chartRef = useRef<ChartJS<'bar'>>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

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
    labels: data.map(d => d.char === ' ' ? '空格' : d.char),
    datasets: [
      {
        label: '出现次数',
        data: data.map(d => d.count),
        backgroundColor: (context: ScriptableContext<'bar'>) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#00d4ff';
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, '#00d4ff');
          gradient.addColorStop(1, '#a855f7');
          return gradient;
        },
        borderRadius: 6,
        borderSkipped: false,
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
        text: '字符频率分布',
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
        borderColor: '#00d4ff',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items: TooltipItem<'bar'>[]) => `字符: "${items[0].label}"`,
          label: (item: TooltipItem<'bar'>) => {
            const freq = data[item.dataIndex];
            return [
              `出现次数: ${freq.count}`,
              `占比: ${freq.percentage}%`
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
            size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          stepSize: 1,
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        title: {
          display: true,
          text: '出现次数',
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
          <Bar ref={chartRef} data={chartData} options={options} />
        ) : (
          <div className="chart-empty">
            <p>输入密码后显示字符频率分布</p>
          </div>
        )}
      </div>
    </div>
  );
};
