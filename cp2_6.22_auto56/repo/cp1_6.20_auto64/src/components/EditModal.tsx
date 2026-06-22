import { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Item, Category, Unit } from '@/api';

interface EditModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onSubmit: (data: Partial<Item>) => Promise<void>;
}

interface FormErrors {
  quantity?: string;
  shelfLifeDays?: string;
}

const CATEGORIES: Category[] = ['蔬菜', '水果', '肉类', '乳制品', '调料'];
const UNITS: Unit[] = ['克', '个', '盒'];

const EditModal = ({ isOpen, item, onClose, onSubmit }: EditModalProps) => {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Unit>('个');
  const [shelfLifeDays, setShelfLifeDays] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(String(item.quantity));
      setUnit(item.unit);
      setShelfLifeDays(String(item.shelfLifeDays));
      setErrors({});
    }
  }, [item]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const qtyNum = Number(quantity);
    const daysNum = Number(shelfLifeDays);

    if (!quantity || isNaN(qtyNum) || qtyNum <= 0) {
      newErrors.quantity = '请输入有效的数量';
    }
    if (!shelfLifeDays || isNaN(daysNum) || daysNum <= 0 || !Number.isInteger(daysNum)) {
      newErrors.shelfLifeDays = '请输入有效的保质天数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({
        quantity: Number(quantity),
        unit,
        shelfLifeDays: Number(shelfLifeDays),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">✏️ 编辑 {item.name}</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">数量</label>
          <div className="form-row">
            <div>
              <input
                type="number"
                className="form-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="请输入数量"
                min="1"
              />
              {errors.quantity && (
                <div className="form-error">{errors.quantity}</div>
              )}
            </div>
            <select
              className="form-select"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">保质天数</label>
          <input
            type="number"
            className="form-input"
            value={shelfLifeDays}
            onChange={(e) => setShelfLifeDays(e.target.value)}
            placeholder="请输入保质天数"
            min="1"
          />
          {errors.shelfLifeDays && (
            <div className="form-error">{errors.shelfLifeDays}</div>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="modal-btn cancel"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </button>
          <button
            className="modal-btn confirm"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditModal;
