import React, { useState } from 'react';
import { Event } from './types';

interface CreateEventProps {
  onCreate: (eventData: Omit<Event, 'id' | 'participants' | 'createdAt'>) => void;
}

const CreateEvent: React.FC<CreateEventProps> = ({ onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    duration: '',
    location: '',
    capacity: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入活动名称';
    }

    if (!formData.date) {
      newErrors.date = '请选择活动日期';
    }

    const duration = parseInt(formData.duration);
    if (!formData.duration || isNaN(duration) || duration <= 0) {
      newErrors.duration = '请输入有效的活动时长';
    }

    if (!formData.location.trim()) {
      newErrors.location = '请输入活动地点';
    }

    const capacity = parseInt(formData.capacity);
    if (!formData.capacity || isNaN(capacity) || capacity < 10 || capacity > 200) {
      newErrors.capacity = '总名额必须在10-200之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onCreate({
      name: formData.name.trim(),
      date: formData.date,
      duration: parseInt(formData.duration),
      location: formData.location.trim(),
      capacity: parseInt(formData.capacity),
    });

    setFormData({
      name: '',
      date: '',
      duration: '',
      location: '',
      capacity: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="form-card">
      <h2 style={{ color: '#3B4A6B', marginBottom: '24px', textAlign: 'center' }}>
        创建新活动
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">活动名称</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="请输入活动名称"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && (
            <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px' }}>
              {errors.name}
            </p>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">活动日期</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && (
              <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px' }}>
                {errors.date}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="duration">活动时长（分钟）</label>
            <input
              type="number"
              id="duration"
              name="duration"
              placeholder="如：120"
              min="1"
              value={formData.duration}
              onChange={handleChange}
            />
            {errors.duration && (
              <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px' }}>
                {errors.duration}
              </p>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">活动地点</label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="请输入活动地点"
            value={formData.location}
            onChange={handleChange}
          />
          {errors.location && (
            <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px' }}>
              {errors.location}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="capacity">总名额（10-200）</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            placeholder="请输入活动总名额"
            min="10"
            max="200"
            value={formData.capacity}
            onChange={handleChange}
          />
          {errors.capacity && (
            <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px' }}>
              {errors.capacity}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: '16px' }}
        >
          创建活动
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
