import React, { useState } from 'react';
import { SplitResult as SplitResultType } from '../api/orderApi';

interface SplitResultProps {
  splitResult: SplitResultType;
  orderId: string;
}

function SplitResult({ splitResult, orderId }: SplitResultProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (participantId: string) => {
    setExpandedId((prev) => (prev === participantId ? null : participantId));
  };

  return (
    <div className="split-result">
      <div className="split-header">
        <h2>费用分摊</h2>
        <div className="split-total">
          总计: ¥{splitResult.totalAmount.toFixed(2)}
        </div>
      </div>

      <div className="split-grid">
        {splitResult.splits.map((split) => {
          const isExpanded = expandedId === split.participantId;
          return (
            <div
              key={split.participantId}
              className={`split-card ${isExpanded ? 'split-expanded' : ''}`}
              onClick={() => toggleExpand(split.participantId)}
            >
              <div
                className="split-avatar"
                style={{ backgroundColor: split.participantColor }}
              >
                {split.participantName.charAt(0).toUpperCase()}
              </div>
              <div className="split-name">{split.participantName}</div>
              <div className="split-amount">¥{split.total.toFixed(2)}</div>

              <div
                className="split-details"
                style={{
                  maxHeight: isExpanded ? '500px' : '0',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="details-inner">
                  {split.details.length === 0 ? (
                    <div className="no-details">暂无消费</div>
                  ) : (
                    split.details.map((detail, idx) => (
                      <div key={idx} className="detail-row">
                        <span className="detail-emoji">{detail.emoji}</span>
                        <span className="detail-name">{detail.itemName}</span>
                        <span className="detail-amount">
                          ¥{detail.amount.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                  <div className="detail-total-row">
                    <span>合计</span>
                    <span>¥{split.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="expand-hint">
                {isExpanded ? '收起 ▲' : '查看明细 ▼'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SplitResult;
