import React from 'react';
import { RefreshCw, X, ArrowRightLeft } from 'lucide-react';
import { useGardenStore } from '../store/gardenStore';
import type { Plot } from '../types';
import './ExchangeModal.css';

export const ExchangeModal: React.FC = () => {
  const exchangeTargetId = useGardenStore(s => s.exchangeTargetId);
  const selectedPlotId = useGardenStore(s => s.selectedPlotId);
  const getPlot = useGardenStore(s => s.getPlot);
  const closeExchangeModal = useGardenStore(s => s.closeExchangeModal);
  const exchangePlots = useGardenStore(s => s.exchangePlots);

  if (!exchangeTargetId) return null;

  const target = getPlot(exchangeTargetId);
  const mine = selectedPlotId ? getPlot(selectedPlotId) : undefined;
  const canExchange = mine && mine.status !== 'idle' && mine.id !== target?.id;

  const handleConfirm = () => {
    if (!mine || !target) return;
    exchangePlots(mine.id, target.id);
  };

  return (
    <div className="modal-overlay" onClick={closeExchangeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3><RefreshCw size={18} /> 确认交换地块？</h3>
          <button className="modal__close" onClick={closeExchangeModal} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="modal__body">
          {!canExchange ? (
            <div className="modal__warn">
              <Alert />
              <p>请先在网格中选中您自己的地块，再发起交换请求。</p>
            </div>
          ) : (
            <div className="exchange-body">
              <ExchangeCard label="我的地块" plot={mine!} side="left" />
              <div className="exchange-arrow">
                <ArrowRightLeft size={24} />
                <span>互换</span>
              </div>
              <ExchangeCard label="对方地块" plot={target!} side="right" />
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button type="button" className="modal-btn modal-btn--ghost" onClick={closeExchangeModal}>
            取消
          </button>
          <button
            type="button"
            className="modal-btn modal-btn--primary"
            onClick={handleConfirm}
            disabled={!canExchange}
          >
            确认交换
          </button>
        </div>
      </div>
    </div>
  );
};

const Alert: React.FC = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFA000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

interface CardProps { label: string; plot: Plot; side: 'left'|'right'; }
const ExchangeCard: React.FC<CardProps> = ({ label, plot, side }) => (
  <div className={`exchange-card exchange-card--${side}`}>
    <div className="exchange-card__label">{label}</div>
    <div className="exchange-card__avatar">{plot.ownerAvatar}</div>
    <div className="exchange-card__name">{plot.ownerName}</div>
    <div className="exchange-card__crop">{plot.cropName || '未知作物'}</div>
    <div className="exchange-card__pos">地块 ({plot.row + 1},{plot.col + 1})</div>
    <div className={`exchange-card__status status-${plot.status}`}>
      {plot.status === 'planted' ? '🌱 种植中' : plot.status === 'harvestable' ? '🌾 待收获' : '空闲'}
    </div>
  </div>
);

export default ExchangeModal;
