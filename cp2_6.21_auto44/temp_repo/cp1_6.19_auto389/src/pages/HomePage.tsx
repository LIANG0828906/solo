import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Filter, Heart, X, ArrowLeftRight } from 'lucide-react';
import { useStore } from '../store';
import InstrumentCard from '../components/InstrumentCard';
import { SkeletonCard } from '../components/Skeleton';
import type { InstrumentType, Instrument } from '../types';
import '../index.css';

const TYPE_OPTIONS: (InstrumentType | '全部')[] = ['全部', '吉他', '钢琴', '鼓', '小提琴', '萨克斯', '电子琴', '贝斯'];
const PRICE_RANGES = [
  { label: '全部价格', min: 0, max: Infinity },
  { label: '¥0 - ¥2000', min: 0, max: 2000 },
  { label: '¥2000 - ¥5000', min: 2000, max: 5000 },
  { label: '¥5000 - ¥10000', min: 5000, max: 10000 },
  { label: '¥10000 - ¥20000', min: 10000, max: 20000 },
  { label: '¥20000以上', min: 20000, max: Infinity },
];
const CONDITION_RANGES = [
  { label: '全部成色', min: 1, max: 10 },
  { label: '较差 (1-3分)', min: 1, max: 3 },
  { label: '一般 (4-5分)', min: 4, max: 5 },
  { label: '良好 (6-7分)', min: 6, max: 7 },
  { label: '优秀 (8-10分)', min: 8, max: 10 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { instruments, favorites, loading, setLoading, addToCompare, removeFromCompare, compareIds } = useStore();

  const [typeFilter, setTypeFilter] = useState<InstrumentType | '全部'>('全部');
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [conditionRangeIdx, setConditionRangeIdx] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [setLoading]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setShowMobileFilters(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredInstruments = useMemo(() => {
    return instruments.filter((inst) => {
      if (typeFilter !== '全部' && inst.type !== typeFilter) return false;
      const pr = PRICE_RANGES[priceRangeIdx];
      if (inst.expectedPrice < pr.min || inst.expectedPrice > pr.max) return false;
      const cr = CONDITION_RANGES[conditionRangeIdx];
      if (inst.condition < cr.min || inst.condition > cr.max) return false;
      return true;
    });
  }, [instruments, typeFilter, priceRangeIdx, conditionRangeIdx]);

  const favoriteInstruments = instruments.filter((i) => favorites.includes(i.id));

  const handleFilterChange = (handler: () => void) => {
    handler();
    setAnimKey((k) => k + 1);
  };

  const handleResetFilters = () => {
    setTypeFilter('全部');
    setPriceRangeIdx(0);
    setConditionRangeIdx(0);
    setAnimKey((k) => k + 1);
  };

  const renderFilterBar = () => (
    <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <select
          value={typeFilter}
          onChange={(e) => handleFilterChange(() => setTypeFilter(e.target.value as InstrumentType | '全部'))}
          className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <select
          value={priceRangeIdx}
          onChange={(e) => handleFilterChange(() => setPriceRangeIdx(Number(e.target.value)))}
          className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
        >
          {PRICE_RANGES.map((opt, idx) => (
            <option key={idx} value={idx}>{opt.label}</option>
          ))}
        </select>
        <select
          value={conditionRangeIdx}
          onChange={(e) => handleFilterChange(() => setConditionRangeIdx(Number(e.target.value)))}
          className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
        >
          {CONDITION_RANGES.map((opt, idx) => (
            <option key={idx} value={idx}>{opt.label}</option>
          ))}
        </select>
      </div>
      {(typeFilter !== '全部' || priceRangeIdx !== 0 || conditionRangeIdx !== 0) && (
        <button
          onClick={handleResetFilters}
          className="text-sm text-gray-500 hover:text-orange-500 transition-colors whitespace-nowrap"
        >
          重置筛选
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="md:hidden mb-3 flex justify-between items-center">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <Menu className="w-5 h-5" />
            <span className="text-sm font-medium">筛选</span>
          </button>
          <button
            onClick={() => setShowFavoritesDrawer(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: '#FF9800' }}
          >
            <Heart className="w-4 h-4" />
            <span>收藏夹</span>
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        <div className={`md:block ${showMobileFilters ? 'block' : 'hidden'}`}>
          {loading ? (
            <div className="flex flex-wrap gap-3">
              <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-44 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ) : (
            renderFilterBar()
          )}
        </div>
      </div>

      <div className="hidden md:block">
        <button
          onClick={() => setShowFavoritesDrawer(true)}
          className="fixed right-4 top-24 z-30 flex items-center gap-2 px-4 py-3 rounded-xl text-white font-medium shadow-lg hover:scale-105 transition-transform"
          style={{ backgroundColor: '#FF9800' }}
        >
          <Heart className="w-5 h-5" />
          <span>收藏夹</span>
          {favorites.length > 0 && (
            <span className="w-6 h-6 rounded-full bg-white text-orange-500 text-sm font-bold flex items-center justify-center">
              {favorites.length}
            </span>
          )}
        </button>
      </div>

      <div
        key={animKey}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        {loading ? (
          <div className="flex flex-wrap gap-6 justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredInstruments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Filter className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">未找到符合条件的乐器</h3>
            <p className="text-gray-500 mb-4">试试调整筛选条件</p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#FF9800' }}
            >
              重置筛选条件
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center">
            {filteredInstruments.map((inst, idx) => (
              <InstrumentCard key={inst.id + animKey} instrument={inst} index={idx} />
            ))}
          </div>
        )}
      </div>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          showFavoritesDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setShowFavoritesDrawer(false)}
        />
        <div
          className="absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300"
          style={{
            width: '320px',
            transform: showFavoritesDrawer ? 'translateX(0)' : 'translateX(100%)',
          }}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Heart className="w-5 h-5" style={{ color: '#FF9800', fill: '#FF9800' }} />
              收藏夹 ({favorites.length})
            </h3>
            <button
              onClick={() => setShowFavoritesDrawer(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {favoriteInstruments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">还没有收藏的乐器</p>
              </div>
            ) : (
              favoriteInstruments.map((inst) => (
                <FavoriteItem
                  key={inst.id}
                  instrument={inst}
                  selected={compareIds.includes(inst.id)}
                  onToggleCompare={() => {
                    if (compareIds.includes(inst.id)) {
                      removeFromCompare(inst.id);
                    } else {
                      if (compareIds.length < 3) addToCompare(inst.id);
                    }
                  }}
                  onNavigate={() => {
                    setShowFavoritesDrawer(false);
                    navigate(`/detail/${inst.id}`);
                  }}
                />
              ))
            )}
          </div>

          {favoriteInstruments.length > 0 && (
            <div className="p-4 border-t border-gray-200 space-y-2">
              <p className="text-xs text-gray-500 text-center">
                已选择 {compareIds.length}/3 件商品进行对比
              </p>
              <button
                onClick={() => {
                  if (compareIds.length >= 2) {
                    setShowFavoritesDrawer(false);
                    navigate('/compare');
                  }
                }}
                disabled={compareIds.length < 2}
                className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: compareIds.length >= 2 ? '#FF9800' : undefined,
                }}
              >
                <ArrowLeftRight className="w-4 h-4" />
                跳转对比页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FavoriteItem({
  instrument,
  selected,
  onToggleCompare,
  onNavigate,
}: {
  instrument: Instrument;
  selected: boolean;
  onToggleCompare: () => void;
  onNavigate: () => void;
}) {
  return (
    <div
      className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
        selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onNavigate}
    >
      <div className="flex gap-3">
        <img
          src={instrument.image}
          alt={instrument.model}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{instrument.brand} {instrument.model}</h4>
          <p className="text-xs text-gray-500">{instrument.type}</p>
          <p className="font-bold mt-1" style={{ color: '#FF9800' }}>¥{instrument.expectedPrice.toLocaleString()}</p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompare();
        }}
        className={`mt-2 w-full py-1.5 rounded-lg text-xs font-medium transition-all ${
          selected
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {selected ? '✓ 已加入对比' : '加入对比'}
      </button>
    </div>
  );
}
