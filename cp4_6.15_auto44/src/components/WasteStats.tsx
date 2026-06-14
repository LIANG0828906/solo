import { useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, Filter, Leaf } from 'lucide-react';
import type { WasteRecord, Category } from '@/types';
import { CategoryEmoji } from '@/types';
import { getMonthlyStats, filterByCategory, filterByMonth } from '@/engine/wasteTracker';

interface WasteStatsProps {
  wasteRecords: WasteRecord[];
}

const CATEGORIES: Category[] = ['蔬菜', '水果', '肉类', '蛋奶', '调料', '其他'];

export default function WasteStats({ wasteRecords }: WasteStatsProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthRecords = useMemo(
    () => filterByMonth(wasteRecords, currentYear, currentMonth),
    [wasteRecords, currentYear, currentMonth],
  );

  const filteredRecords = useMemo(
    () => filterByCategory(monthRecords, selectedCategory),
    [monthRecords, selectedCategory],
  );

  const stats = useMemo(() => getMonthlyStats(filteredRecords), [filteredRecords]);

  const consumedRecords = useMemo(
    () => filteredRecords.filter((r) => r.type === 'consumed'),
    [filteredRecords],
  );

  const wastedRecords = useMemo(
    () => filteredRecords.filter((r) => r.type === 'wasted'),
    [filteredRecords],
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  };

  if (monthRecords.length === 0) {
    return (
      <div className="bg-cream-50 rounded-2xl border border-cream-200 p-6">
        <h2 className="font-serif text-lg">📊 本月统计</h2>
        <p className="mt-4 text-center text-sm text-gray-400">本月暂无记录</p>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 rounded-2xl border border-cream-200 p-6">
      <h2 className="font-serif text-lg">📊 本月统计</h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-gray-400" />
        <button
          type="button"
          onClick={() => setSelectedCategory(undefined)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedCategory === undefined
              ? 'bg-category-vegetable text-white'
              : 'bg-white text-gray-600 hover:bg-cream-100'
          }`}
        >
          全部
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(selectedCategory === cat ? undefined : cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-category-vegetable text-white'
                : 'bg-white text-gray-600 hover:bg-cream-100'
            }`}
          >
            {CategoryEmoji[cat]} {cat}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <Leaf size={16} className="text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">已消耗</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-600">{stats.consumed.count}</p>
          <p className="text-xs text-gray-400">共 {stats.consumed.quantity} 份</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
              <TrendingDown size={16} className="text-red-500" />
            </div>
            <span className="text-xs font-medium text-gray-500">已浪费</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-500">{stats.wasted.count}</p>
          <p className="text-xs text-gray-400">共 {stats.wasted.quantity} 份</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {consumedRecords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <TrendingUp size={12} />
              <span>消耗记录</span>
            </div>
            <ul className="mt-1.5 space-y-1">
              {consumedRecords.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-green-700">{r.ingredientName}</span>
                  <span className="text-green-500">
                    {r.quantity}{r.unit} · {formatDate(r.date)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {wastedRecords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
              <TrendingDown size={12} />
              <span>浪费记录</span>
            </div>
            <ul className="mt-1.5 space-y-1">
              {wastedRecords.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-red-700">{r.ingredientName}</span>
                  <span className="text-red-400">
                    {r.quantity}{r.unit} · {formatDate(r.date)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
