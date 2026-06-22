import React, { useState, useEffect } from 'react';
import type { FoodItem, FoodCategory } from './types';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (food: Omit<FoodItem, 'id'> & { id?: string }) => void;
  editFood?: FoodItem | null;
}

const AddModal: React.FC<AddModalProps> = ({ isOpen, onClose, onSubmit, editFood }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('克');
  const [category, setCategory] = useState<FoodCategory>('vegetable');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [shelfLifeDays, setShelfLifeDays] = useState('');

  useEffect(() => {
    if (editFood) {
      setName(editFood.name);
      setQuantity(editFood.quantity.toString());
      setUnit(editFood.unit);
      setCategory(editFood.category);
      setPurchaseDate(editFood.purchaseDate);
      setShelfLifeDays(editFood.shelfLifeDays.toString());
    } else {
      setName('');
      setQuantity('');
      setUnit('克');
      setCategory('vegetable');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setShelfLifeDays('');
    }
  }, [editFood, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !purchaseDate || !shelfLifeDays) return;

    onSubmit({
      id: editFood?.id,
      name,
      quantity: Number(quantity),
      unit,
      category,
      purchaseDate,
      shelfLifeDays: Number(shelfLifeDays),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
        ...styles.overlay,
        animationName: 'fadeIn',
        animationDuration: '0.2s',
        animationTimingFunction: 'ease',
      }} onClick={onClose}>
      <div style={{
        ...styles.modal,
        animationName: 'scaleIn',
        animationDuration: '0.25s',
        animationTimingFunction: 'ease',
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>{editFood ? '编辑食材' : '添加食材'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="食材名称"
              required
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 2 }}>
              <label style={styles.label}>数量</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={styles.input}
                placeholder="数量"
                min="0"
                required
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>单位</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={styles.select}
              >
                <option value="克">克</option>
                <option value="千克">千克</option>
                <option value="毫升">毫升</option>
                <option value="个">个</option>
                <option value="根">根</option>
                <option value="包">包</option>
                <option value="瓶">瓶</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>类别</label>
            <div style={styles.categoryOptions}>
              {[
                { value: 'vegetable', label: '蔬菜', emoji: '🥬', color: '#10B981' },
                { value: 'meat', label: '肉类', emoji: '🥩', color: '#EF4444' },
                { value: 'seasoning', label: '调味品', emoji: '🧂', color: '#F97316' },
              ].map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value as FoodCategory)}
                  style={{
                    ...styles.categoryBtn,
                    borderColor: category === cat.value ? cat.color : '#e5e7eb',
                    background: category === cat.value ? `${cat.color}10` : 'white',
                  }}
                >
                  <span style={styles.catEmoji}>{cat.emoji}</span>
                  <span style={styles.catLabel}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>购买日期</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>保质期（天）</label>
              <input
                type="number"
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(e.target.value)}
                style={styles.input}
                placeholder="天数"
                min="1"
                required
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              取消
            </button>
            <button type="submit" style={styles.submitBtn}>
              {editFood ? '保存' : '确定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '28px',
    width: '90%',
    maxWidth: '420px',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'scaleIn 0.25s ease',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#1f2937',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    cursor: 'pointer',
    width: '100%',
  },
  categoryOptions: {
    display: 'flex',
    gap: '10px',
  },
  categoryBtn: {
    flex: 1,
    padding: '12px 8px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  catEmoji: {
    fontSize: '24px',
  },
  catLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    background: 'white',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  submitBtn: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
};

export default AddModal;
