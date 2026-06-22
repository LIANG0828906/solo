import React, { useState, useMemo } from 'react';
import {
  CategoryType,
  CycleType,
  CATEGORY_MAP,
  CYCLE_MAP,
  calculateYearlyCost,
} from '../utils/subscriptionLogic';

interface AddSubscriptionModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: CategoryType;
    cycle: CycleType;
    amount: number;
    expiryDate: string;
    isActive: boolean;
    trialReminder: boolean;
  }) => void;
}

export default function AddSubscriptionModal({
  onClose,
  onSubmit,
}: AddSubscriptionModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('streaming');
  const [cycle, setCycle] = useState<CycleType>('monthly');
  const [amount, setAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [trialReminder, setTrialReminder] = useState(false);

  const yearlyCost = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return 0;
    return calculateYearlyCost(numAmount, cycle);
  }, [amount, cycle]);

  const isValid = useMemo(() => {
    const numAmount = parseFloat(amount);
    return (
      name.trim().length > 0 &&
      !isNaN(numAmount) &&
      numAmount > 0 &&
      expiryDate.length > 0
    );
  }, [name, amount, expiryDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSubmit({
      name: name.trim(),
      category,
      cycle,
      amount: parseFloat(amount),
      expiryDate,
      isActive: true,
      trialReminder,
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">添加新订阅</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">服务名称</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：Netflix、Spotify"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">类别</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
            >
              {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.emoji} {value.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">计费周期</label>
            <div className="cycle-selector">
              {Object.entries(CYCLE_MAP).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  className={`cycle-option ${cycle === key ? 'active' : ''}`}
                  onClick={() => setCycle(key as CycleType)}
                >
                  {value.label}
                </button>
              ))}
            </div>
            {yearlyCost > 0 && (
              <div className="yearly-hint">
                年均费用：<strong>¥{yearlyCost.toFixed(2)}</strong>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">金额</label>
            <div className="input-with-prefix">
              <span className="input-prefix">¥</span>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">到期日期</label>
            <input
              type="date"
              className="form-input"
              value={expiryDate}
              min={minDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="form-switch">
            <span className="form-switch-label">开启试用提醒</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={trialReminder}
                onChange={(e) => setTrialReminder(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!isValid}
            >
              添加订阅
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
