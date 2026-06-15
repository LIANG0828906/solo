import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, PackageOpen, HandHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchItems } from '@/utils/api';
import { toast } from '@/hooks/useToast';
import type { LostItem } from '@/types';
import ItemCard from '@/components/ItemCard';
import ItemForm from '@/components/ItemForm';
import MatchModal from '@/components/MatchModal';
import FilterBar, { timeRangeToDate, type TimeRange } from '@/components/FilterBar';

const FILTER_KEY = Symbol('filter');

export default function Home() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [filterFading, setFilterFading] = useState(false);
  const prevLocationRef = useState('')[0];
  const prevTimeRef = useState<TimeRange>('all')[0];
  void prevLocationRef; void prevTimeRef; void FILTER_KEY;

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const dateFrom = timeRangeToDate(timeRange);
      const filters = locationFilter
        ? { location: locationFilter, dateFrom }
        : dateFrom !== undefined
          ? { dateFrom }
          : undefined;
      const data = await fetchItems(filters as any);
      setItems(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : '加载失败，请刷新重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [locationFilter, timeRange]);

  useEffect(() => {
    setFilterFading(true);
    const t = setTimeout(() => {
      loadItems();
      setTimeout(() => setFilterFading(false), 50);
    }, 180);
    return () => clearTimeout(t);
  }, [locationFilter, timeRange]);

  const refreshAll = useCallback(async () => {
    try {
      const data = await fetchItems();
      setItems(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : '刷新失败', 'error');
    }
  }, []);

  const handleSubmitted = (item: LostItem) => {
    setNewItemId(item.id);
    setItems(prev => [item, ...prev.filter(i => i.id !== item.id)]);
    setTimeout(() => setNewItemId(null), 900);
  };

  const handleClaimed = (updated: LostItem) => {
    setItems(prev =>
      prev.map(i => (i.id === updated.id ? { ...i, isClaimed: true } : i))
    );
  };

  const allCount = useMemo(() => items.length, [items]);
  const totalPlaceholder = useMemo(() => allCount, [allCount]);

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <header className="sticky top-0 z-40 bg-[#FFF8F0]/90 backdrop-blur-md border-b border-orange-100/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFA726] to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200/50">
                <HandHeart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
                  失物招领
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  智能匹配，让遗失物物归原主
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowMatch(true)}
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200',
                  'bg-white border-2 border-orange-200 text-gray-700 hover:border-[#FFA726] hover:bg-orange-50',
                  'shadow-sm hover:shadow-md active:scale-[0.98]'
                )}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFA726]" />
                <span className="hidden sm:inline">智能匹配</span>
                <span className="sm:hidden">匹配</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm text-white',
                  'bg-gradient-to-r from-[#FFA726] to-amber-500 shadow-lg shadow-orange-200/60',
                  'hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all duration-200'
                )}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">发布失物</span>
                <span className="sm:hidden">发布</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section className="mb-6 sm:mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-orange-50 via-[#FFF8F0] to-amber-50 border border-orange-100 shadow-sm overflow-hidden relative">
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-gradient-to-br from-orange-200/40 to-amber-200/40 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="text-2xl">👋</span>
                  欢迎来到失物招领平台
                </h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-xl leading-relaxed">
                  在这里您可以发布拾获的物品，也可以通过智能匹配找回丢失物品。
                  <br className="hidden sm:block" />
                  一起让每件遗失物品都能物归原主。
                </p>
              </div>
              <div className="flex gap-3 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-[#FFA726]">
                    {allCount || '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">累计发布</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-500">
                    {items.filter(i => i.isClaimed).length || '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">成功认领</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 p-4 sm:p-5 rounded-2xl bg-white/70 backdrop-blur border border-orange-50 shadow-sm">
          <FilterBar
            location={locationFilter}
            timeRange={timeRange}
            onLocationChange={setLocationFilter}
            onTimeRangeChange={setTimeRange}
            totalCount={totalPlaceholder}
            filteredCount={allCount}
          />
        </section>

        <section>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-amber-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-orange-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-8 bg-orange-100 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-orange-100 rounded-full blur-3xl opacity-60" />
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                  <PackageOpen className="w-14 h-14 sm:w-16 sm:h-16 text-[#FFA726]" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                {locationFilter || timeRange !== 'all' ? '暂无符合条件的物品' : '还没有任何失物信息'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 max-w-md mb-6 leading-relaxed">
                {locationFilter || timeRange !== 'all'
                  ? '试试调整筛选条件，或查看全部地点和时间的失物信息。'
                  : '您可以成为第一个发布失物信息的人，让遗失的物品尽快找到主人！'}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {(locationFilter || timeRange !== 'all') && (
                  <button
                    onClick={() => {
                      setLocationFilter('');
                      setTimeRange('all');
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-orange-200 hover:border-[#FFA726] hover:bg-orange-50 transition-all shadow-sm"
                  >
                    清除筛选条件
                  </button>
                )}
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#FFA726] to-amber-500 shadow-lg shadow-orange-200/50 hover:shadow-xl hover:brightness-105 transition-all active:scale-[0.98]"
                >
                  立即发布失物
                </button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 transition-opacity duration-300',
                filterFading ? 'opacity-0' : 'opacity-100'
              )}
            >
              {items.map((item, i) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={i}
                  isNew={item.id === newItemId}
                  onClaimed={handleClaimed}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 sm:mt-20 py-8 border-t border-orange-100 text-center">
          <p className="text-sm text-gray-400">
            © 2026 失物招领智能平台 · 让每件遗失物都能回家 🏠
          </p>
        </footer>
      </main>

      <ItemForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmitted={handleSubmitted}
      />
      <MatchModal
        open={showMatch}
        onClose={() => setShowMatch(false)}
        onClaimed={refreshAll}
      />
    </div>
  );
}
