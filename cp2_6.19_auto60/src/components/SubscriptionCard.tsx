import React, { memo, useState } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import type { Subscription } from '@/utils/dateUtils';
import {
  formatDate,
  getNextBillingDate,
  getDaysUntilExpiry,
  CATEGORY_COLORS,
  getEffectiveMonthlyFee,
} from '@/utils/dateUtils';
import { useSubscriptionStore } from '@/store/subscriptionStore';

interface SubscriptionCardProps {
  subscription: Subscription;
  index: number;
  onDelete: (id: string) => void;
}

function SubscriptionCardImpl({ subscription, index, onDelete }: SubscriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editFee, setEditFee] = useState(subscription.monthlyFee.toString());
  const [editStartDate, setEditStartDate] = useState(subscription.startDate);
  const [isRemoving, setIsRemoving] = useState(false);

  const { updateSubscription, triggerNotification } = useSubscriptionStore();

  const nextBillingDate = getNextBillingDate(subscription.startDate, subscription.billingCycle);
  const daysUntil = getDaysUntilExpiry(subscription);
  const monthlyFee = getEffectiveMonthlyFee(subscription);
  const categoryColors = CATEGORY_COLORS[subscription.category];
  const isExpiring = daysUntil <= 7 && daysUntil >= 0;
  const isExpired = daysUntil < 0;

  const handleSave = () => {
    const fee = parseFloat(editFee);
    if (isNaN(fee) || fee <= 0 || !editStartDate) {
      triggerNotification('请输入有效的费用和日期');
      return;
    }
    updateSubscription(subscription.id, {
      monthlyFee: fee,
      startDate: editStartDate,
    });
    setIsEditing(false);
    triggerNotification('订阅已更新');
  };

  const handleDeleteClick = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onDelete(subscription.id);
      setShowConfirm(false);
      setIsRemoving(false);
    }, 300);
  };

  const getDaysText = () => {
    if (isExpired) return `已过期 ${Math.abs(daysUntil)} 天`;
    if (daysUntil === 0) return '今天到期';
    return `剩余 ${daysUntil} 天`;
  };

  return (
    <>
      <div
        className={`sub-card ${isRemoving ? 'removing' : ''}`}
        style={{
          background: categoryColors.gradient,
          animationDelay: `${index * 0.08}s`,
        }}
      >
        {isExpiring && !isExpired && <div className="expiring-border" />}
        {isExpired && <div className="expired-border" />}

        <div className="card-content">
          {!isEditing ? (
            <>
              <div className="card-header">
                <span className="card-emoji">{subscription.emoji}</span>
                <div className="card-title-group">
                  <h3 className="card-name">{subscription.name}</h3>
                  <span className="card-billing">
                    {subscription.billingCycle === 'monthly' ? '月付' : '年付'}
                  </span>
                </div>
                <div className="card-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => setIsEditing(true)}
                    aria-label="编辑"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => setShowConfirm(true)}
                    aria-label="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="fee-row">
                  <span className="fee-label">月均费用</span>
                  <span className="fee-value">¥{monthlyFee.toFixed(2)}</span>
                </div>
                <div className="date-row">
                  <span className="date-label">下次到期</span>
                  <span className="date-value">{formatDate(nextBillingDate)}</span>
                </div>
                <div className={`days-row ${isExpiring ? 'expiring' : ''} ${isExpired ? 'expired' : ''}`}>
                  {getDaysText()}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="card-header">
                <span className="card-emoji">{subscription.emoji}</span>
                <h3 className="card-name">编辑 {subscription.name}</h3>
              </div>
              <div className="card-body edit-form">
                <label className="edit-label">
                  月费金额
                  <input
                    type="number"
                    className="edit-input"
                    value={editFee}
                    onChange={(e) => setEditFee(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </label>
                <label className="edit-label">
                  开始日期
                  <input
                    type="date"
                    className="edit-input"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </label>
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                    <X size={16} /> 取消
                  </button>
                  <button className="save-btn" onClick={handleSave}>
                    <Check size={16} /> 保存
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">确认删除</h3>
            <p className="modal-message">确定要删除「{subscription.name}」订阅吗？此操作无法撤销。</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>
                取消
              </button>
              <button className="delete-confirm-btn" onClick={handleDeleteClick}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const SubscriptionCard = memo(SubscriptionCardImpl);
