import React, { useState } from 'react';
import {
  useGameStore,
  ResourceType,
  getResourceName,
  MarketOrder,
} from './store';

const RESOURCE_ICONS: Record<ResourceType, string> = {
  money: '💰',
  wood: '🪵',
  iron: '⛓️',
  food: '🍞',
  product: '📦',
};

export default function Market() {
  const {
    marketOrders,
    createMarketOrder,
    acceptMarketOrder,
    getCurrentPlayer,
    currentPlayerId,
  } = useGameStore();

  const [itemType, setItemType] = useState<ResourceType>('wood');
  const [quantity, setQuantity] = useState(10);
  const [pricePerUnit, setPricePerUnit] = useState(10);
  const [isBuyOrder, setIsBuyOrder] = useState(false);
  const [tab, setTab] = useState<'all' | 'sell' | 'buy'>('all');

  const player = getCurrentPlayer();

  const filteredOrders = marketOrders.filter((o) => {
    if (tab === 'sell') return !o.isBuyOrder;
    if (tab === 'buy') return o.isBuyOrder;
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const handleSubmit = () => {
    if (quantity <= 0 || pricePerUnit <= 0) return;
    createMarketOrder({ itemType, quantity, pricePerUnit, isBuyOrder });
  };

  return (
    <div style={panelStyle}>
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(233, 69, 96, 0.1))',
        borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
      }}>
        <div style={{ color: '#ffd700', fontSize: 16, fontWeight: 'bold' }}>
          🏛️ 中央市场
        </div>
      </div>

      <div style={{ padding: 16, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 10,
          padding: 14,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ color: '#aaa', fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            📝 挂单
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[{ v: false, l: '出售' }, { v: true, l: '求购' }].map(({ v, l }) => (
              <button
                key={l}
                onClick={() => setIsBuyOrder(v)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 13,
                  transition: 'all 0.15s',
                  background: isBuyOrder === v
                    ? (v ? 'linear-gradient(135deg, #32cd32, #228b22)' : 'linear-gradient(135deg, #e94560, #c73650)')
                    : 'rgba(255,255,255,0.05)',
                  color: isBuyOrder === v ? '#fff' : '#888',
                }}
              >
                {v ? '🛒' : '💰'} {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>物品</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ResourceType)}
                style={inputStyle}
              >
                {(['wood', 'iron', 'food', 'product'] as ResourceType[]).map((r) => (
                  <option key={r} value={r}>
                    {RESOURCE_ICONS[r]} {getResourceName(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>单价</label>
              <input
                type="number"
                min={1}
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(Math.max(1, parseInt(e.target.value) || 1))}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>数量</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 10px',
            background: 'rgba(255, 215, 0, 0.08)',
            borderRadius: 6,
            marginBottom: 10,
          }}>
            <span style={{ color: '#aaa', fontSize: 12 }}>总计</span>
            <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 15 }}>
              💰 {(quantity * pricePerUnit).toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!player}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              cursor: player ? 'pointer' : 'not-allowed',
              background: isBuyOrder
                ? 'linear-gradient(135deg, #32cd32, #228b22)'
                : 'linear-gradient(135deg, #e94560, #c73650)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 14,
              transition: 'all 0.15s',
            }}
            onMouseDown={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            {isBuyOrder ? '🛒 发布求购' : '💰 发布出售'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'sell', 'buy'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 'bold',
                background: tab === t ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.03)',
                color: tab === t ? '#ffd700' : '#888',
                borderBottom: tab === t ? '2px solid #ffd700' : '2px solid transparent',
              }}
            >
              {t === 'all' ? '全部' : t === 'sell' ? '出售' : '求购'}
            </button>
          ))}
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingRight: 4,
        }}>
          {filteredOrders.length === 0 && (
            <div style={{ color: '#555', textAlign: 'center', padding: 30, fontSize: 13 }}>
              暂无挂单
            </div>
          )}
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isOwn={order.sellerId === currentPlayerId}
              onAccept={() => acceptMarketOrder(order.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, isOwn, onAccept }: {
  order: MarketOrder;
  isOwn: boolean;
  onAccept: () => void;
}) {
  return (
    <div
      style={{
        padding: 12,
        background: order.justFilled
          ? 'rgba(50, 205, 50, 0.2)'
          : 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        border: order.justFilled
          ? '1px solid #32cd32'
          : `1px solid ${order.isBuyOrder ? 'rgba(50, 205, 50, 0.2)' : 'rgba(233, 69, 96, 0.2)'}`,
        animation: order.justFilled ? 'flashGreen 1s ease' : 'fadeIn 0.4s ease',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{RESOURCE_ICONS[order.itemType]}</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
              {getResourceName(order.itemType)} × {order.quantity}
            </div>
            <div style={{ color: '#888', fontSize: 11 }}>
              卖家: {order.sellerName}
            </div>
          </div>
        </div>
        <span style={{
          padding: '3px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 'bold',
          background: order.isBuyOrder ? 'rgba(50, 205, 50, 0.2)' : 'rgba(233, 69, 96, 0.2)',
          color: order.isBuyOrder ? '#32cd32' : '#e94560',
        }}>
          {order.isBuyOrder ? '求购' : '出售'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 16 }}>
            💰 {order.pricePerUnit}
          </span>
          <span style={{ color: '#666', fontSize: 12, marginLeft: 4 }}>/个</span>
          <span style={{ color: '#888', fontSize: 12, marginLeft: 10 }}>
            合计 💰{(order.pricePerUnit * order.quantity).toLocaleString()}
          </span>
        </div>
        {!isOwn && !order.justFilled && (
          <button
            onClick={onAccept}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: order.isBuyOrder
                ? 'linear-gradient(135deg, #32cd32, #228b22)'
                : 'linear-gradient(135deg, #e94560, #c73650)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 12,
              transition: 'all 0.15s',
            }}
            onMouseDown={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(0.95)'; }}
            onMouseUp={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            {order.isBuyOrder ? '卖给TA' : '购买'}
          </button>
        )}
        {isOwn && (
          <span style={{ color: '#666', fontSize: 11 }}>我的挂单</span>
        )}
        {order.justFilled && (
          <span style={{ color: '#32cd32', fontSize: 12, fontWeight: 'bold' }}>✓ 已成交</span>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes flashGreen {
          0%, 100% { background: rgba(50, 205, 50, 0.1); }
          50% { background: rgba(50, 205, 50, 0.4); }
        }
      `}</style>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #1e1e3a 0%, #16162a 100%)',
  borderRadius: 12,
  border: '1px solid rgba(0, 212, 255, 0.2)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#888',
  fontSize: 11,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};
