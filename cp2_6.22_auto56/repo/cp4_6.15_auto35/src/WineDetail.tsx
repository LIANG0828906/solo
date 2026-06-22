import { useMemo, useState } from 'react';
import { useWineStore } from './store';
import { generateAgingCurve, wineTypeLabel, formatCurrency } from './utils';
import TastingForm from './TastingForm';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Scatter,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface WineDetailProps {
  wineId: string;
  onBack: () => void;
}

export default function WineDetail({ wineId, onBack }: WineDetailProps) {
  const { getWineById, getTastingsByWineId, tastings } = useWineStore();
  const [showTastingForm, setShowTastingForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const wine = getWineById(wineId);
  const wineTastings = useMemo(
    () => getTastingsByWineId(wineId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wineId, tastings, refreshKey]
  );

  const agingCurve = useMemo(() => {
    if (!wine) return [];
    return generateAgingCurve(wine.type, wine.vintage, wine.rating);
  }, [wine]);

  const scatterData = useMemo(() => {
    return wineTastings.map((t) => ({
      year: new Date(t.date).getFullYear(),
      rating: t.rating,
      date: t.date,
      summary: t.summary,
    }));
  }, [wineTastings]);

  const combinedData = useMemo(() => {
    return agingCurve.map((point) => {
      const scatterPoints = scatterData.filter((s) => s.year === point.year);
      return {
        ...point,
        scatterRating: scatterPoints.length > 0 ? scatterPoints[0].rating : null,
        scatterCount: scatterPoints.length,
      };
    });
  }, [agingCurve, scatterData]);

  const currentYear = new Date().getFullYear();

  if (!wine) {
    return (
      <div className="detail-page">
        <button className="detail-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回列表
        </button>
        <div className="empty-state">
          <p>未找到该酒款</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        返回列表
      </button>

      <div className="detail-hero">
        <div className="detail-image" style={{ background: wine.imageColor }}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 2h8l1 7H7l1-7z" />
            <path d="M7 9v7a5 5 0 0 0 10 0V9" />
            <line x1="12" y1="22" x2="12" y2="16" />
          </svg>
        </div>
        <div className="detail-info">
          <h1 className="detail-name">{wine.name}</h1>
          <div className="detail-rating-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {wine.rating} 分
          </div>

          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <span className="detail-meta-label">类型</span>
              <span className="detail-meta-value">{wineTypeLabel(wine.type)}</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">年份</span>
              <span className="detail-meta-value">{wine.vintage} 年</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">产区</span>
              <span className="detail-meta-value">{wine.country} · {wine.region}</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">子产区</span>
              <span className="detail-meta-value">{wine.subRegion}</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">葡萄品种</span>
              <span className="detail-meta-value">{wine.grapeVarieties.join('、')}</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">库存</span>
              <span className="detail-meta-value">{wine.quantity} 瓶</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">购买价格</span>
              <span className="detail-meta-value">{formatCurrency(wine.price)}</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">酒龄</span>
              <span className="detail-meta-value">{currentYear - wine.vintage} 年</span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-header">
          <h2 className="detail-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--wine-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 14l4-4 4 4 5-5" />
            </svg>
            陈年曲线
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--brown-medium)' }}>
            {wineTypeLabel(wine.type)} · {wine.vintage} 年份
          </span>
        </div>
        <div className="aging-chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={combinedData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D8" />
              <XAxis
                dataKey="year"
                stroke="#8B7572"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                domain={[60, 100]}
                stroke="#8B7572"
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickCount={5}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--white)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  fontSize: '0.8rem',
                }}
                labelStyle={{ color: 'var(--brown-dark)', fontWeight: 600 }}
                formatter={(value, name) => {
                  if (value === null || value === undefined) return ['-', name as string];
                  const label = name === 'rating' ? '理论评分' : '实际评分';
                  return [`${value} 分`, label];
                }}
              />
              <Legend
                formatter={(value) =>
                  value === 'rating' ? '理论陈年曲线' : '实际品鉴评分'
                }
                iconType="line"
                wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#722F37"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Scatter
                name="实际评分"
                data={scatterData}
                fill="#DAA520"
                stroke="#722F37"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="aging-legend">
            <div className="aging-legend-item">
              <span className="aging-legend-line" style={{ background: '#722F37' }} />
              理论陈年曲线
            </div>
            <div className="aging-legend-item">
              <span className="aging-legend-dot" style={{ background: '#DAA520', border: '2px solid #722F37' }} />
              实际品鉴评分
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--brown-light)', marginTop: '12px', fontStyle: 'italic' }}>
            * 曲线基于酒款类型与初始评分生成的理论预测，实际表现请以品鉴记录为准
          </p>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-header">
          <h2 className="detail-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--wine-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            品鉴记录
            <span style={{ color: 'var(--brown-light)', fontSize: '0.9rem', fontWeight: 400 }}>
              ({wineTastings.length} 条)
            </span>
          </h2>
          <button className="btn-primary" onClick={() => setShowTastingForm(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新增品鉴
          </button>
        </div>

        {wineTastings.length > 0 ? (
          <div className="tasting-timeline">
            {wineTastings.map((tasting) => (
              <div key={tasting.id} className="tasting-item">
                <div className="tasting-date">
                  {tasting.date} · {tasting.color}
                </div>
                <div className="tasting-summary">"{tasting.summary}"</div>
                <div className="tasting-details">
                  <div className="tasting-detail-item">
                    <div className="tasting-detail-label">甜度</div>
                    <div className="tasting-detail-value">{tasting.sweetness} / 5</div>
                  </div>
                  <div className="tasting-detail-item">
                    <div className="tasting-detail-label">酸度</div>
                    <div className="tasting-detail-value">{tasting.acidity} / 5</div>
                  </div>
                  <div className="tasting-detail-item">
                    <div className="tasting-detail-label">单宁</div>
                    <div className="tasting-detail-value">{tasting.tannin} / 5</div>
                  </div>
                  <div className="tasting-detail-item">
                    <div className="tasting-detail-label">酒体</div>
                    <div className="tasting-detail-value">{tasting.body} / 5</div>
                  </div>
                </div>
                {tasting.aroma && (
                  <div className="tasting-aroma">
                    <strong>香气：</strong>{tasting.aroma}
                  </div>
                )}
                <div style={{ marginTop: '8px', textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'linear-gradient(135deg, var(--wine-red), var(--wine-red-light))',
                    color: 'var(--white)',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {tasting.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>还没有品鉴记录，点击右上角开始记录吧</p>
          </div>
        )}
      </div>

      {showTastingForm && (
        <TastingForm
          wineId={wineId}
          onClose={() => setShowTastingForm(false)}
          onSubmitted={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
