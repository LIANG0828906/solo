import { memo } from 'react';
import { GameState } from '../engine/GameState';
import { FaCashRegister, FaStore, FaBoxOpen } from 'react-icons/fa';

interface Props {
  state: GameState;
  onToggleCashier: (id: number) => void;
  onToggleSelf: (id: number) => void;
  onQuickRestock: () => void;
}

export const ControlBar = memo(function ControlBar({ state, onToggleCashier, onToggleSelf, onQuickRestock }: Props) {
  const lowStockCount = state.shelves.filter((s) => s.stock < 30 && !s.restocking).length;

  return (
    <div className="control-bar">
      <div className="control-section">
        <div className="section-title">
          <FaCashRegister /> 收银台
        </div>
        <div className="button-group">
          {state.cashiers.map((c) => {
            const queueCount = c.queue.length + (c.currentCustomerId ? 1 : 0);
            return (
              <button
                key={c.id}
                className={`control-btn cashier-btn ${c.open ? 'on' : 'off'}`}
                onClick={() => onToggleCashier(c.id)}
                title={`收银台 #${c.id}`}
              >
                <span className="btn-icon">{c.open ? '🛒' : '🚫'}</span>
                <span className="btn-num">#{c.id}</span>
                <span className={`queue-badge ${queueCount >= 6 ? 'danger' : queueCount >= 4 ? 'warn' : ''}`}>
                  {queueCount}
                </span>
                <span className="rate-badge">{c.rate.toFixed(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="divider" />

      <div className="control-section">
        <div className="section-title">
          <FaStore /> 自助结账机
        </div>
        <div className="button-group">
          {state.selfCheckouts.map((s) => (
            <button
              key={s.id}
              className={`control-btn self-btn ${s.enabled ? (s.inUse ? 'busy' : 'on') : 'off'}`}
              onClick={() => onToggleSelf(s.id)}
              title={`自助结账机 #${s.id}`}
            >
              <span className="btn-icon">{s.enabled ? '💳' : '⚠️'}</span>
              <span className="btn-num">#{s.id}</span>
              {s.inUse && <span className="busy-dot" />}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div className="control-section">
        <div className="section-title">
          <FaBoxOpen /> 库存管理
        </div>
        <div className="button-group">
          <button
            className={`control-btn restock-btn ${lowStockCount > 0 ? 'urgent' : ''}`}
            onClick={onQuickRestock}
            title="一键补货 - 自动补最低库存货架"
          >
            <span className="btn-icon">🚚</span>
            <span className="restock-text">快速补货</span>
            {lowStockCount > 0 && (
              <span className="restock-badge">{lowStockCount}</span>
            )}
          </button>
        </div>

        <div className="shelf-mini-list">
          {state.shelves.map((s) => (
            <div
              key={s.id}
              className={`shelf-mini ${s.stock < 30 ? 'low' : ''} ${s.restocking ? 'restocking' : ''}`}
              title={`货架 #${s.id} 库存: ${s.stock.toFixed(0)}%`}
            >
              <div
                className="shelf-mini-fill"
                style={{ width: `${s.stock}%` }}
              />
              <span className="shelf-mini-label">{s.stock.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
