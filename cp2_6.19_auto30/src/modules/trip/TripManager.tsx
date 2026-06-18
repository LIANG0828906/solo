import React, { useState } from 'react';
import { TripCard } from './TripCard';
import { TripFormData } from './types';
import { useStore } from '@/modules/expense/store';

interface TripManagerProps {
  onSelectTrip: (tripId: string) => void;
}

export const TripManager: React.FC<TripManagerProps> = ({ onSelectTrip }) => {
  const { trips, addTrip, getTotalSpent } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TripFormData>({
    destination: '',
    currency: 'CNY',
    budget: 0,
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TripFormData, string>>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateField = (name: keyof TripFormData, value: string | number): string | null => {
    switch (name) {
      case 'destination':
        if (!value) return '请输入目的地';
        if (typeof value === 'string' && value.length > 20) return '目的地名称不超过20个字符';
        return null;
      case 'budget':
        if (!value || Number(value) <= 0) return '请输入有效预算金额';
        return null;
      case 'startDate':
        if (!value) return '请选择开始日期';
        return null;
      case 'endDate':
        if (!value) return '请选择结束日期';
        if (formData.startDate && value < formData.startDate) return '结束日期不能早于开始日期';
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (name: keyof TripFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error || undefined }));
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof TripFormData, string>> = {};
    let hasError = false;

    (Object.keys(formData) as Array<keyof TripFormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);

    if (hasError) return;

    addTrip(formData);
    setShowModal(false);
    setFormData({
      destination: '',
      currency: 'CNY',
      budget: 0,
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">我的旅行</h1>
          <p className="page-subtitle">管理你的旅行预算，记录每一笔开销</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新建旅行
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✈️</div>
          <p>还没有旅行项目，创建一个开始记录吧！</p>
        </div>
      ) : (
        <div className="grid-cards">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onSelect={onSelectTrip}
              totalSpent={getTotalSpent(trip.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="glass-modal" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="glass-modal-content">
            <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '24px' }}>
              创建新旅行
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">目的地</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  onFocus={() => handleFocus('destination')}
                  onBlur={handleBlur}
                  placeholder="例如：东京"
                  style={{
                    transform: focusedField === 'destination' ? 'scale(1.02)' : 'scale(1)',
                  }}
                />
                {errors.destination && (
                  <p style={{ color: 'var(--accent-coral)', fontSize: '12px', marginTop: '6px', animation: 'fadeIn 0.3s ease-out' }}>
                    {errors.destination}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">目标货币</label>
                <select
                  className="form-input"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  onFocus={() => handleFocus('currency')}
                  onBlur={handleBlur}
                  style={{
                    transform: focusedField === 'currency' ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <option value="CNY">人民币 (CNY)</option>
                  <option value="USD">美元 (USD)</option>
                  <option value="EUR">欧元 (EUR)</option>
                  <option value="JPY">日元 (JPY)</option>
                  <option value="GBP">英镑 (GBP)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">总预算</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.budget || ''}
                  onChange={(e) => handleInputChange('budget', Number(e.target.value))}
                  onFocus={() => handleFocus('budget')}
                  onBlur={handleBlur}
                  placeholder="请输入预算金额"
                  style={{
                    transform: focusedField === 'budget' ? 'scale(1.02)' : 'scale(1)',
                  }}
                />
                {errors.budget && (
                  <p style={{ color: 'var(--accent-coral)', fontSize: '12px', marginTop: '6px', animation: 'fadeIn 0.3s ease-out' }}>
                    {errors.budget}
                  </p>
                )}
              </div>

              <div className="flex gap-md">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">开始日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    onFocus={() => handleFocus('startDate')}
                    onBlur={handleBlur}
                    style={{
                      transform: focusedField === 'startDate' ? 'scale(1.02)' : 'scale(1)',
                    }}
                  />
                  {errors.startDate && (
                    <p style={{ color: 'var(--accent-coral)', fontSize: '12px', marginTop: '6px', animation: 'fadeIn 0.3s ease-out' }}>
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">结束日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    onFocus={() => handleFocus('endDate')}
                    onBlur={handleBlur}
                    style={{
                      transform: focusedField === 'endDate' ? 'scale(1.02)' : 'scale(1)',
                    }}
                  />
                  {errors.endDate && (
                    <p style={{ color: 'var(--accent-coral)', fontSize: '12px', marginTop: '6px', animation: 'fadeIn 0.3s ease-out' }}>
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-md" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
