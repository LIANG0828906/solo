import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Wine, Info, ClipboardList, ArrowLeftRight, MapPin, Grape, Calendar, Droplets, Percent } from 'lucide-react';
import type { Wine, TastingRecord, RegionKey } from '@/types';
import { REGION_CONFIG, AROMA_OPTIONS } from '@/types';
import TastingForm from '@/components/TastingForm';

type TabKey = 'info' | 'tastings' | 'exchange';

export default function BottleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [wine, setWine] = useState<Wine | null>(null);
  const [tastings, setTastings] = useState<TastingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWine = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/wines/${id}`);
      setWine(res.data);
    } catch {
      console.error('Failed to fetch wine');
    }
  }, [id]);

  const fetchTastings = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/wines/${id}/tastings`);
      setTastings(res.data);
    } catch {
      console.error('Failed to fetch tastings');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWine();
    fetchTastings();
  }, [fetchWine, fetchTastings]);

  const handleTastingSubmit = async (data: Omit<TastingRecord, 'id'>) => {
    try {
      await axios.post('/api/tastings', data);
      await fetchTastings();
      await fetchWine();
      setShowForm(false);
    } catch {
      console.error('Failed to submit tasting');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-warm-gold opacity-60 text-lg font-display">加载中…</div>
      </div>
    );
  }

  if (!wine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="empty-state">
          <Wine size={48} />
          <p className="text-lg font-display mt-2">未找到该酒款</p>
          <Link to="/" className="back-link mt-4">
            <ArrowLeft size={16} /> 返回酒窖
          </Link>
        </div>
      </div>
    );
  }

  const regionConfig = REGION_CONFIG[wine.region as RegionKey] || REGION_CONFIG.other;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: '基本信息', icon: <Info size={14} /> },
    { key: 'tastings', label: '品鉴记录', icon: <ClipboardList size={14} /> },
    { key: 'exchange', label: '交换转让', icon: <ArrowLeftRight size={14} /> },
  ];

  const infoItems = [
    { label: '酒庄', value: wine.chateau, icon: <MapPin size={14} /> },
    { label: '产区', value: wine.regionLabel, icon: <Grape size={14} /> },
    { label: '品种', value: wine.variety, icon: <Wine size={14} /> },
    { label: '年份', value: String(wine.year), icon: <Calendar size={14} /> },
    { label: '容量', value: wine.capacity, icon: <Droplets size={14} /> },
    { label: '酒精度', value: wine.alcohol, icon: <Percent size={14} /> },
  ];

  return (
    <div className="min-h-screen pb-mobile">
      <header className="detail-header">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} /> 返回酒窖
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        <div className="py-6">
          <div className="bottle-image-area mb-6">
            <div
              className="bottle-placeholder"
              style={{ background: `linear-gradient(180deg, ${wine.logoColor}cc, ${wine.logoColor}66, ${wine.logoColor}33)` }}
            >
              <Wine size={64} className="text-white opacity-30" />
              <span className="text-white opacity-40 font-display text-sm tracking-wider">{wine.chateau}</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-cork font-display mb-2">{wine.name}</h1>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span
                className="region-tag"
                style={{ background: regionConfig.color }}
              >
                {wine.regionLabel}
              </span>
              <span className="text-cork opacity-60 text-sm">{wine.year} · {wine.variety}</span>
            </div>
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={`star text-xl ${i < Math.round(wine.rating) ? 'filled' : ''}`}>
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="tab-bar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content py-6" key={activeTab}>
          {activeTab === 'info' && (
            <div>
              {infoItems.map((item, idx) => (
                <div key={idx} className="info-item">
                  <div className="info-dot" />
                  <span className="info-label flex items-center gap-1">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className="info-value">{item.value}</span>
                </div>
              ))}
              <div className="info-item">
                <div className="info-dot" />
                <span className="info-label">评分</span>
                <span className="info-value flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`star ${i < Math.round(wine.rating) ? 'filled' : ''}`}>★</span>
                  ))}
                  <span className="text-sm opacity-60 ml-1">({wine.rating.toFixed(1)})</span>
                </span>
              </div>
            </div>
          )}

          {activeTab === 'tastings' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-cork text-lg">
                  品鉴记录 ({tastings.length})
                </h3>
                <button className="add-tasting-btn" onClick={() => setShowForm(true)}>
                  + 新增品鉴
                </button>
              </div>

              {tastings.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '200px' }}>
                  <ClipboardList size={40} />
                  <p className="font-display mt-2">尚无品鉴记录</p>
                  <p className="text-sm mt-1">点击上方按钮记录你的品鉴体验</p>
                </div>
              ) : (
                tastings.map((t, idx) => (
                  <div key={t.id} className={`tasting-record ${idx === 0 ? 'new-record' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-warm-gold text-sm font-semibold">{t.date}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`star text-sm ${i < t.rating ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="text-xs text-cork opacity-50">外观 · </span>
                      <span className="text-sm text-cork opacity-80">{t.appearance}</span>
                      <span className="text-xs text-warm-gold ml-2">清澈度 {t.clarity}/5</span>
                    </div>

                    <div className="mb-2">
                      <span className="text-xs text-cork opacity-50">香气 · </span>
                      {t.aromas.map(a => (
                        <span key={a} className="aroma-tag">{a}</span>
                      ))}
                    </div>

                    <div className="mb-2">
                      <SliderDisplay label="单宁" value={t.tannin} max={10} />
                      <SliderDisplay label="酸度" value={t.acidity} max={10} />
                      <SliderDisplay label="酒体" value={t.body} max={10} />
                    </div>

                    {t.notes && (
                      <p className="text-sm text-cork opacity-80 mb-2 italic">"{t.notes}"</p>
                    )}
                    {t.foodPairing && (
                      <div className="text-xs text-cork opacity-50">
                        搭配食物：{t.foodPairing}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'exchange' && (
            <div className="exchange-card">
              <h3 className="font-display text-cork text-lg mb-4">交换转让</h3>

              {wine.forExchange ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-cork opacity-50 mb-1">交换条件</p>
                    <p className="text-cork">{wine.exchangeCondition || '未设置'}</p>
                  </div>

                  {wine.desiredWines && wine.desiredWines.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-cork opacity-50 mb-1">期望换得</p>
                      <div className="flex flex-wrap gap-2">
                        {wine.desiredWines.map(w => (
                          <span key={w} className="aroma-tag">{w}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="contact-btn mt-2">
                    <ArrowLeftRight size={18} />
                    联系同城藏友
                  </button>
                </>
              ) : (
                <div className="empty-state" style={{ minHeight: '150px' }}>
                  <p className="font-display">该酒暂未开放交换</p>
                  <p className="text-sm mt-1">你可以在编辑中将此酒设为可交换</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showForm && wine && (
        <TastingForm
          wineId={wine.id}
          onSubmit={handleTastingSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function SliderDisplay({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="slider-container">
      <span className="slider-label">{label}</span>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: `${pct}%` }} />
        <div className="slider-thumb" style={{ left: `${pct}%` }} />
      </div>
      <span className="slider-value">{value}</span>
    </div>
  );
}
