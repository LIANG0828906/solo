import React, { useState, useEffect } from 'react';
import { Medicine, LOCATIONS, LocationType } from '../types';

interface AddMedicineFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingMedicine?: Medicine | null;
}

interface FormErrors {
  name?: string;
  quantity?: string;
  expiryDate?: string;
}

const AddMedicineForm: React.FC<AddMedicineFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingMedicine,
}) => {
  const [name, setName] = useState('');
  const [specification, setSpecification] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState<LocationType>('客厅药箱');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingMedicine) {
      setName(editingMedicine.name);
      setSpecification(editingMedicine.specification);
      setQuantity(String(editingMedicine.quantity));
      setExpiryDate(editingMedicine.expiryDate);
      setLocation(editingMedicine.location as LocationType);
    } else {
      resetForm();
    }
  }, [editingMedicine, isOpen]);

  const resetForm = () => {
    setName('');
    setSpecification('');
    setQuantity('');
    setExpiryDate('');
    setLocation('客厅药箱');
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = '请输入药品名称';
    }

    const qty = Number(quantity);
    if (quantity === '' || isNaN(qty)) {
      newErrors.quantity = '请输入有效数量';
    } else if (qty < 0) {
      newErrors.quantity = '数量不能为负数';
    }

    if (!expiryDate) {
      newErrors.expiryDate = '请选择有效期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        specification: specification.trim(),
        quantity: Number(quantity),
        expiryDate,
        location,
      });
      resetForm();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ name: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingMedicine ? '编辑药品' : '添加药品'}</h2>
          <button className="close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="medicine-form">
          <div className="form-group">
            <label htmlFor="name">药品名称 <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="请输入药品名称"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="specification">规格</label>
            <input
              type="text"
              id="specification"
              value={specification}
              onChange={e => setSpecification(e.target.value)}
              placeholder="如：每盒12粒"
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity">剩余数量 <span className="required">*</span></label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              min="0"
              placeholder="请输入数量"
              className={errors.quantity ? 'error' : ''}
            />
            {errors.quantity && <span className="error-text">{errors.quantity}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">有效期 <span className="required">*</span></label>
            <input
              type="date"
              id="expiryDate"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              min={today}
              className={errors.expiryDate ? 'error' : ''}
            />
            {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="location">存放位置</label>
            <select
              id="location"
              value={location}
              onChange={e => setLocation(e.target.value as LocationType)}
            >
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : (editingMedicine ? '保存修改' : '添加药品')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicineForm;
