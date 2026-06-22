import React, { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Wine, SimilarWine, FlavorProfile } from './types';
import SpiderChart from './spiderChart';

interface WineDetailProps {
  wine: Wine;
  onFlavorChange: (id: string, flavors: FlavorProfile) => void;
  onSimilarSelect: (id: string) => void;
}

export default function WineDetail({ wine, onFlavorChange, onSimilarSelect }: WineDetailProps) {
  const [similar, setSimilar] = React.useState<SimilarWine[]>([]);
  const [loading, setLoading] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.post(`/api/wines/${wine.id}/similar`)
      .then(res => {
        if (!cancelled) setSimilar(res.data);
      })
      .catch(() => {
        if (!cancelled) setSimilar([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [wine.id, wine.flavors]);

  const handleFlavorChange = useCallback((flavors: FlavorProfile) => {
    onFlavorChange(wine.id, flavors);
  }, [wine.id, onFlavorChange]);

  const handleScrollMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current!.offsetLeft;
    scrollLeft.current = scrollRef.current!.scrollLeft;
  }, []);

  const handleScrollMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current!.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current!.scrollLeft = scrollLeft.current - walk;
  }, []);

  const handleScrollMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div className="detail-area">
      <div className="info-card">
        <div className="info-card-header">
          <span className="info-card-name">{wine.name}</span>
          <span className="info-card-year">{wine.year}</span>
        </div>
        <div className="info-card-grid">
          <div className="info-card-field">
            <span className="info-card-label">品种</span>
            <span className="info-card-value">{wine.variety}</span>
          </div>
          <div className="info-card-field">
            <span className="info-card-label">酒精度</span>
            <span className="info-card-value">{wine.alcohol}%</span>
          </div>
          <div className="info-card-field">
            <span className="info-card-label">产区</span>
            <span className="info-card-value">{wine.region}</span>
          </div>
        </div>
      </div>

      <div className="notes-section">
        <h3>品鉴笔记</h3>
        <p className="notes-text">{wine.notes}</p>
      </div>

      <div className="chart-section">
        <h3>风味图谱</h3>
        <SpiderChart flavors={wine.flavors} onChange={handleFlavorChange} />
      </div>

      <div className="similar-section">
        <h3>风格相近酒款</h3>
        {loading ? (
          <p style={{ color: '#8B7355', fontSize: 14 }}>分析中...</p>
        ) : similar.length > 0 ? (
          <div
            ref={scrollRef}
            className="similar-scroll"
            onMouseDown={handleScrollMouseDown}
            onMouseMove={handleScrollMouseMove}
            onMouseUp={handleScrollMouseUp}
            onMouseLeave={handleScrollMouseUp}
          >
            {similar.map(sw => (
              <div
                key={sw.id}
                className="similar-card"
                onClick={() => {
                  if (!isDragging.current) onSimilarSelect(sw.id);
                }}
              >
                <div className="similar-card-name">{sw.name}</div>
                <div className="similar-card-meta">{sw.year} · {sw.region}</div>
                <div className="similar-card-score">
                  相似度 {Math.round(sw.cosSim * 100)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#8B7355', fontSize: 14 }}>暂无推荐</p>
        )}
      </div>
    </div>
  );
}
