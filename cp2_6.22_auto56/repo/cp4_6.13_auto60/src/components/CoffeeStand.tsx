import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store';
import type { CoffeeBean } from '../types';
import '../styles/coffee-stand.css';

function BeanDetailModal({
  bean,
  onClose,
}: {
  bean: CoffeeBean | null;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    if (!bean) return;
    setClosing(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bean]);

  if (!bean) return null;

  const priceChange = bean.marketPrice - bean.basePrice;
  const priceChangePct = ((priceChange / bean.basePrice) * 100).toFixed(1);

  return createPortal(
    <div className="bean-modal-overlay" onClick={handleClose}>
      <div
        className={`bean-modal ${closing ? 'bean-modal-exit' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="bean-modal-close" onClick={handleClose} aria-label="关闭">
          ✕
        </button>
        <div className="bean-modal-header">
          <span className="bean-modal-emoji">{bean.emoji}</span>
          <div>
            <h2 className="bean-modal-title">{bean.name}</h2>
            <span className={`bean-price-tag ${priceChange >= 0 ? 'up' : 'down'}`}>
              市场价 ¥{bean.marketPrice.toFixed(2)}/100g
              {priceChange !== 0 && (
                <span className="bean-price-delta">
                  {priceChange >= 0 ? '↑' : '↓'}
                  {Math.abs(Number(priceChangePct))}%
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="bean-roast-row">
          <span className="bean-roast-label">烘焙程度</span>
          <div className="bean-roast-bar">
            <div
              className="bean-roast-fill"
              style={{
                width: `${
                  bean.roastLevel === '浅度烘焙'
                    ? 25
                    : bean.roastLevel === '中度烘焙'
                      ? 50
                      : bean.roastLevel === '中深烘焙'
                        ? 75
                        : 100
                }%`,
              }}
            />
          </div>
          <span className="bean-roast-value">{bean.roastLevel}</span>
        </div>

        <div className="bean-flavor-grid">
          <div className="bean-flavor-card">
            <div className="flavor-label acid">酸度</div>
            <div className="flavor-bar">
              <div className="flavor-fill acid-fill" style={{ width: `${bean.baseAcid}%` }} />
            </div>
            <div className="flavor-value">{bean.baseAcid}</div>
          </div>
          <div className="bean-flavor-card">
            <div className="flavor-label bitter">苦度</div>
            <div className="flavor-bar">
              <div className="flavor-fill bitter-fill" style={{ width: `${bean.baseBitter}%` }} />
            </div>
            <div className="flavor-value">{bean.baseBitter}</div>
          </div>
          <div className="bean-flavor-card">
            <div className="flavor-label sweet">甜度</div>
            <div className="flavor-bar">
              <div className="flavor-fill sweet-fill" style={{ width: `${bean.baseSweet}%` }} />
            </div>
            <div className="flavor-value">{bean.baseSweet}</div>
          </div>
        </div>

        <div className="bean-profile-box">
          <div className="bean-profile-title">风味简介</div>
          <p className="bean-profile-text">{bean.flavorProfile}</p>
        </div>

        <div className="bean-stock-footer">
          <span>📦 当前库存</span>
          <strong className={`bean-stock-num ${bean.stockGrams < 80 ? 'low' : ''}`}>
            {bean.stockGrams}g
          </strong>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function CoffeeStand() {
  const beans = useGameStore((s) => s.beans);
  const dayCount = useGameStore((s) => s.dayCount);
  const [selectedBean, setSelectedBean] = useState<CoffeeBean | null>(null);

  const headerNote = useMemo(() => {
    return `第 ${dayCount} 天 · 市场价每日波动 ±15%`;
  }, [dayCount]);

  return (
    <div>
      <h2 className="section-title">☕ 吧台 · 咖啡豆库存</h2>
      <div className="stand-subtitle">{headerNote}</div>
      <div className="bean-grid">
        {beans.map((bean) => {
          const priceChange = bean.marketPrice - bean.basePrice;
          const priceTrend = priceChange > 0.01 ? 'up' : priceChange < -0.01 ? 'down' : 'flat';
          return (
            <button
              key={bean.id}
              type="button"
              className="bean-card"
              onClick={() => setSelectedBean(bean)}
            >
              <div className="bean-card-top">
                <span className="bean-card-emoji">{bean.emoji}</span>
                <span className={`bean-trend-badge ${priceTrend}`}>
                  {priceTrend === 'up' ? '📈' : priceTrend === 'down' ? '📉' : '➖'}
                </span>
              </div>
              <h3 className="bean-card-name">{bean.name}</h3>
              <div className="bean-card-roast">{bean.roastLevel}</div>
              <div className="bean-card-stats">
                <div className="bean-stat-row">
                  <span>库存</span>
                  <strong className={bean.stockGrams < 80 ? 'stock-low' : ''}>
                    {bean.stockGrams}g
                  </strong>
                </div>
                <div className="bean-stat-row">
                  <span>售价</span>
                  <strong className={`price-${priceTrend}`}>
                    ¥{bean.marketPrice.toFixed(2)}
                  </strong>
                </div>
              </div>
              <div className="bean-card-miniflavor">
                <span title="酸度" className="mf mf-a" style={{ width: `${bean.baseAcid}%` }} />
                <span title="苦度" className="mf mf-b" style={{ width: `${bean.baseBitter}%` }} />
                <span title="甜度" className="mf mf-s" style={{ width: `${bean.baseSweet}%` }} />
              </div>
              <div className="bean-card-hint">点击查看详情 →</div>
            </button>
          );
        })}
      </div>

      <BeanDetailModal bean={selectedBean} onClose={() => setSelectedBean(null)} />
    </div>
  );
}
