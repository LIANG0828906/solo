import React, { useState } from 'react';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    duration: 7 | 14 | 30;
    dailyGoal: number;
    unit: string;
    startDate: string;
    inviteCode?: string;
  }) => void;
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    duration: 7 as 7 | 14 | 30,
    dailyGoal: '',
    unit: '',
    startDate: new Date().toISOString().split('T')[0],
    inviteCode: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('请输入挑战名称');
      return;
    }
    if (!formData.dailyGoal || Number(formData.dailyGoal) <= 0) {
      setError('请输入有效的每日目标');
      return;
    }
    if (!formData.unit.trim()) {
      setError('请输入单位');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.startDate);
    if (startDate < today) {
      setError('开始日期不能早于今天');
      return;
    }

    onSubmit({
      ...formData,
      dailyGoal: Number(formData.dailyGoal),
      inviteCode: formData.inviteCode.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
            创建新挑战
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(255, 77, 79, 0.15)',
              border: '1px solid rgba(255, 77, 79, 0.3)',
              borderRadius: '8px',
              color: '#ff7875',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>挑战名称</label>
            <input
              type="text"
              className="input"
              placeholder="如：30天俯卧撑挑战"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>挑战时长</label>
              <select
                className="input"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) as 7 | 14 | 30 })}
              >
                <option value={7}>7 天</option>
                <option value={14}>14 天</option>
                <option value={30}>30 天</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>开始日期</label>
              <input
                type="date"
                className="input"
                value={formData.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>每日目标</label>
              <input
                type="number"
                className="input"
                placeholder="50"
                min="1"
                value={formData.dailyGoal}
                onChange={(e) => setFormData({ ...formData, dailyGoal: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>单位</label>
              <input
                type="text"
                className="input"
                placeholder="个/秒/分钟"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>邀请码（可选）</label>
            <input
              type="text"
              className="input"
              placeholder="留空则公开可见"
              value={formData.inviteCode}
              onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button type="submit" className="btn">
              创建挑战
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.3s ease',
  padding: '20px',
};

const modalStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(42, 64, 85, 0.95) 0%, rgba(26, 42, 58, 0.98) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '20px',
  padding: '32px',
  width: '100%',
  maxWidth: '500px',
  boxShadow: 'var(--shadow-lg)',
  animation: 'slideUp 0.4s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
};

export default CreateChallengeModal;
