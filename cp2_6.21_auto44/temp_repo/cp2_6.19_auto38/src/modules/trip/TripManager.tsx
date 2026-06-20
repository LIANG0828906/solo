import React, { useState, useCallback } from 'react';
import TripCard from './TripCard';
import type { TripFormData } from './types';
import { useTripStore } from './store';
import { CURRENCY_LIST } from '@/utils/currency';

interface TripManagerProps {
  onSelectTrip: (tripId: string) => void;
}

interface FormErrors {
  destination?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
}

export const TripManager: React.FC<TripManagerProps> = ({ onSelectTrip }) => {
  const { trips, currentTripId, addTrip } = useTripStore((state) => ({
    trips: state.trips,
    currentTripId: state.currentTripId,
    addTrip: state.addTrip,
  }));
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TripFormData>({
    destination: '',
    currency: 'CNY',
    budget: 0,
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const validateField = useCallback((name: keyof TripFormData, value: string | number): string | undefined => {
    switch (name) {
      case 'destination':
        if (!value || (value as string).trim().length === 0) {
          return '请输入目的地';
        }
        if ((value as string).length > 50) {
          return '目的地名称不能超过50个字符';
        }
        return undefined;
      case 'budget':
        if (typeof value === 'number' && value <= 0) {
          return '预算金额必须大于0';
        }
        if (typeof value === 'number' && value > 100000000) {
          return '预算金额过大';
        }
        return undefined;
      case 'startDate':
        if (!value) {
          return '请选择开始日期';
        }
        return undefined;
      case 'endDate':
        if (!value) {
          return '请选择结束日期';
        }
        if (formData.startDate && new Date(value as string) < new Date(formData.startDate)) {
          return '结束日期不能早于开始日期';
        }
        return undefined;
      default:
        return undefined;
    }
  }, [formData.startDate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'budget' ? parseFloat(value) || 0 : value;
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    
    if (touched[name]) {
      const error = validateField(name as keyof TripFormData, processedValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'budget' ? parseFloat(value) || 0 : value;
    
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof TripFormData, processedValue);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    (Object.keys(formData) as Array<keyof TripFormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    setTouched({
      destination: true,
      budget: true,
      startDate: true,
      endDate: true,
    });
    
    return isValid;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    addTrip(formData);
    setShowModal(false);
    setFormData({
      destination: '',
      currency: 'CNY',
      budget: 0,
      startDate: '',
      endDate: '',
    });
    setErrors({});
    setTouched({});
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setErrors({});
    setTouched({});
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的旅行</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 创建新项目
        </button>
      </div>
      
      {trips.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-xl font-semibold mb-2">还没有旅行项目</h3>
          <p className="text-muted mb-6">创建你的第一个旅行项目，开始记录开销吧！</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onSelect={onSelectTrip}
              isActive={currentTripId === trip.id}
            />
          ))}
        </div>
      )}
      
      <div className={`modal-overlay ${showModal ? 'show' : ''}`} onClick={handleCloseModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-6">创建新旅行项目</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">目的地</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.destination && touched.destination ? 'error' : ''}`}
                placeholder="例如：东京、巴黎、曼谷"
              />
              <div className={`error-message ${errors.destination && touched.destination ? 'show' : ''}`}>
                {errors.destination}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">货币类型</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="form-input"
              >
                {CURRENCY_LIST.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">总预算金额</label>
              <input
                type="number"
                name="budget"
                value={formData.budget || ''}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.budget && touched.budget ? 'error' : ''}`}
                placeholder="请输入预算金额"
                min="0"
                step="0.01"
              />
              <div className={`error-message ${errors.budget && touched.budget ? 'show' : ''}`}>
                {errors.budget}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">开始日期</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.startDate && touched.startDate ? 'error' : ''}`}
                />
                <div className={`error-message ${errors.startDate && touched.startDate ? 'show' : ''}`}>
                  {errors.startDate}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">结束日期</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.endDate && touched.endDate ? 'error' : ''}`}
                />
                <div className={`error-message ${errors.endDate && touched.endDate ? 'show' : ''}`}>
                  {errors.endDate}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button type="button" className="btn btn-secondary flex-1" onClick={handleCloseModal}>
                取消
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                创建项目
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripManager;
