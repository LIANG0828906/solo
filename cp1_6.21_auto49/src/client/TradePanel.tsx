import React, { useState, useEffect } from 'react';

export interface ResourceData {
  id: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  priceChange: 'up' | 'down' | 'stable';
}

interface TradePanelProps {
  planetName: string;
  resources: ResourceData[];
  credits: number;
  inventory: Record<string, number>;
  cargoUsed: number;
  cargoCapacity: number;
  onTrade: (resourceId: string, action: 'buy' | 'sell', quantity: number) => Promise<string | null>;
  onBuyEnergy?: () => Promise<string | null>;
  energy: number;
  onClose: () => void;
}

const ResourceRow: React.FC<{
  resource: ResourceData;
  owned: number;
  credits: number;
  spaceLeft: number;
  onBuy: (qty: number) => Promise<string | null>;
  onSell: (qty: number) => Promise<string | null>;
}> = ({ resource, owned, credits, spaceLeft, onBuy, onSell }) => {
  const [qty, setQty] = useState(1);
  const [priceAnim, setPriceAnim] = useState<'up' | 'down' | ''>('');
  const [btnScale, setBtnScale] = useState<'buy' | 'sell' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resource.priceChange !== 'stable') {
      setPriceAnim(resource.priceChange);
      const timer = setTimeout(() => setPriceAnim(''), 500);
      return () => clearTimeout(timer);
    }
  }, [resource.currentPrice, resource.priceChange]);

  const total = resource.currentPrice * qty;
  const canBuy = credits >= total && spaceLeft >= qty;
  const canSell = owned >= qty;

  const handleBuy = async () => {
    setBtnScale('buy');
    setTimeout(() => setBtnScale(null), 150);
    setError(null);
    const err = await onBuy(qty);
    if (err) setError(err);
  };

  const handleSell = async () => {
    setBtnScale('sell');
    setTimeout(() => setBtnScale(null), 150);
    setError(null);
    const err = await onSell(qty);
    if (err) setError(err);
  };

  return (
    <div
      style={{
        padding: 12,
        marginBottom: 8,
        background: 'rgba(15, 15, 35, 0.8)',
        borderRadius: 8,
        border: '1px solid rgba(0, 255, 255, 0.1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{resource.name}</span>
        <span
          className={priceAnim === 'up' ? 'price-up' : priceAnim === 'down' ? 'price-down' : ''}
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: priceAnim === 'up' ? '#00E676' : priceAnim === 'down' ? '#FF5252' : '#E0E0E0'
          }}
        >
          {resource.priceChange === 'up' ? '▲' : resource.priceChange === 'down' ? '▼' : '●'} {resource.currentPrice}¢
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
        持有: <span style={{ color: '#E0E0E0' }}>{owned}</span> 单位
      </div>

      {error && (
        <div style={{ color: '#FF5252', fontSize: 12, marginBottom: 8 }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          style={{
            width: 60,
            padding: '6px 8px',
            background: '#1A1A2E',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            borderRadius: 4,
            color: '#E0E0E0',
            fontSize: 13,
            outline: 'none'
          }}
        />

        <button
          onClick={handleBuy}
          disabled={!canBuy}
          className="btn-hover"
          style={{
            flex: 1,
            padding: '8px 12px',
            background: canBuy ? 'linear-gradient(135deg, #00E676, #00A859)' : '#333',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: canBuy ? 'pointer' : 'not-allowed',
            opacity: canBuy ? 1 : 0.5,
            transform: btnScale === 'buy' ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.1s'
          }}
        >
          买入 {total}¢
        </button>

        <button
          onClick={handleSell}
          disabled={!canSell}
          className="btn-hover"
          style={{
            flex: 1,
            padding: '8px 12px',
            background: canSell ? 'linear-gradient(135deg, #FF5252, #D32F2F)' : '#333',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: canSell ? 'pointer' : 'not-allowed',
            opacity: canSell ? 1 : 0.5,
            transform: btnScale === 'sell' ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.1s'
          }}
        >
          卖出 +{total}¢
        </button>
      </div>
    </div>
  );
};

const TradePanel: React.FC<TradePanelProps> = ({
  planetName,
  resources,
  credits,
  inventory,
  cargoUsed,
  cargoCapacity,
  onTrade,
  onBuyEnergy,
  energy,
  onClose
}) => {
  const spaceLeft = cargoCapacity - cargoUsed;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #0F0F24 0%, #0A0A1A 100%)',
        borderRadius: 12,
        border: '1px solid rgba(0, 255, 255, 0.15)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(0, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(0, 255, 255, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>当前星球</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#00FFFF' }}>{planetName}</div>
        </div>
        <button
          onClick={onClose}
          className="btn-hover"
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
            color: '#888',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          关闭
        </button>
      </div>

      <div style={{ padding: 16, flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
        <div
          style={{
            padding: 12,
            background: 'rgba(0, 255, 255, 0.05)',
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid rgba(0, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#888' }}>可用资金</span>
            <span style={{ color: '#FFC107', fontWeight: 700 }}>{credits}¢</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#888' }}>货仓空间</span>
            <span style={{ color: spaceLeft > 10 ? '#00E676' : '#FF5252', fontWeight: 600 }}>
              {spaceLeft} / {cargoCapacity}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#888' }}>能源储备</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#45B7D1', fontWeight: 600 }}>{energy}</span>
              {onBuyEnergy && (
                <button
                  onClick={onBuyEnergy}
                  className="btn-hover"
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    background: 'linear-gradient(135deg, #45B7D1, #1976D2)',
                    border: 'none',
                    borderRadius: 4,
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  补充能源 +5 (30¢)
                </button>
              )}
            </div>
          </div>
        </div>

        {resources.map(resource => (
          <ResourceRow
            key={resource.id}
            resource={resource}
            owned={inventory[resource.id] || 0}
            credits={credits}
            spaceLeft={spaceLeft}
            onBuy={(qty) => onTrade(resource.id, 'buy', qty)}
            onSell={(qty) => onTrade(resource.id, 'sell', qty)}
          />
        ))}
      </div>
    </div>
  );
};

export default TradePanel;
