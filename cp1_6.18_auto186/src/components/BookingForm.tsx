import { useState } from 'react';
import { useStore } from '../stores/useStore';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const serviceOptions = [
  { key: 'portrait', label: '肖像拍摄' },
  { key: 'wedding', label: '婚礼跟拍' },
  { key: 'product', label: '产品摄影' }
];

const getMinDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export default function BookingForm() {
  const { submitBooking } = useStore();
  const [form, setForm] = useState({
    serviceType: 'portrait',
    date: getMinDate(),
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return '请填写您的姓名';
    if (!/^1[3-9]\d{9}$/.test(form.phone)) return '请填写正确的手机号';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return '请填写正确的邮箱地址';
    if (form.message.length > 500) return '留言不能超过500字';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    const result = await submitBooking(form);
    setLoading(false);
    if (result.success) {
      setSuccess(`预约成功！预约编号：${result.bookingId}，我们会尽快与您联系。`);
      setForm(f => ({ ...f, name: '', phone: '', email: '', message: '' }));
    } else {
      setError(result.error || '预约失败，请稍后重试');
    }
  };

  return (
    <div className="booking-page page">
      <div className="container">
        <div className="booking-layout">
          <div className="booking-info">
            <h1 className="page-title">预约拍摄服务</h1>
            <p className="page-subtitle">选择心仪的服务，开启您的光影之旅</p>

            <div className="info-cards">
              <div className="info-card glass-card">
                <h3>肖像拍摄</h3>
                <p>专业灯光与构图，打造独属于您的精彩人像</p>
                <span className="price">￥899起</span>
              </div>
              <div className="info-card glass-card">
                <h3>婚礼跟拍</h3>
                <p>全程记录您人生中最珍贵的幸福时刻</p>
                <span className="price">￥3999起</span>
              </div>
              <div className="info-card glass-card">
                <h3>产品摄影</h3>
                <p>精雕细琢的商业拍摄，提升产品形象</p>
                <span className="price">￥499/组起</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="booking-form glass-card">
            <h2 className="form-title">填写预约信息</h2>

            <div className="form-row">
              <label className="label">服务类型</label>
              <select name="serviceType" value={form.serviceType} onChange={handleChange} className="input-field">
                {serviceOptions.map(o => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label className="label">
                <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                拍摄日期（最早可预约7天后）
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                min={getMinDate()}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label className="label">姓名 *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="请输入您的姓名" />
              </div>
              <div className="form-row">
                <label className="label">手机号 *</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="请输入手机号" />
              </div>
            </div>

            <div className="form-row">
              <label className="label">邮箱 *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="请输入邮箱地址" />
            </div>

            <div className="form-row">
              <label className="label">留言备注</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="请填写您的特殊需求或其他信息（选填，最多500字）"
                maxLength={500}
                style={{ resize: 'vertical' }}
              />
              <span className="char-count-right">{form.message.length}/500</span>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? '提交中...' : '确认预约'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .booking-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .info-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }
        .info-card {
          padding: 20px;
        }
        .info-card h3 {
          font-size: 20px;
          margin-bottom: 8px;
          color: var(--color-primary);
        }
        .info-card p {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
        }
        .price {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--color-accent);
        }
        .booking-form {
          padding: 32px;
          position: sticky;
          top: 100px;
        }
        .form-title {
          font-size: 24px;
          margin-bottom: 24px;
          color: var(--color-primary);
        }
        .form-row {
          margin-bottom: 18px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .char-count-right {
          display: block;
          text-align: right;
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }
        .alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
          font-size: 14px;
        }
        .alert-error {
          background: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
          border: 1px solid rgba(231, 76, 60, 0.2);
        }
        .alert-success {
          background: rgba(39, 174, 96, 0.1);
          color: #27ae60;
          border: 1px solid rgba(39, 174, 96, 0.2);
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          font-size: 16px;
        }
        @media (max-width: 900px) {
          .booking-layout { grid-template-columns: 1fr; }
          .booking-form { position: static; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
