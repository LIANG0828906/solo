import React from 'react';
import { SeedItem } from '../../types';

interface SeedCardProps {
  item: SeedItem;
  currentUser: string;
  onExchange: (item: SeedItem) => void;
  style?: React.CSSProperties;
}

const SeedCard: React.FC<SeedCardProps> = ({ item, currentUser, onExchange, style }) => {
  const isOwner = item.ownerNickname === currentUser;

  return (
    <div className="card" style={style}>
      <div className="card-image">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.seedName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          '🌱'
        )}
      </div>
      <div className="card-content">
        <h3 className="card-title">{item.seedName}</h3>
        <div className="card-meta">
          <span className="meta-tag">{item.variety}</span>
          <span className="meta-tag">📍 {item.location}</span>
          <span className="meta-tag">数量: {item.quantity}</span>
        </div>
        <p className="card-expected">
          <strong>期望交换：</strong>
          {item.expectedExchange}
        </p>
        <div className="card-footer">
          <span className="card-owner">发布者：{item.ownerNickname}</span>
          <div className="card-actions">
            {!isOwner && item.quantity > 0 && (
              <button className="btn btn-primary" onClick={() => onExchange(item)}>
                我想交换
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeedCard;
