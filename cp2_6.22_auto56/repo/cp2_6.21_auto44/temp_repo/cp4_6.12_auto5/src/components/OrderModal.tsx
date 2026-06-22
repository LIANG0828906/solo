import { useState } from 'react';
import { Plant, RENTAL_PERIOD_LABELS } from '../types';

interface Props {
  plant: Plant;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderModal({ plant, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    rental_period: '1month' as '1month' | '3months' | '6months',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const periodMultiplier = form.rental_period === '1month' ? 1 : form.rental_period === '3months' ? 3 : 6;
  const discount = periodMultiplier >= 3 ? 0.9 : 1;
  const totalPrice = Math.round(plant.price_monthly * periodMultiplier * discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone || !form.address) {
      setError('请填写所有必填字段');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant_id: plant.id,
          ...form,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '下单失败');
      }

      alert('下单成功！我们会尽快与您联系确认。');
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>租赁 {plant.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="order-summary">
            <div className="summary-row">
              <span>月租金</span>
              <span>¥{plant.price_monthly}</span>
            </div>
            <div className="summary-row">
              <span>租赁周期</span>
              <span>{RENTAL_PERIOD_LABELS[form.rental_period]}</span>
            </div>
            {discount < 1 && (
              <div className="summary-row discount">
                <span>长期优惠</span>
                <span>9折</span>
              </div>
            )}
            <div className="summary-row total">
              <span>总计</span>
              <span>¥{totalPrice}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">租赁周期 *</label>
            <div className="period-selector">
              {(['1month', '3months', '6months'] as const).map(p => (
                <button
                  type="button"
                  key={p}
                  className={`period-option ${form.rental_period === p ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, rental_period: p })}
                >
                  {RENTAL_PERIOD_LABELS[p]}
                  {p !== '1month' && <span className="discount-tag">9折</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">姓名 *</label>
            <input
              className="form-input"
              placeholder="请输入您的姓名"
              value={form.customer_name}
              onChange={e => setForm({ ...form, customer_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">手机号 *</label>
            <input
              className="form-input"
              placeholder="请输入手机号"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">配送地址 *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="请输入详细配送地址"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '提交中...' : '确认下单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
