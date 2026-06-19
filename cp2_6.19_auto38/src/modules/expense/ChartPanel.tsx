import React, { useRef, useMemo, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import type { Expense } from './types';
import { CATEGORY_CLASS_MAP, CATEGORY_ICONS } from './types';
import { formatCurrency } from '@/utils/currency';
import { CURRENCY_SYMBOLS } from '../trip/types';
import type { CurrencyCode } from '../trip/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartPanelProps {
  expenses: Expense[];
  budget: number;
  currency: CurrencyCode;
  cumulativeData: { date: string; amount: number }[];
  categoryTotals: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  '交通': '#00d2ff',
  '住宿': '#48bb78',
  '餐饮': '#ed8936',
  '景点': '#9f7aea',
  '购物': '#ff6b6b',
};

const CATEGORY_HOVER_COLORS: Record<string, string> = {
  '交通': '#33ddff',
  '住宿': '#68c991',
  '餐饮': '#f0a05a',
  '景点': '#b292ee',
  '购物': '#ff8585',
};

export const ChartPanel: React.FC<ChartPanelProps> = ({
  expenses,
  budget,
  currency,
  cumulativeData,
  categoryTotals,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const pieChartRef = useRef<ChartJS<'pie'>>(null);
  const lineChartRef = useRef<ChartJS<'line'>>(null);
  
  const symbol = CURRENCY_SYMBOLS[currency];
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const pieData: ChartData<'pie'> = useMemo(() => {
    const categories = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);
    
    return {
      labels: categories.map((c) => `${CATEGORY_ICONS[c as keyof typeof CATEGORY_ICONS]} ${c}`),
      datasets: [
        {
          data: values,
          backgroundColor: categories.map((c) => CATEGORY_COLORS[c]),
          hoverBackgroundColor: categories.map((c) => CATEGORY_HOVER_COLORS[c]),
          borderWidth: 0,
          hoverOffset: 10,
        },
      ],
    };
  }, [categoryTotals]);
  
  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeOutElastic',
    },
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: '#a0aec0',
          padding: 12,
          font: {
            size: 12,
            family: 'Inter',
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
        onClick: (_e, legendItem) => {
          const category = legendItem.text?.split(' ')[1] || null;
          setActiveCategory((prev) => (prev === category ? null : category));
        },
      },
      tooltip: {
        backgroundColor: 'rgba(22, 33, 62, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a0aec0',
        borderColor: 'rgba(0, 210, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` ${formatCurrency(value, currency)} (${percentage}%)`;
          },
        },
      },
    },
    onHover: (_e, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const category = Object.keys(categoryTotals)[index];
        setActiveCategory(category);
      }
    },
  };
  
  const lineData: ChartData<'line'> = useMemo(() => {
    const labels = cumulativeData.map((d) => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const expensesData = cumulativeData.map((d) => d.amount);
    const budgetLine = cumulativeData.map(() => budget);
    const dailyBudget = cumulativeData.map((_, i) => {
      const days = cumulativeData.length;
      return Math.round((budget / days) * (i + 1));
    });
    
    return {
      labels,
      datasets: [
        {
          label: '实际花费',
          data: expensesData,
          borderColor: '#00d2ff',
          backgroundColor: 'rgba(0, 210, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#00d2ff',
          pointBorderColor: '#1a1a2e',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#00d2ff',
          pointHoverBorderWidth: 3,
        },
        {
          label: '累计预算',
          data: dailyBudget,
          borderColor: '#48bb78',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#48bb78',
        },
        {
          label: '总预算',
          data: budgetLine,
          borderColor: '#ff6b6b',
          borderDash: [10, 5],
          fill: false,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    };
  }, [cumulativeData, budget]);
  
  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#a0aec0',
          padding: 16,
          font: {
            size: 12,
            family: 'Inter',
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(22, 33, 62, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a0aec0',
        borderColor: 'rgba(0, 210, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const yValue = context.parsed.y ?? 0;
            return ` ${context.dataset.label}: ${symbol}${yValue.toLocaleString()}`;
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
            family: 'Inter',
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
            family: 'Inter',
          },
          callback: (value) => {
            const num = value as number;
            if (num >= 10000) {
              return `${symbol}${(num / 10000).toFixed(1)}w`;
            }
            return `${symbol}${num}`;
          },
        },
      },
    },
    hover: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };
  
  useEffect(() => {
    if (pieChartRef.current) {
      pieChartRef.current.update('active');
    }
  }, [activeCategory]);
  
  return (
    <div className="space-y-6">
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-4">开销类别分布</h3>
        <div className="chart-wrapper" style={{ height: '280px' }}>
          <Pie ref={pieChartRef} data={pieData} options={pieOptions} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(categoryTotals).map(([category, amount]) => (
            <div
              key={category}
              className={`category-tag ${CATEGORY_CLASS_MAP[category as keyof typeof CATEGORY_CLASS_MAP]} cursor-pointer transition-all ${
                activeCategory === category ? 'ring-2 ring-offset-2 ring-offset-[#1a1a2e]' : ''
              }`}
              style={{
                boxShadow: activeCategory === category ? `0 0 10px ${CATEGORY_COLORS[category]}40` : 'none',
                transform: activeCategory === category ? 'scale(1.05)' : 'scale(1)',
              }}
              onClick={() => setActiveCategory((prev) => (prev === category ? null : category))}
            >
              {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]} {category}:{' '}
              {formatCurrency(amount, currency)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-4">预算与花费趋势</h3>
        <div className="chart-wrapper" style={{ height: '300px' }}>
          <Line ref={lineChartRef} data={lineData} options={lineOptions} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-muted">总预算</div>
            <div className="text-lg font-semibold text-cyan">
              {symbol}{budget.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted">已花费</div>
            <div className="text-lg font-semibold">
              {symbol}{total.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted">剩余</div>
            <div className={`text-lg font-semibold ${budget - total < 0 ? 'text-orange' : ''}`}>
              {symbol}{(budget - total).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;
