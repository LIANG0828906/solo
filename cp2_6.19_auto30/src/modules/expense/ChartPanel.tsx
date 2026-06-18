import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  TooltipItem,
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { ExpenseCategory, categoryLabels, categoryColors } from './store';
import { formatCurrency } from '@/utils/currency';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

interface ChartPanelProps {
  expensesByCategory: { category: ExpenseCategory; amount: number }[];
  dailyExpenses: { date: string; amount: number }[];
  budget: number;
  currency: string;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({
  expensesByCategory,
  dailyExpenses,
  budget,
  currency,
}) => {
  const [animatePie, setAnimatePie] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lineChartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatePie(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const totalAmount = expensesByCategory.reduce((sum, item) => sum + item.amount, 0);

  const pieData = {
    labels: expensesByCategory.map((item) => categoryLabels[item.category]),
    datasets: [
      {
        data: expensesByCategory.map((item) => item.amount),
        backgroundColor: expensesByCategory.map((item) => categoryColors[item.category]),
        borderColor: '#1a1a2e',
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeOutBounce' as const,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#a0aec0',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a0aec0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function (context: TooltipItem<'pie'>) {
            const value = context.raw as number || 0;
            const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : 0;
            return `${context.label}: ${formatCurrency(value, currency)} (${percentage}%)`;
          },
        },
      },
    },
    onHover: (_event: unknown, elements: { index: number }[]) => {
      if (elements.length > 0) {
        setActiveIndex(elements[0].index);
      } else {
        setActiveIndex(null);
      }
    },
  };

  const dailyLabels = dailyExpenses.map((d) => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const cumulativeAmounts = dailyExpenses.reduce<number[]>((acc, d, i) => {
    const prev = i > 0 ? acc[i - 1] : 0;
    acc.push(prev + d.amount);
    return acc;
  }, []);

  const dailyBudget = budget / (dailyExpenses.length || 1);
  const cumulativeBudget = dailyExpenses.map((_, i) => dailyBudget * (i + 1));

  const lineData = {
    labels: dailyLabels,
    datasets: [
      {
        label: '累计花费',
        data: cumulativeAmounts,
        borderColor: '#00d2ff',
        backgroundColor: 'rgba(0, 210, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#00d2ff',
        pointBorderColor: '#1a1a2e',
        pointBorderWidth: 2,
      },
      {
        label: '预算曲线',
        data: cumulativeBudget,
        borderColor: '#ff6b6b',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: {
      duration: 600,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#a0aec0',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a0aec0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function (context: { dataset?: { label?: string }; raw?: number }) {
            const value = context.raw || 0;
            return `${context.dataset?.label}: ${formatCurrency(value, currency)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#718096',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#718096',
          font: {
            size: 11,
          },
          callback: function (value: string | number) {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (numValue >= 10000) {
              return (numValue / 1000).toFixed(0) + 'k';
            }
            return numValue.toString();
          },
        },
      },
    },
  };

  return (
    <div>
      <div className="chart-container">
        <h3 className="section-title">类别占比</h3>
        <div style={{ height: '240px', position: 'relative' }}>
          {animatePie && totalAmount > 0 && (
            <Pie data={pieData} options={pieOptions} />
          )}
          {totalAmount === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              暂无数据
            </div>
          )}
        </div>
        <div style={{ marginTop: '16px' }}>
          {expensesByCategory.map((item, index) => (
            <div
              key={item.category}
              className="flex justify-between items-center"
              style={{
                marginBottom: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.3s ease-out',
                backgroundColor: activeIndex === index ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div className="flex items-center gap-sm">
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: categoryColors[item.category],
                  }}
                />
                <span style={{ fontSize: '13px' }}>{categoryLabels[item.category]}</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>
                {formatCurrency(item.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <h3 className="section-title">预算趋势</h3>
        <div style={{ height: '240px', position: 'relative' }}>
          <Line
            ref={lineChartRef}
            data={lineData}
            options={lineOptions}
          />
          {crosshair && (
            <div
              style={{
                position: 'absolute',
                top: crosshair.y,
                left: crosshair.x,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '1px',
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
