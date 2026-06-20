import { useState, useEffect, FormEvent } from 'react'
import { format } from 'date-fns'
import { useStore, getMonthlyAmount } from '../store'
import type { Subscription, BillingCycle, ServiceStatus } from '../types'

interface ServiceModalProps {
  subscription?: Subscription | null
  onClose: () => void
}

const defaultForm = {
  name: '',
  amount: 0,
  billingCycle: 'monthly' as BillingCycle,
  nextBillingDate: format(new Date(), 'yyyy-MM-dd'),
  status: 'active' as ServiceStatus,
  notes: '',
  usageFrequency: 5,
  satisfaction: 7
}

const ServiceModal = ({ subscription, onClose }: ServiceModalProps) => {
  const { addSubscription, updateSubscription } = useStore()
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (subscription) {
      setForm({
        name: subscription.name,
        amount: subscription.amount,
        billingCycle: subscription.billingCycle,
        nextBillingDate: subscription.nextBillingDate,
        status: subscription.status,
        notes: subscription.notes,
        usageFrequency: subscription.usageFrequency,
        satisfaction: subscription.satisfaction
      })
    }
  }, [subscription])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    if (subscription) {
      updateSubscription(subscription.id, form)
    } else {
      addSubscription(form)
    }
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const monthlyEquivalent = getMonthlyAmount(form.amount, form.billingCycle)

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title">
            <i className={`fas ${subscription ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
            {subscription ? '编辑订阅' : '添加订阅'}
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">
                服务名称 <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如：Notion、GitHub"
                required
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  费用金额 <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">计费周期</label>
                <select
                  className="form-select"
                  value={form.billingCycle}
                  onChange={(e) => setForm({ ...form, billingCycle: e.target.value as BillingCycle })}
                >
                  <option value="monthly">每月</option>
                  <option value="quarterly">每季</option>
                  <option value="yearly">每年</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{
              padding: '10px 14px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px dashed rgba(56, 189, 248, 0.3)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--text-secondary)'
            }}>
              <i className="fas fa-calculator" style={{ color: 'var(--gradient-start)', marginRight: 8 }}></i>
              月度等效费用：<strong style={{ color: 'var(--gradient-start)' }}>¥{monthlyEquivalent.toFixed(2)}</strong>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  下个账单日 <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={form.nextBillingDate}
                  onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">状态</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ServiceStatus })}
                >
                  <option value="active">活跃</option>
                  <option value="paused">暂停</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">使用频率 (1-10)</label>
              <div className="range-input-wrapper">
                <i className="fas fa-clock" style={{ color: 'var(--text-secondary)' }}></i>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.usageFrequency}
                  onChange={(e) => setForm({ ...form, usageFrequency: Number(e.target.value) })}
                />
                <span className="range-value">{form.usageFrequency}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">满意度 (1-10)</label>
              <div className="range-input-wrapper">
                <i className="fas fa-star" style={{ color: 'var(--warning)' }}></i>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.satisfaction}
                  onChange={(e) => setForm({ ...form, satisfaction: Number(e.target.value) })}
                />
                <span className="range-value">{form.satisfaction}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="服务用途、账号信息等..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              <i className={`fas ${subscription ? 'fa-save' : 'fa-plus'}`}></i>
              {subscription ? '保存修改' : '添加订阅'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServiceModal
