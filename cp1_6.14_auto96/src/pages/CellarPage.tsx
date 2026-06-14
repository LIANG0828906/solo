import { useEffect, useState } from 'react';
import axios from 'axios';
import { Wine, Search } from 'lucide-react';
import WineCard from '@/components/WineCard';
import type { Wine as WineType, TastingRecord, RegionKey } from '@/types';
import { REGION_CONFIG } from '@/types';

const REGIONS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'bordeaux', label: '波尔多' },
  { key: 'napa', label: '纳帕谷' },
  { key: 'tuscany', label: '托斯卡纳' },
  { key: 'burgundy', label: '勃艮第' },
  { key: 'other', label: '其他' },
];

export default function CellarPage() {
  const [wines, setWines] = useState<WineType[]>([]);
  const [tastings, setTastings] = useState<TastingRecord[]>([]);
  const [activeRegion, setActiveRegion] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [winesRes, tastingsRes] = await Promise.all([
          axios.get('/api/wines'),
          axios.get('/api/tastings'),
        ]);
        setWines(winesRes.data);
        setTastings(tastingsRes.data);
      } catch {
        console.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredWines = wines.filter(w => {
    const regionMatch = activeRegion === 'all' || w.region === activeRegion;
    const searchMatch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.chateau.toLowerCase().includes(search.toLowerCase());
    return regionMatch && searchMatch;
  });

  const getLastTasting = (wineId: string): TastingRecord | undefined => {
    const wineTastings = tastings
      .filter(t => t.wineId === wineId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return wineTastings[0];
  };

  const totalCount = wines.length;
  const tastingCount = tastings.length;

  return (
    <div className="min-h-screen pb-mobile">
      <header className="nav-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4A0E1C, #722F37)' }}>
                <Wine size={22} className="text-warm-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-cork font-display">酒窖</h1>
                <p className="text-xs text-cork-dark opacity-60">
                  {totalCount} 瓶藏酒 · {tastingCount} 次品鉴
                </p>
              </div>
            </div>
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cork opacity-40" />
              <input
                type="text"
                placeholder="搜索酒庄或酒名..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input pl-9 py-2 text-sm"
                style={{ width: '220px' }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <div className="filter-bar">
          {REGIONS.map(r => (
            <button
              key={r.key}
              className={`filter-btn ${activeRegion === r.key ? 'active' : ''}`}
              onClick={() => setActiveRegion(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="sm:hidden mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cork opacity-40" />
            <input
              type="text"
              placeholder="搜索酒庄或酒名..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9 py-2 text-sm w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ minHeight: '300px' }}>
            <div className="text-warm-gold opacity-60 text-lg font-display">加载中…</div>
          </div>
        ) : filteredWines.length === 0 ? (
          <div className="empty-state" style={{ minHeight: '300px' }}>
            <Wine size={48} />
            <p className="text-lg font-display">酒窖空空如也</p>
            <p className="text-sm mt-1">添加你的第一瓶藏酒吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {filteredWines.map((wine, idx) => (
              <WineCard
                key={wine.id}
                wine={wine}
                lastTasting={getLastTasting(wine.id)}
                index={idx}
              />
            ))}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button className="bottom-nav-item active">
          <Wine size={20} />
          <span>酒窖</span>
        </button>
        <button className="bottom-nav-item">
          <span style={{ fontSize: '20px' }}>🍷</span>
          <span>品鉴</span>
        </button>
        <button className="bottom-nav-item">
          <span style={{ fontSize: '20px' }}>🤝</span>
          <span>交换</span>
        </button>
      </nav>
    </div>
  );
}
