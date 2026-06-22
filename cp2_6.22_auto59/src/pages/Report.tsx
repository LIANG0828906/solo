import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Navbar from '@/components/Navbar';
import { useNutritionStore } from '@/store/useNutritionStore';
import type { FoodLogEntry, MealType } from '@/types';
import {
  Trash2,
  Edit2,
  Save,
  X,
  Coffee,
  Sun,
  Moon,
  Cookie,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as api from '@/services/food-api';

const MEAL_CONFIG: Record<
  MealType,
  { label: string; icon: typeof Coffee; color: string; bg: string }
> = {
  breakfast: {
    label: '早餐',
    icon: Coffee,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  lunch: {
    label: '午餐',
    icon: Sun,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  dinner: {
    label: '晚餐',
    icon: Moon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  snack: {
    label: '加餐',
    icon: Cookie,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
};

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function getDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parts[1]}/${parts[2]}`;
}

interface DayDetailProps {
  date: string;
  logs: FoodLogEntry[];
  onRefresh: () => void;
}

function DayDetail({ date, logs, onRefresh }: DayDetailProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState(100);
  const [editMeal, setEditMeal] = useState<MealType>('lunch');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    acc[meal] = logs.filter((l) => l.mealType === meal);
    return acc;
  }, {} as Record<MealType, FoodLogEntry[]>);

  const totalCals = logs.reduce((s, l) => s + l.calories, 0);
  const totalProtein = logs.reduce((s, l) => s + l.protein, 0);
  const totalCarbs = logs.reduce((s, l) => s + l.carbs, 0);

  const startEdit = (entry: FoodLogEntry) => {
    setEditingId(entry.id);
    setEditAmount(entry.amount);
    setEditMeal(entry.mealType);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (entry: FoodLogEntry) => {
    setSaving(true);
    try {
      await api.updateFoodLog(entry.id, {
        amount: editAmount,
        mealType: editMeal,
      });
      setEditingId(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteFoodLog(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-50/50 to-accent-50/30 rounded-2xl p-5 mt-4 border border-primary-100 animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
        <div>
          <div className="text-sm font-bold text-gray-800">{date} 详细记录</div>
          <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
            总热量 {totalCals.toFixed(0)} kcal · 蛋白 {totalProtein.toFixed(0)}g · 碳水{' '}
            {totalCarbs.toFixed(0)}g
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-lg bg-white text-primary-600 font-medium">
          {logs.length} 条记录
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">当天暂无饮食记录</div>
      ) : (
        <div className="space-y-4">
          {MEAL_ORDER.map((meal) => {
            const items = grouped[meal];
            if (items.length === 0) return null;
            const cfg = MEAL_CONFIG[meal];
            const Icon = cfg.icon;
            const mealCals = items.reduce((s, i) => s + i.calories, 0);
            return (
              <div key={meal}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', cfg.color)} />
                    <span className={cn('text-sm font-semibold', cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums">
                    {mealCals.toFixed(0)} kcal
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((entry) => {
                    const isEditing = editingId === entry.id;
                    const isDeleting = deletingId === entry.id;
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          'bg-white rounded-xl border border-surface-border p-3 transition-all',
                          isEditing && 'ring-2 ring-primary-200',
                          isDeleting && 'opacity-50',
                        )}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  份量 (g)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editAmount}
                                  onChange={(e) =>
                                    setEditAmount(Math.max(1, Number(e.target.value) || 0))
                                  }
                                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  餐次
                                </label>
                                <select
                                  value={editMeal}
                                  onChange={(e) =>
                                    setEditMeal(e.target.value as MealType)
                                  }
                                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                                >
                                  {MEAL_ORDER.map((m) => (
                                    <option key={m} value={m}>
                                      {MEAL_CONFIG[m].label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(entry)}
                                disabled={saving}
                                className="flex-1 py-1.5 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                              >
                                <Save className="w-3.5 h-3.5" />
                                保存
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                cfg.bg,
                              )}
                            >
                              <Icon className={cn('w-4 h-4', cfg.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 text-sm truncate">
                                {entry.foodName}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 tabular-nums">
                                <span>{entry.amount}g</span>
                                <span>·</span>
                                <span>{entry.calories.toFixed(0)} kcal</span>
                                <span>·</span>
                                <span>蛋白 {entry.protein.toFixed(0)}g</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEdit(entry)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors active:scale-90"
                                aria-label="编辑"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                disabled={isDeleting}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-90 disabled:opacity-50"
                                aria-label="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Report() {
  const { fetchRecentLogs, fetchTodayLogs, recentLogs, selectedDate } = useNutritionStore();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentLogs();
  }, [fetchRecentLogs, selectedDate]);

  const refreshAll = async () => {
    await Promise.all([fetchRecentLogs(), fetchTodayLogs()]);
  };

  const { lineData, barData, logsByDate, dateList } = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      dates.push(getDateString(i));
    }

    const byDate: Record<string, FoodLogEntry[]> = {};
    dates.forEach((d) => (byDate[d] = []));
    recentLogs.forEach((log) => {
      if (byDate[log.date]) {
        byDate[log.date].push(log);
      }
    });

    const line = dates.map((date) => {
      const logs = byDate[date];
      return {
        date: formatShortDate(date),
        fullDate: date,
        calories: Math.round(logs.reduce((s, l) => s + l.calories, 0)),
      };
    });

    const bar = dates.map((date) => {
      const logs = byDate[date];
      return {
        date: formatShortDate(date),
        fullDate: date,
        蛋白质: Math.round(logs.reduce((s, l) => s + l.protein, 0)),
        碳水: Math.round(logs.reduce((s, l) => s + l.carbs, 0)),
      };
    });

    return {
      lineData: line,
      barData: bar,
      logsByDate: byDate,
      dateList: dates,
    };
  }, [recentLogs]);

  const avgCalories = useMemo(() => {
    const vals = lineData.map((d) => d.calories).filter((v) => v > 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [lineData]);

  return (
    <div className="min-h-screen bg-surface-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">饮食报告</h1>
          <p className="text-sm text-gray-500 mt-1">
            查看过去 7 天的营养摄入趋势
            {avgCalories > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 font-semibold text-xs tabular-nums">
                平均 {avgCalories} kcal/天
              </span>
            )}
          </p>
        </div>

        <div className="bg-surface-card rounded-2xl shadow-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">7 日热量趋势</h2>
              <p className="text-xs text-gray-500">点击数据点展开当日详情</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`${value} kcal`, '总热量']}
                  labelFormatter={(label) => `日期: ${label}`}
                  cursor={{ stroke: '#4CAF50', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#4CAF50"
                  strokeWidth={2.5}
                  dot={(props: Record<string, unknown>) => {
                    const { cx, cy, payload } = props as {
                      cx: number;
                      cy: number;
                      payload: { fullDate: string };
                    };
                    const isExpanded = expandedDate === payload.fullDate;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isExpanded ? 8 : 5}
                        fill="#fff"
                        stroke="#4CAF50"
                        strokeWidth={2.5}
                        className="cursor-pointer transition-all duration-200 hover:fill-primary-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          const d = payload.fullDate;
                          setExpandedDate((prev) => (prev === d ? null : d));
                        }}
                      />
                    );
                  }}
                  activeDot={(props: Record<string, unknown>) => {
                    const { cx, cy, payload } = props as {
                      cx: number;
                      cy: number;
                      payload: { fullDate: string };
                    };
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill="#4CAF50"
                        stroke="#fff"
                        strokeWidth={2}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const d = payload.fullDate;
                          setExpandedDate((prev) => (prev === d ? null : d));
                        }}
                      />
                    );
                  }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {expandedDate && (
            <DayDetail
              date={expandedDate}
              logs={logsByDate[expandedDate] || []}
              onRefresh={refreshAll}
            />
          )}
        </div>

        <div className="bg-surface-card rounded-2xl shadow-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">蛋白质 vs 碳水摄入对比</h2>
              <p className="text-xs text-gray-500">每日平均摄入量（克）</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => [`${value} g`, name]}
                  cursor={{ fill: 'rgba(76,175,80,0.05)' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="蛋白质"
                  fill="#2196F3"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                  className="transition-opacity duration-200 hover:opacity-80"
                />
                <Bar
                  dataKey="碳水"
                  fill="#FFC107"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                  className="transition-opacity duration-200 hover:opacity-80"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dateList.slice(-3).map((date) => {
            const logs = logsByDate[date];
            const cals = logs.reduce((s, l) => s + l.calories, 0);
            const isExpanded = expandedDate === date;
            return (
              <button
                key={date}
                onClick={() => setExpandedDate((prev) => (prev === date ? null : date))}
                className={cn(
                  'bg-surface-card rounded-2xl shadow-card p-4 text-left transition-all duration-200',
                  'hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]',
                  isExpanded && 'ring-2 ring-primary-300',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-800">{date}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-primary-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="text-2xl font-bold text-primary-600 tabular-nums">
                  {cals.toFixed(0)}
                  <span className="text-xs text-gray-400 font-normal ml-1">kcal</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{logs.length} 条记录</div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
