import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { eventAPI } from '../services/api';
import type { CreateEventData, Event } from '../types';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: 100,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入活动标题';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入活动描述';
    }

    if (!formData.startTime) {
      newErrors.startTime = '请选择开始时间';
    } else if (new Date(formData.startTime).getTime() <= Date.now()) {
      newErrors.startTime = '活动开始时间必须晚于当前时间';
    }

    if (!formData.endTime) {
      newErrors.endTime = '请选择结束时间';
    } else if (formData.startTime && new Date(formData.endTime).getTime() <= new Date(formData.startTime).getTime()) {
      newErrors.endTime = '结束时间必须晚于开始时间';
    }

    if (!formData.location.trim()) {
      newErrors.location = '请输入活动地点';
    }

    if (!formData.maxParticipants || formData.maxParticipants <= 0 || !Number.isInteger(Number(formData.maxParticipants))) {
      newErrors.maxParticipants = '最大参与人数必须为正整数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const event = await eventAPI.create(formData);
      setCreatedEvent(event);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || '创建活动失败，请重试';
      setErrors({ submit: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxParticipants' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  if (createdEvent) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">活动创建成功</h1>
        </div>
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="qr-container">
            <div className="event-code-display">{createdEvent.code}</div>
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={createdEvent.qrCode}
                size={220}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#1A1A2E"
              />
            </div>
            <h2 style={{ fontSize: '20px', marginTop: '8px' }}>{createdEvent.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
              将此二维码打印或展示给参与者，用于扫码签到
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/events/${createdEvent.id}`)}
              >
                查看活动详情
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/events')}>
                返回活动列表
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">创建活动</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/events')}>
          ← 返回
        </button>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">活动标题 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="请输入活动标题"
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">活动描述 *</label>
            <textarea
              className="form-textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="请输入活动描述"
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">开始时间 *</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
              />
              {errors.startTime && <span className="form-error">{errors.startTime}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">结束时间 *</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
              />
              {errors.endTime && <span className="form-error">{errors.endTime}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">活动地点 *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="请输入活动地点"
              />
              {errors.location && <span className="form-error">{errors.location}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">最大参与人数 *</label>
              <input
                type="number"
                name="maxParticipants"
                min="1"
                step="1"
                value={formData.maxParticipants}
                onChange={handleChange}
              />
              {errors.maxParticipants && <span className="form-error">{errors.maxParticipants}</span>}
            </div>
          </div>

          {errors.submit && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '14px' }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/events')}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '创建中...' : '创建活动'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
