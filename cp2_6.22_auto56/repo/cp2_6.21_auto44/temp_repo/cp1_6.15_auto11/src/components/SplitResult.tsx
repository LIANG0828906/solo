import React, { useState, useMemo } from 'react';
import {
  SplitResult as SplitResultType,
  togglePayment,
} from '../api/orderApi';

interface SplitResultProps {
  splitResult: SplitResultType;
  orderId: string;
}

function SplitResult({ splitResult, orderId }: SplitResultProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { paidCount, totalCount } = useMemo(() => {
    const paid = splitResult.splits.filter((s) => s.paid).length;
    return { paidCount: paid, totalCount: splitResult.splits.length };
  }, [splitResult]);

  const progressPercent = totalCount ? (paidCount / totalCount) * 100 : 0;

  const toggleExpand = (participantId: string) => {
    setExpandedId((prev) =>
      prev === participantId ? null : participantId
    );
  };

  const handleTogglePayment = async (
    e: React.MouseEvent,
    participantId: string,
    currentPaid: boolean
  ) => {
    e.stopPropagation();
    setBusyId(participantId);
    try {
      await togglePayment(orderId, participantId, !currentPaid);
    } catch (err) {
      console.error('Failed to toggle payment:', err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="split-result">
      <div className="split-progress-block">
        <div className="progress-label-row">
          <h2>💰 费用分摊</h2>
          <div className="progress-text">
            <span className="progress-count">
              {paidCount} / {totalCount}
            </span>
            <span className="progress-label-text">人已付清</span>
          </div>
        </div>
        <div className="progress-bar-large">
          <div
            className="progress-fill-large"
            style={{ width: `${progressPercent}%` }}
          />
          <span className="progress-percent">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="split-grand-total">
          消费总额：<strong>¥{splitResult.totalAmount.toFixed(2)}</strong>
        </div>
      </div>

      <div className="split-grid split-grid-payment">
        {splitResult.splits.map((split) => {
          const isExpanded = expandedId === split.participantId;
          const isBusy = busyId === split.participantId;
          return (
            <div
              key={split.participantId}
              className={`split-card split-card-with-payment ${
                isExpanded ? 'split-expanded' : ''
              } ${split.paid ? 'split-card-paid' : ''}`}
              onClick={() => toggleExpand(split.participantId)}
            >
              <div className="split-card-header">
                <div
                  className={`split-avatar split-avatar-large ${
                    split.paid ? 'avatar-paid' : ''
                  }`}
                  style={{
                    backgroundColor: split.paid
                      ? 'var(--green-400)'
                      : split.participantColor,
                  }}
                >
                  {split.paid ? (
                    <span className="check-mark-large">✓</span>
                  ) : (
                    split.participantName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="split-user-info">
                  <div className="split-name-large">
                    {split.participantName}
                  </div>
                  <div className="split-amount-large">
                    ¥{split.total.toFixed(2)}
                  </div>
                </div>
                <button
                  className={`payment-toggle-btn ${
                    split.paid ? 'btn-paid' : 'btn-unpaid'
                  } ${isBusy ? 'btn-busy' : ''}`}
                  onClick={(e) =>
                    handleTogglePayment(
                      e,
                      split.participantId,
                      split.paid
                    )
                  }
                  disabled={isBusy}
                  title={split.paid ? '点击标记为未付' : '点击标记为已付'}
                >
                  {isBusy
                    ? '...'
                    : split.paid
                    ? '✓ 已付'
                    : '标记已付'}
                </button>
              </div>

              <div
                className="split-details"
                style={{
                  maxHeight: isExpanded ? '600px' : '0',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="details-inner details-inner-wide">
                  {split.details.length === 0 ? (
                    <div className="no-details">暂无消费</div>
                  ) : (
                    split.details.map((detail, idx) => (
                      <div key={idx} className="detail-row detail-row-large">
                        <span className="detail-emoji detail-emoji-large">
                          {detail.emoji}
                        </span>
                        <span className="detail-name detail-name-large">
                          {detail.itemName}
                        </span>
                        <span className="detail-amount detail-amount-large">
                          ¥{detail.amount.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                  <div className="detail-total-row detail-total-row-large">
                    <span>应付合计</span>
                    <span>¥{split.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="expand-hint">
                {isExpanded ? '收起明细 ▲' : '展开明细 ▼'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SplitResult;
