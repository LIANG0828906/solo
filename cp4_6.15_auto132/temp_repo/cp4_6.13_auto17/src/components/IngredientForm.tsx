import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Ingredient } from '../types';
import { INGREDIENT_CATEGORIES, INGREDIENT_UNITS, STORAGE_LOCATIONS } from '../types';
import './IngredientForm.css';

interface IngredientFormProps {
  isOpen: boolean;
  editingIngredient?: Ingredient | null;
  onClose: () => void;
  onSubmit: (data: Omit<Ingredient, 'id'>) => void;
}

interface FormErrors {
  name?: string;
  quantity?: string;
  expiryDate?: string;
}

export function IngredientForm({ isOpen, editingIngredient, onClose, onSubmit }: IngredientFormProps) {
  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>({
    name: '',
    category: '蔬菜',
    quantity: 0,
    unit: '克',
    expiryDate: '',
    storageLocation: '冷藏',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      if (editingIngredient) {
        setFormData({
          name: editingIngredient.name,
          category: editingIngredient.category,
          quantity: editingIngredient.quantity,
          unit: editingIngredient.unit,
          expiryDate: editingIngredient.expiryDate,
          storageLocation: editingIngredient.storageLocation,
        });
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7);
        setFormData({
          name: '',
          category: '蔬菜',
          quantity: 0,
          unit: '克',
          expiryDate: tomorrow.toISOString().split('T')[0],
          storageLocation: '冷藏',
        });
      }
      setErrors({});
    }
  }, [isOpen, editingIngredient]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入食材名称';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = '数量必须大于0';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = '请选择保质期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isAnimating ? 'fade-in' : 'fade-out'}`} onClick={handleClose}>
      <div
        className={`modal-content ${isAnimating ? 'slide-in' : 'slide-out'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{editingIngredient ? '编辑食材' : '添加食材'}</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">食材名称 *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'error' : ''}
              placeholder="例如：番茄"
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">类别</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="storageLocation">存放位置</label>
              <select
                id="storageLocation"
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value as Ingredient['storageLocation'] })}
              >
                {STORAGE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">数量 *</label>
              <input
                id="quantity"
                type="number"
                min="0"
                step="0.1"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className={errors.quantity ? 'error' : ''}
              />
              {errors.quantity && <span className="error-text">{errors.quantity}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="unit">单位</label>
              <select
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {INGREDIENT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">保质期 *</label>
            <input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className={errors.expiryDate ? 'error' : ''}
            />
            {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              {editingIngredient ? '保存修改' : '添加食材'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
