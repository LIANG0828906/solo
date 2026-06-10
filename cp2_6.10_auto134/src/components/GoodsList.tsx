import React from 'react';
import { useLedgerStore } from '../store';
import type { Goods } from '../types';

const FlameIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="flame-icon">
    <path d="M12 2C12 2 7 8 7 13C7 16.31 9.69 19 13 19C16.31 19 19 16.31 19 13C19 10 15 8 12 2Z M12 22C9.79 22 8 20.21 8 18H16C16 20.21 14.21 22 12 22Z" />
  </svg>
);

interface GoodsCardProps {
  goods: Goods;
  selected: boolean;
  isLow: boolean;
  onClick: () => void;
  safeStock: number;
}

const GoodsCard: React.FC<GoodsCardProps> = ({ goods, selected, isLow, onClick, safeStock }) => {
  const patternClass = goods.pattern || '';
  
  return (
    <div
      className={`goods-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {isLow && (
        <div className="stock-warning">
          <FlameIcon />
        </div>
      )}
      <div className={`goods-thumbnail ${patternClass}`} style={{ background: goods.color }} />
      <div className="goods-info">
        <h3>{goods.name}</h3>
        <p className="price">{goods.unitPrice}文/{goods.unit}</p>
        <p>库存: {goods.stock}{goods.unit}</p>
        <p style={{ color: isLow ? '#ff7f00' : '#666' }}>
          安全库存: {safeStock}{goods.unit}
        </p>
      </div>
    </div>
  );
};

const GoodsList: React.FC = () => {
  const { goods, selectedGoodsId, selectGoods, isLowStock, getSafeStock, loading } = useLedgerStore();

  if (loading && goods.length === 0) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="goods-panel">
      <h2 className="panel-title">货物清单</h2>
      <div className="goods-grid">
        {goods.map((item) => (
          <GoodsCard
            key={item.id}
            goods={item}
            selected={selectedGoodsId === item.id}
            isLow={isLowStock(item)}
            onClick={() => selectGoods(selectedGoodsId === item.id ? null : item.id)}
            safeStock={getSafeStock(item)}
          />
        ))}
      </div>
    </div>
  );
};

export default GoodsList;
