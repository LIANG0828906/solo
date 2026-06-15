import { useState, type FormEvent, useMemo } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { X } from 'lucide-react';
import type { Subscription, BillingCycle, Category } from '@/types';
import { CATEGORY_CONFIG, BILLING_CYCLE_LABELS, BILLING_CYCLE_MULTIPLIER } from '@/types';

interface SubscriptionFormProps {
  subscription: Subscription | null;
  onClose: () => void;
}

const emptyForm = {
  name: '',
  price: '',
  billingCycle: 'monthly' as BillingCycle,
  nextBillingDate: '',
  category: 'entertainment' as Category,
  note: '',
};

export function SubscriptionForm({ subscription, onClose }: SubscriptionFormProps) {
  const { addSubscription, updateSubscription } = useSubscriptionStore();
  const [form, setForm] = useState({
    name: subscription?.name ?? emptyForm.name,
    price: subscription?.price?.toString() ?? emptyForm.price,
    billingCycle: subscription?.billingCycle ?? emptyForm.billingCycle,
    nextBillingDate: subscription?.nextBillingDate?.slice(0, 10) ?? emptyForm.nextBillingDate,
    category: subscription?.category ?? emptyForm.category,
    note: subscription?.note ?? emptyForm.note,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.nextBillingDate) return;
    setSubmitting(true);
    try {
      const price = parseFloat(form.price);
      if (isNaN(price) || price <= 0) return;

      if (subscription) {
        await updateSubscription(subscription.id, {
          name: form.name.trim(),
          price,
          billingCycle: form.billingCycle,
          nextBillingDate: form.nextBillingDate,
          category: form.category,
          note: form.note.trim(),
        });
      } else {
        await addSubscription({
          name: form.name.trim(),
          price,
          billingCycle: form.billingCycle,
          nextBillingDate: form.nextBillingDate,
          category: form.category,
          note: form.note.trim(),
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const priceBreakdown = useMemo(() => {
    const price = parseFloat(form.price) || 0;
    if (price <= 0) return null;
    const multiplier = BILLING_CYCLE_MULTIPLIER[form.billingCycle];
    const monthlyPrice = price / multiplier;
    return {
      monthly: monthlyPrice,
      quarterly: monthlyPrice * 3,
      yearly: monthlyPrice * 12,
    };
  }, [form.price, form.billingCycle]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            {subscription ? '编辑订阅' : '添加订阅'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              服务名称 *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="如：Netflix、Spotify、iCloud"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                价格 (元) *
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                required
              />
              {priceBreakdown && (
                <div className="mt-2 p-2 rounded-lg" style={{ background: 'var(--color-card)' }}>
                  <p className="text-[10px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    等价月付: ¥{priceBreakdown.monthly.toFixed(2)}
                  </p>
                  <div className="flex gap-2 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>季付: ¥{priceBreakdown.quarterly.toFixed(2)}</span>
                    <span>年付: ¥{priceBreakdown.yearly.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                计费周期 *
              </label>
              <select
                className="form-input"
                value={form.billingCycle}
                onChange={(e) => updateField('billingCycle', e.target.value as BillingCycle)}
              >
                {(Object.entries(BILLING_CYCLE_LABELS) as [BillingCycle, string][]).map(([key, label]) => (
                  <option key={key} value={key} style={{ background: 'var(--color-surface)' }}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                下次扣款日 *
              </label>
              <input
                type="date"
                className="form-input"
                value={form.nextBillingDate}
                onChange={(e) => updateField('nextBillingDate', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                类别 *
              </label>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => updateField('category', e.target.value as Category)}
              >
                {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(
                  ([key, cfg]) => (
                    <option key={key} value={key} style={{ background: 'var(--color-surface)' }}>
                      {cfg.label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              备注
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="可选备注信息"
              value={form.note}
              onChange={(e) => updateField('note', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all"
              style={{ background: 'var(--color-accent)', opacity: submitting ? 0.7 : 1 }}
            >
              {subscription ? '保存修改' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
