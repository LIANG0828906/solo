import { useMemo, useState, useEffect, useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Transaction,
  Budget,
  CATEGORY_MAP,
  EXPENSE_CATEGORIES,
  CategoryType,
} from './types';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
}

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  duration?: number;
}

function AnimatedNumber({ value, prefix = '', duration = 600 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const animFrame = useRef<number | null>(null);

  useEffect(() => {
    if (animFrame.current) {
      cancelAnimationFrame(animFrame.current);
    }

    const start = prevRef.current;
    const end = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);
      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
      }
    };

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animFrame.current) {
        cancelAnimationFrame(animFrame.current);
      }
    };
  }, [value, duration]);

  return (
    <span className="count-up">
      {prefix}
      {display.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}

export default function Dashboard({ transactions, budgets }: DashboardProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const { pieData, lineData, stats } = useMemo(() => {
    const inCurrentMonth = (tx: Transaction) => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const inLastMonth = (tx: Transaction) => {
      const d = new Date(tx.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    };

    const current = transactions.filter(inCurrentMonth);
    const last = transactions.filter(inLastMonth);

    const currentExpense = current
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const currentIncome = current
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const lastExpense = last
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const lastIncome = last
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);

    const categoryTotals: Record<string, number> = {};
    current
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const pie = EXPENSE_CATEGORIES.map((cat) => ({
      name: cat,
      value: categoryTotals[cat] || 0,
    })).filter((d) => d.value > 0);

    const dailyTotals: Record<string, number> = {};
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyTotals[key] = 0;
    }

    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d >= thirtyDaysAgo && t.type === 'expense';
      })
      .forEach((t) => {
        dailyTotals[t.date] = (dailyTotals[t.date] || 0) + t.amount;
      });

    const line = Object.entries(dailyTotals).map(([date, amount]) => ({
      date: date.slice(5),
      支出: Number(amount.toFixed(2)),
    }));

    const expenseDiff =
      lastExpense === 0 ? 0 : ((currentExpense - lastExpense) / lastExpense) * 100;
    const incomeDiff =
      lastIncome === 0 ? 0 : ((currentIncome - lastIncome) / lastIncome) * 100;
    const currentBalance = currentIncome - currentExpense;
    const lastBalance = lastIncome - lastExpense;
    const balanceDiff =
      lastBalance === 0 ? 0 : ((currentBalance - lastBalance) / Math.abs(lastBalance)) * 100;

    return {
      currentMonthData: current,
      pieData: pie,
      lineData: line,
      stats: {
        currentExpense,
        currentIncome,
        currentBalance,
        expenseDiff,
        incomeDiff,
        balanceDiff,
      },
    };
  }, [transactions, currentMonth, currentYear, lastMonth, lastYear, now]);

  const budgetProgress = useMemo(() => {
    const inCurrentMonth = (tx: Transaction) => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };
    const current = transactions.filter(inCurrentMonth);
    const categoryTotals: Record<string, number> = {};
    current
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    return budgets.map((b) => {
      const spent = categoryTotals[b.category] || 0;
      const percent = b.limit === 0 ? 0 : (spent / b.limit) * 100;
      return {
        ...b,
        spent,
        percent: Math.min(percent, 100),
        actualPercent: percent,
      };
    });
  }, [transactions, budgets, currentMonth, currentYear]);

  const totalPieTotal = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据仪表盘</h1>
          <p className="page-subtitle">
            {currentYear}年{currentMonth + 1}月 · 财务概览
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div className="card">
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 16,
              color: '#1e293b',
            }}
          >
            支出分类占比
          </h3>
          {pieData.length === 0 ? (
            <div
              style={{
                height: 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
              }}
            >
              暂无支出数据
            </div>
          ) : (
            <div style={{ position: 'relative', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_MAP[entry.name as CategoryType].color}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => {
                      const percent =
                        totalPieTotal === 0 ? 0 : (value / totalPieTotal) * 100;
                      return [
                        `¥${value.toFixed(2)} (${percent.toFixed(1)}%)`,
                        '金额',
                      ];
                    }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
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
                    fontSize: 12,
                    color: '#64748b',
                    fontWeight: 500,
                  }}
                >
                  本月总支出
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#1e3a5f',
                    marginTop: 4,
                  }}
                >
                  ¥
                  {totalPieTotal.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 8,
            }}
          >
            {pieData.map((d) => {
              const info = CATEGORY_MAP[d.name as CategoryType];
              const percent =
                totalPieTotal === 0 ? 0 : (d.value / totalPieTotal) * 100;
              return (
                <div
                  key={d.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#475569',
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: info.color,
                    }}
                  />
                  {info.icon} {d.name} {percent.toFixed(1)}%
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 16,
              color: '#1e293b',
            }}
          >
            近30天支出趋势
          </h3>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(v) => `¥${v}`}
                />
                <Tooltip
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '支出']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 16 }} />
                <Line
                  type="monotone"
                  dataKey="支出"
                  stroke="#1e3a5f"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#1e3a5f' }}
                  activeDot={{
                    r: 5,
                    fill: '#1e3a5f',
                    strokeWidth: 2,
                    stroke: '#fff',
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#64748b',
              }}
            >
              本月总支出
            </span>
            <span style={{ fontSize: 20 }}>💸</span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#ef4444',
              marginTop: 12,
            }}
          >
            <AnimatedNumber value={stats.currentExpense} prefix="¥" />
          </div>
          <div
            style={{
              fontSize: 12,
              color: stats.expenseDiff <= 0 ? '#10b981' : '#ef4444',
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            {stats.expenseDiff === 0
              ? '—'
              : `${stats.expenseDiff > 0 ? '↑' : '↓'} ${Math.abs(
                  stats.expenseDiff
                ).toFixed(1)}% 较上月`}
          </div>
        </div>

        <div className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#64748b',
              }}
            >
              本月总收入
            </span>
            <span style={{ fontSize: 20 }}>💰</span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#10b981',
              marginTop: 12,
            }}
          >
            <AnimatedNumber value={stats.currentIncome} prefix="¥" />
          </div>
          <div
            style={{
              fontSize: 12,
              color: stats.incomeDiff >= 0 ? '#10b981' : '#ef4444',
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            {stats.incomeDiff === 0
              ? '—'
              : `${stats.incomeDiff > 0 ? '↑' : '↓'} ${Math.abs(
                  stats.incomeDiff
                ).toFixed(1)}% 较上月`}
          </div>
        </div>

        <div className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#64748b',
              }}
            >
              本月结余
            </span>
            <span style={{ fontSize: 20 }}>📊</span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: stats.currentBalance >= 0 ? '#1e3a5f' : '#ef4444',
              marginTop: 12,
            }}
          >
            <AnimatedNumber value={stats.currentBalance} prefix="¥" />
          </div>
          <div
            style={{
              fontSize: 12,
              color: stats.balanceDiff >= 0 ? '#10b981' : '#ef4444',
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            {stats.balanceDiff === 0
              ? '—'
              : `${stats.balanceDiff > 0 ? '↑' : '↓'} ${Math.abs(
                  stats.balanceDiff
                ).toFixed(1)}% 较上月`}
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
            border: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              预算使用率
            </span>
            <span style={{ fontSize: 20 }}>🎯</span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: 'white',
              marginTop: 12,
            }}
          >
            {(() => {
              const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
              const spent = budgetProgress.reduce((s, b) => s + b.spent, 0);
              const percent = totalBudget === 0 ? 0 : (spent / totalBudget) * 100;
              return `${percent.toFixed(1)}%`;
            })()}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            共{budgets
              .reduce((s, b) => s + b.limit, 0)
              .toLocaleString()}
            元预算
          </div>
        </div>
      </div>

      <div className="card">
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 20,
            color: '#1e293b',
          }}
        >
          月度预算概览
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
          }}
        >
          {budgetProgress.map((b) => {
            const info = CATEGORY_MAP[b.category];
            const colorClass =
              b.actualPercent >= 100
                ? 'danger'
                : b.actualPercent >= 80
                ? 'warning'
                : '';
            return (
              <div key={b.category}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      className="category-tag"
                      style={{
                        background: info.bgColor,
                        color: info.color,
                      }}
                    >
                      {info.icon} {b.category}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#64748b',
                    }}
                  >
                    ¥{b.spent.toFixed(0)} / ¥{b.limit.toFixed(0)}
                  </span>
                </div>
                <div
                  className="progress-bar"
                  title={`${b.actualPercent.toFixed(0)}%`}
                >
                  <div
                    className={`progress-fill ${colorClass}`}
                    style={{
                      width: `${b.percent}%`,
                      background: colorClass
                        ? undefined
                        : `linear-gradient(90deg, ${info.color}, ${info.color}cc)`,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color:
                      b.actualPercent >= 100
                        ? '#ef4444'
                        : b.actualPercent >= 80
                        ? '#f59e0b'
                        : '#94a3b8',
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {b.actualPercent >= 100
                    ? '⚠️ 已超预算'
                    : b.actualPercent >= 80
                    ? '⚡ 接近预算上限'
                    : `${b.actualPercent.toFixed(0)}% 已使用`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
