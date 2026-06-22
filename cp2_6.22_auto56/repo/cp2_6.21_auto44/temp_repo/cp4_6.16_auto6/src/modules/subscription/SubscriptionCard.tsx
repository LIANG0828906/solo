import { useState } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { Subscription } from '@/types';
import { CATEGORY_CONFIG, BILLING_CYCLE_LABELS } from '@/types';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
}

export function SubscriptionCard({ subscription, onEdit }: SubscriptionCardProps) {
  const { deleteSubscription } = useSubscriptionStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const cfg = CATEGORY_CONFIG[subscription.category];

  const daysUntilBilling = (() => {
    const now = new Date();
    const billing = new Date(subscription.nextBillingDate);
    const diff = Math.ceil((billing.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  })();

  const handleDelete = async () => {
    await deleteSubscription(subscription.id);
    setShowConfirm(false);
  };

  return (
    <>
      <div
        className="card-hover rounded-xl p-4 border"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: cfg.color }}
              />
              <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                {subscription.name}
              </h3>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ background: cfg.color + '22', color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                ¥{subscription.price.toFixed(2)}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                /{BILLING_CYCLE_LABELS[subscription.billingCycle]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                扣款：{subscription.nextBillingDate.slice(0, 10)}
              </span>
              {daysUntilBilling >= 0 && daysUntilBilling <= 7 && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: 'var(--color-accent)' }}>
                  <AlertTriangle size={10} />
                  {daysUntilBilling}天后
                </span>
              )}
            </div>
            {subscription.note && (
              <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                {subscription.note}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(subscription)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              title="编辑"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--color-accent)' }}
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px' }}>
            <div className="text-center mb-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'var(--color-accent)22' }}
              >
                <AlertTriangle size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                确认删除
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                确定要删除「{subscription.name}」吗？此操作不可撤销。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-lg text-xs font-medium border"
                style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
