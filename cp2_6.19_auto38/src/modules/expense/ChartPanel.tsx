import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
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
  type Plugin,
  type ChartEvent,
  type ActiveElement,
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

interface CrosshairState {
  x: number | null;
  y: number | null;
  xValue: string | null;
  yValue: number | null;
  visible: boolean;
}

const crosshairPlugin: Plugin<'line', CrosshairState> = {
  id: 'crosshair',
  beforeInit: (chart) => {
    chart.crosshair = {
      x: null,
      y: null,
      xValue: null,
      yValue: null,
      visible: false,
    };
  },
  afterEvent: (chart, args: { event: ChartEvent; replay: boolean; changed: boolean; cancelable: boolean }) => {
    const { event } = args;
    const crosshair = chart.crosshair;
    
    if (event.type === 'mousemove' && event.x !== undefined && event.y !== undefined) {
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      
      if (xAxis && yAxis) {
        const xValue = xAxis.getValueForPixel(event.x);
        const yValue = yAxis.getValueForPixel(event.y);
        
        if (xValue !== undefined && yValue !== undefined) {
          crosshair.x = event.x;
          crosshair.y = event.y;
          crosshair.xValue = xAxis.getLabelForValue(Math.round(xValue)) || null;
          crosshair.yValue = Math.round(yValue);
          crosshair.visible = true;
          args.changed = true;
        }
      }
    } else if (event.type === 'mouseout') {
      crosshair.visible = false;
      crosshair.x = null;
      crosshair.y = null;
      args.changed = true;
    }
  },
  afterDatasetsDraw: (chart) => {
    const { ctx, chartArea } = chart;
    const crosshair = chart.crosshair;
    
    if (!crosshair.visible || !crosshair.x || !crosshair.y || !chartArea) {
      return;
    }
    
    ctx.save();
    
    ctx.beginPath();
    ctx.moveTo(crosshair.x, chartArea.top);
    ctx.lineTo(crosshair.x, chartArea.bottom);
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(chartArea.left, crosshair.y);
    ctx.lineTo(chartArea.right, crosshair.y);
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    if (crosshair.xValue) {
      const xLabel = crosshair.xValue;
      ctx.font = '11px Inter, sans-serif';
      const textWidth = ctx.measureText(xLabel).width;
      
      ctx.fillStyle = 'rgba(0, 210, 255, 0.9)';
      ctx.fillRect(
        crosshair.x - textWidth / 2 - 8,
        chartArea.bottom - 24,
        textWidth + 16,
        22
      );
      
      ctx.fillStyle = '#1a1a2e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(xLabel, crosshair.x, chartArea.bottom - 13);
    }
    
    if (crosshair.yValue !== null) {
      const yLabel = `¥${crosshair.yValue.toLocaleString()}`;
      ctx.font = '11px Inter, sans-serif';
      const textWidth = ctx.measureText(yLabel).width;
      
      ctx.fillStyle = 'rgba(255, 107, 107, 0.9)';
      ctx.fillRect(
        chartArea.right,
        crosshair.y - 11,
        textWidth + 16,
        22
      );
      
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(yLabel, chartArea.right + 8, crosshair.y);
    }
    
    ctx.beginPath();
    ctx.arc(crosshair.x, crosshair.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 210, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  },
};

interface PieAnimationState {
  progress: number;
  animating: boolean;
}

const pieAnimationPlugin: Plugin<'pie', PieAnimationState> = {
  id: 'pieAnimation',
  beforeInit: (chart) => {
    chart.pieAnimState = {
      progress: 0,
      animating: false,
    };
  },
  beforeUpdate: (chart, args) => {
    if (args.mode === 'default' || args.mode === 'active') {
      chart.pieAnimState.animating = true;
      chart.pieAnimState.progress = 0;
      
      const startTime = performance.now();
      const duration = 800;
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        chart.pieAnimState.progress = easeProgress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          chart.pieAnimState.animating = false;
        }
      };
      
      requestAnimationFrame(animate);
    }
  },
  beforeDatasetDraw: (chart) => {
    const { ctx } = chart;
    const state = chart.pieAnimState;
    
    if (state.animating && state.progress < 1) {
      ctx.save();
      const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
      const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((state.progress - 1) * Math.PI * 2);
      ctx.scale(state.progress, state.progress);
      ctx.translate(-centerX, -centerY);
    }
  },
  afterDatasetDraw: (chart) => {
    const { ctx } = chart;
    const state = chart.pieAnimState;
    
    if (state.animating && state.progress < 1) {
      ctx.restore();
    }
  },
};

declare module 'chart.js' {
  interface ChartCustomProperties {
    crosshair: CrosshairState;
    pieAnimState: PieAnimationState;
  }
}

const ChartPanel: React.FC<ChartPanelProps> = ({
  expenses,
  budget,
  currency,
  cumulativeData,
  categoryTotals,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const pieChartRef = useRef<ChartJS<'pie'>>(null);
  const lineChartRef = useRef<ChartJS<'line'>>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  const symbol = CURRENCY_SYMBOLS[currency];
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  const triggerPieAnimation = useCallback(() => {
    setAnimationKey((prev) => prev + 1);
  }, []);
  
  const handlePieLegendClick = useCallback((category: string) => {
    setActiveCategory((prev) => (prev === category ? null : category));
    triggerPieAnimation();
  }, [triggerPieAnimation]);
  
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
          hoverOffset: 15,
          borderColor: '#1a1a2e',
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [categoryTotals]);
  
  const pieOptions: ChartOptions<'pie'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeOutElastic',
    },
    animationFrameRate: 60,
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
          if (category) {
            handlePieLegendClick(category);
          }
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
    onHover: (_e, elements: ActiveElement[]) => {
      if (elements.length > 0 && pieChartRef.current) {
        const index = elements[0].index;
        const category = Object.keys(categoryTotals)[index];
        if (category && category !== activeCategory) {
          setActiveCategory(category);
        }
      }
    },
  }), [currency, total, categoryTotals, activeCategory, handlePieLegendClick]);
  
  const lineData: ChartData<'line'> = useMemo(() => {
    const labels = cumulativeData.map((d) => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const expensesData = cumulativeData.map((d) => d.amount);
    const budgetLine = cumulativeData.map(() => budget);
    const dailyBudget = cumulativeData.map((_, i) => {
      const days = cumulativeData.length || 1;
      return Math.round((budget / days) * (i + 1));
    });
    
    return {
      labels,
      datasets: [
        {
          label: '实际花费',
          data: expensesData,
          borderColor: '#00d2ff',
          backgroundColor: 'rgba(0, 210, 255, 0.15)',
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
          borderWidth: 2,
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
          borderWidth: 2,
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
          borderWidth: 2,
        },
      ],
    };
  }, [cumulativeData, budget]);
  
  const lineOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: 'easeOutQuart',
    },
    animationFrameRate: 60,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      crosshair: {},
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
          drawBorder: false,
        },
        ticks: {
          color: '#718096',
          font: {
            size: 11,
            family: 'Inter',
          },
          maxRotation: 0,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
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
      mode: 'index',
      axis: 'x',
      intersect: false,
    },
    elements: {
      line: {
        spanGaps: true,
      },
    },
  }), [symbol]);
  
  useEffect(() => {
    const updateCharts = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= 33) {
        if (pieChartRef.current) {
          pieChartRef.current.update('none');
        }
        if (lineChartRef.current) {
          lineChartRef.current.update('none');
        }
        lastUpdateRef.current = timestamp;
      }
      animationFrameRef.current = requestAnimationFrame(updateCharts);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateCharts);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="chart-container animate-fade-in-up stagger-1">
        <h3 className="text-lg font-semibold mb-4">开销类别分布</h3>
        <div className="chart-wrapper" style={{ height: '280px' }}>
          <Pie
            key={animationKey}
            ref={pieChartRef}
            data={pieData}
            options={pieOptions}
            plugins={[pieAnimationPlugin]}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(categoryTotals).map(([category, amount], index) => (
            <div
              key={category}
              className={`category-tag ${CATEGORY_CLASS_MAP[category as keyof typeof CATEGORY_CLASS_MAP]} cursor-pointer transition-all ${
                activeCategory === category ? 'ring-2 ring-offset-2 ring-offset-[#1a1a2e]' : ''
              }`}
              style={{
                boxShadow: activeCategory === category ? `0 0 15px ${CATEGORY_COLORS[category]}60` : 'none',
                transform: activeCategory === category ? 'scale(1.08)' : 'scale(1)',
                animationDelay: `${index * 50}ms`,
              }}
              onClick={() => handlePieLegendClick(category)}
            >
              {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]} {category}:{' '}
              {formatCurrency(amount, currency)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="chart-container animate-fade-in-up stagger-2">
        <h3 className="text-lg font-semibold mb-4">预算与花费趋势</h3>
        <div className="chart-wrapper" style={{ height: '320px' }}>
          <Line
            ref={lineChartRef}
            data={lineData}
            options={lineOptions}
            plugins={[crosshairPlugin]}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="animate-slide-in-right stagger-1">
            <div className="text-sm text-muted">总预算</div>
            <div className="text-xl font-semibold text-cyan">
              {symbol}{budget.toLocaleString()}
            </div>
          </div>
          <div className="animate-slide-in-right stagger-2">
            <div className="text-sm text-muted">已花费</div>
            <div className="text-xl font-semibold">
              {symbol}{total.toLocaleString()}
            </div>
          </div>
          <div className="animate-slide-in-right stagger-3">
            <div className="text-sm text-muted">剩余</div>
            <div className={`text-xl font-semibold ${budget - total < 0 ? 'text-orange' : ''}`}>
              {symbol}{(budget - total).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;
