import { useEffect, useRef, useState } from 'react';
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';
import type { DayPlan, Trip, ExpenseCategory } from '../types';

Chart.register(ArcElement, Tooltip, Legend, PieController);

interface BudgetDashboardProps {
  trip: Trip;
}

const categoryColors: Record<ExpenseCategory, string> = {
  transport: '#1E88E5',
  accommodation: '#9C27B0',
  food: '#FF9800',
  ticket: '#4CAF50',
  other: '#607D8B'
};

const categoryLabels: Record<ExpenseCategory, string> = {
  transport: '交通',
  accommodation: '住宿',
  food: '餐饮',
  ticket: '门票',
  other: '其他'
};

function calculateTotalSpent(days: DayPlan[]): number {
  return days.reduce((total, day) => {
    return total + day.activities.reduce((dayTotal, act) => dayTotal + act.cost, 0);
  }, 0);
}

function calculateCategoryBreakdown(days: DayPlan[]): Record<ExpenseCategory, number> {
  const breakdown: Record<ExpenseCategory, number> = {
    transport: 0,
    accommodation: 0,
    food: 0,
    ticket: 0,
    other: 0
  };

  days.forEach(day => {
    day.activities.forEach(act => {
      breakdown[act.category] += act.cost;
    });
  });

  return breakdown;
}

function calculateDailySpent(days: DayPlan[]): Record<string, number> {
  const daily: Record<string, number> = {};
  days.forEach(day => {
    daily[day.date] = day.activities.reduce((sum, act) => sum + act.cost, 0);
  });
  return daily;
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return '#ef4444';
  if (percentage >= 80) return '#f59e0b';
  if (percentage >= 50) return '#eab308';
  return '#22c55e';
}

function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    }

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>¥{displayValue.toLocaleString()}</span>;
}

export default function BudgetDashboard({ trip }: BudgetDashboardProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  const totalSpent = calculateTotalSpent(trip.days);
  const remaining = trip.totalBudget - totalSpent;
  const percentage = trip.totalBudget > 0 ? (totalSpent / trip.totalBudget) * 100 : 0;
  const isOverBudget = totalSpent > trip.totalBudget;
  const dailySpent = calculateDailySpent(trip.days);
  const dailyBudget = trip.totalBudget / trip.days.length;
  const categoryBreakdown = calculateCategoryBreakdown(trip.days);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const labels = Object.entries(categoryBreakdown)
      .filter(([, value]) => value > 0)
      .map(([key]) => categoryLabels[key as ExpenseCategory]);

    const data = Object.entries(categoryBreakdown)
      .filter(([, value]) => value > 0)
      .map(([key]) => categoryBreakdown[key as ExpenseCategory]);

    const colors = Object.entries(categoryBreakdown)
      .filter(([, value]) => value > 0)
      .map(([key]) => categoryColors[key as ExpenseCategory]);

    if (chartInstance.current) {
      chartInstance.current.data.labels = labels;
      chartInstance.current.data.datasets[0].data = data;
      chartInstance.current.data.datasets[0].backgroundColor = colors;
      chartInstance.current.update();
    } else {
      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const value = context.raw as number;
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return `${context.label}: ¥${value.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [categoryBreakdown]);

  return (
    <div className="budget-dashboard card">
      <h2 style={{ marginBottom: '20px', color: '#1E88E5', fontSize: '20px' }}>
        预算仪表盘
      </h2>

      <div className="budget-stats">
        <div className="budget-stat">
          <div className="stat-label">总预算</div>
          <div className="stat-value">
            <AnimatedNumber value={trip.totalBudget} />
          </div>
        </div>
        <div className="budget-stat">
          <div className="stat-label">已花费</div>
          <div className="stat-value" style={{ color: isOverBudget ? '#ef4444' : '#f59e0b' }}>
            <AnimatedNumber value={totalSpent} />
          </div>
        </div>
        <div className={`budget-stat ${isOverBudget ? 'over-budget' : ''}`}>
          <div className="stat-label">剩余</div>
          <div className="stat-value" style={{ color: remaining >= 0 ? '#22c55e' : '#ef4444' }}>
            <AnimatedNumber value={Math.max(0, remaining)} />
          </div>
        </div>
        <div className="budget-stat">
          <div className="stat-label">每日平均预算</div>
          <div className="stat-value">
            <AnimatedNumber value={Math.round(dailyBudget)} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>总预算使用进度</span>
          <span style={{ fontSize: '14px', color: isOverBudget ? '#ef4444' : '#666', fontWeight: '500' }}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className={`progress-bar ${isOverBudget ? 'over-budget' : ''}`}
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getProgressColor(percentage)
            }}
          />
        </div>
        {isOverBudget && (
          <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px', fontWeight: '500' }}>
            ⚠️ 已超出预算 ¥{Math.abs(remaining).toLocaleString()}
          </p>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '15px', marginBottom: '12px', color: '#333' }}>每日预算进度</h3>
        <div className="daily-budget-grid">
          {trip.days.map((day) => {
            const spent = dailySpent[day.date] || 0;
            const dayPercent = dailyBudget > 0 ? (spent / dailyBudget) * 100 : 0;
            const dayOver = spent > dailyBudget;
            return (
              <div key={day.date} className="daily-budget-item">
                <div className="date-label">{day.date}</div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: dayOver ? '#ef4444' : '#333' }}>
                  ¥{spent.toLocaleString()} / ¥{Math.round(dailyBudget).toLocaleString()}
                </div>
                <div className="progress-bar-container" style={{ height: '8px' }}>
                  <div
                    className={`progress-bar ${dayOver ? 'over-budget' : ''}`}
                    style={{
                      width: `${Math.min(dayPercent, 100)}%`,
                      backgroundColor: dayOver ? '#ef4444' : getProgressColor(dayPercent),
                      transition: 'width 0.6s ease, background-color 0.6s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalSpent > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '12px', color: '#333', textAlign: 'center' }}>
            花费分类占比
          </h3>
          <div className="chart-container">
            <canvas ref={chartRef} />
          </div>
        </div>
      )}
    </div>
  );
}
