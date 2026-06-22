import { useState } from 'react';

interface CreateEventProps {
  onSuccess: (eventId: string) => void;
  onBack: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

function CreateEvent({ onSuccess, onBack, showToast }: CreateEventProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(60);
  const [vipLimit, setVipLimit] = useState(10);
  const [normalLimit, setNormalLimit] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !date || !time || !location) {
      showToast('请填写所有必填字段', 'error');
      return;
    }

    if (vipLimit + normalLimit > maxCapacity) {
      showToast('角色名额总数不能超过活动最大容纳人数', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          date,
          time,
          location,
          maxCapacity,
          roleLimits: {
            VIP: vipLimit,
            普通: normalLimit,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.id);
      } else {
        const errData = await res.json();
        showToast(errData.error || '创建活动失败', 'error');
      }
    } catch (err) {
      showToast('创建活动失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-secondary" onClick={onBack}>
            ← 返回
          </button>
          <h1>创建活动</h1>
        </div>
      </div>

      <div className="form-container">
        <h2>活动基本信息</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>活动名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入活动名称"
            />
          </div>

          <div className="form-group">
            <label>活动日期 *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>活动时间 *</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>活动地点 *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="请输入活动地点"
            />
          </div>

          <div className="form-group">
            <label>最大容纳人数 *</label>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>角色名额限制</label>
            <div className="role-limits">
              <div className="role-limit-item">
                <label style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                  VIP名额
                </label>
                <input
                  type="number"
                  value={vipLimit}
                  onChange={(e) => setVipLimit(Number(e.target.value))}
                  min="0"
                />
              </div>
              <div className="role-limit-item">
                <label style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                  普通名额
                </label>
                <input
                  type="number"
                  value={normalLimit}
                  onChange={(e) => setNormalLimit(Number(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onBack}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting && <span className="loading-spinner" />}
              {submitting ? '发布中...' : '发布活动'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;
