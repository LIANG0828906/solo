import React, { useState } from 'react';
import { SeedItem } from '../../types';

interface ExchangeDialogProps {
  item: SeedItem;
  currentUser: string;
  onClose: () => void;
  onConfirm: (itemId: string, quantity: number) => void;
}

const ExchangeDialog: React.FC<ExchangeDialogProps> = ({ item, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (quantity < 1 || quantity > item.quantity) {
      alert(`请输入1到${item.quantity}之间的数量`);
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm(item.id, quantity);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">确认交换请求</h2>
        <div className="modal-body">
          <div className="card" style={{ cursor: 'default', marginBottom: '20px' }}>
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
                <span className="meta-tag">可交换: {item.quantity}</span>
              </div>
              <p className="card-expected">
                <strong>期望交换：</strong>
                {item.expectedExchange}
              </p>
              <div className="card-footer">
                <span className="card-owner">发布者：{item.ownerNickname}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">交换数量</label>
            <input
              type="number"
              className="form-input"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), item.quantity))}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              您正请求与 <strong>{item.ownerNickname}</strong> 交换 {quantity} 份 {item.seedName}
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '发送中...' : '确认发送请求'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExchangeDialog;
