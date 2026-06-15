import React, { useState } from 'react';
import { Event } from './types';

interface EnrollModalProps {
  event: Event;
  onConfirm: (eventId: string, name: string, phone: string) => void;
  onCancel: () => void;
}

const EnrollModal: React.FC<EnrollModalProps> = ({ event, onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = '请输入姓名';
    }

    if (!phone.trim()) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '请输入有效的手机号';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onConfirm(event.id, name.trim(), phone.trim());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className="countdown-overlay"
      onClick={onCancel}
    >
      <div
        className="form-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'newCardScale 0.3s ease',
        }}
      >
        <h2 style={{ color: '#3B4A6B', marginBottom: '8px', textAlign: 'center' }}>
          活动报名
        </h2>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: '20px' }}>
          {event.name}
        </p>
        <div style={{ background: '#f8f8f8', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>📅 {formatDate(event.date)}</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>📍 {event.location}</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>👥 剩余名额：{event.capacity - event.participants.length} 人</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="enroll-name">姓名</label>
            <input
              type="text"
              id="enroll-name"
              placeholder="请输入您的姓名"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
            />
            {errors.name && (
              <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px' }}>
                {errors.name}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="enroll-phone">手机号</label>
            <input
              type="tel"
              id="enroll-phone"
              placeholder="请输入您的手机号"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
            />
            {errors.phone && (
              <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px' }}>
                {errors.phone}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn"
              onClick={onCancel}
              style={{ background: '#eee', color: '#666' }}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              确认报名
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollModal;
