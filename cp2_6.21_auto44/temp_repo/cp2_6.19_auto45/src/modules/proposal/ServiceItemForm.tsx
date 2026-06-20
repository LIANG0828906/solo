import { Trash2 } from 'lucide-react';
import type { ServiceItem } from './types';
import { formatCurrency } from '@/api/mockApi';

interface ServiceItemFormProps {
  item: ServiceItem;
  index: number;
  onUpdate: (patch: Partial<ServiceItem>) => void;
  onRemove: () => void;
}

export function ServiceItemForm({ item, index, onUpdate, onRemove }: ServiceItemFormProps) {
  const subtotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);

  return (
    <div className="ff-service-item">
      <div className="ff-service-item__head">
        <span className="ff-service-item__idx">#{index + 1}</span>
        <button
          type="button"
          className="ff-btn ff-btn--danger ff-btn--icon ff-btn--sm"
          onClick={onRemove}
          title="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label className="ff-label">服务名称</label>
          <input
            type="text"
            className="ff-input"
            value={item.name}
            placeholder="例如：UI/UX 设计"
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>

        <div>
          <label className="ff-label">服务描述</label>
          <textarea
            className="ff-textarea"
            value={item.description}
            placeholder="描述服务内容和范围..."
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>

        <div className="ff-service-item__row">
          <div>
            <label className="ff-label">单价 (¥)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="ff-input"
              value={item.unitPrice}
              onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="ff-label">数量</label>
            <input
              type="number"
              min="1"
              step="1"
              className="ff-input"
              value={item.quantity}
              onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="ff-label">小计</label>
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(249,115,22,0.06))',
              border: '1px solid rgba(99,102,241,0.12)',
              textAlign: 'right',
              fontWeight: 700,
              fontSize: '15px',
              fontFamily: "'Playfair Display', serif",
              color: '#0f172a',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
              {formatCurrency(subtotal)}
            </div>
          </div>
        </div>
      </div>

      <div className="ff-service-item__sub">
        <span className="ff-service-item__label">项目小计</span>
        <span className="ff-service-item__price">{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}
