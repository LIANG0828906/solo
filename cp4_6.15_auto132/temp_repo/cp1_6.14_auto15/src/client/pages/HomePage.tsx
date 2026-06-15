import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ArrowUpDown, Music } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS, type InstrumentCategory } from '@/types';
import InstrumentCard from '@/components/InstrumentCard';
import { cn } from '@/lib/utils';

type SortOrder = 'asc' | 'desc';

const CATEGORY_OPTIONS: (InstrumentCategory | '')[] = [
  '',
  'guitar',
  'keyboard',
  'wind',
  'string',
  'percussion',
  'other',
];

export default function HomePage() {
  const { instruments, loading, fetchInstruments } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState<InstrumentCategory | ''>(
    (searchParams.get('category') as InstrumentCategory) || ''
  );
  const [sort, setSort] = useState<SortOrder>('asc');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    if (search) params.search = search;
    setSearchParams(params);
  }, [category, search, setSearchParams]);

  useEffect(() => {
    fetchInstruments({
      category: category || undefined,
      sort: sort === 'asc' ? 'price-asc' : 'price-desc',
      search: search || undefined,
    });
  }, [category, sort, search, fetchInstruments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const toggleSort = () => {
    setSort((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-wood-800 mb-2">
          发现优质乐器
        </h1>
        <p className="text-wood-600">租一把心仪的乐器，开启你的音乐之旅</p>
      </div>

      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-wood-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索乐器名称、品牌..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-wood-200 rounded-xl text-gray-900 placeholder-wood-400 focus:outline-none focus:ring-2 focus:ring-forest-400/40 focus:border-forest-400 transition-all shadow-sm"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-wood-700 font-medium">分类：</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as InstrumentCategory | '')}
              className="px-4 py-2 bg-white border border-wood-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-400/40 focus:border-forest-400 transition-all"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === '' ? '全部' : CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleSort}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              'bg-white border border-wood-200 text-wood-700',
              'hover:border-forest-400 hover:text-forest-600',
              'focus:outline-none focus:ring-2 focus:ring-forest-400/40'
            )}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>价格 {sort === 'asc' ? '从低到高' : '从高到低'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : instruments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {instruments.map((instrument) => (
            <InstrumentCard key={instrument.id} instrument={instrument} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Music className="w-16 h-16 text-wood-300 mx-auto mb-4" />
          <p className="text-lg text-wood-600 mb-2">暂无乐器</p>
          <p className="text-sm text-wood-400">试试调整筛选条件或搜索其他关键词</p>
        </div>
      )}
    </div>
  );
}
