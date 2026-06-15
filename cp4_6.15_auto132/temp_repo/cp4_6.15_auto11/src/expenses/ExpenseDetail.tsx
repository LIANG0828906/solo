import React, { useMemo } from 'react';
import type { Participant, Expense } from '../shared/types';
import { formatCurrency, formatDateTime } from '../shared/utils';
import styles from './ExpenseDetail.module.css';

interface ExpenseDetailProps {
  expense: Expense;
  participants: Participant[];
  onClose: () => void;
}

export default function ExpenseDetail({
  expense,
  participants,
  onClose,
}: ExpenseDetailProps) {
  const payer = useMemo(
    () => participants.find((p) => p.id === expense.payerId),
    [participants, expense.payerId]
  );

  const rows = useMemo(() => {
    return expense.splitDetails
      .filter((d) => d.included)
      .map((d, idx) => {
        const p = participants.find((x) => x.id === d.participantId);
        const paid = d.participantId === expense.payerId ? expense.amount : 0;
        const shouldPay = d.amount;
        const balance = paid - shouldPay;
        return {
          participant: p,
          detail: d,
          paid,
          shouldPay,
          balance,
          isCurrentUser: p?.isCurrentUser,
          rowIndex: idx,
        };
      });
  }, [expense, participants]);

  const splitTypeText =
    expense.splitType === 'equal'
      ? '均分'
      : expense.splitType === 'proportion'
      ? '按比例分摊'
      : '指定金额分摊';

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdrop}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerBg} />
          <div className={styles.headerContent}>
            <div className={styles.headerMeta}>
              <span className={styles.tag}>{splitTypeText}</span>
              <span className={styles.headerTime}>
                {formatDateTime(expense.createdAt)}
              </span>
            </div>
            <h2 className={styles.title}>{expense.description}</h2>
            <div className={styles.amountRow}>
              <div className={styles.payerInfo}>
                <div className={styles.payerAvatarBig}>{payer?.avatar}</div>
                <div>
                  <div className={styles.payerLabel}>付款人</div>
                  <div className={styles.payerName}>{payer?.name ?? '未知'}</div>
                </div>
              </div>
              <div className={styles.amountBig}>
                {formatCurrency(expense.amount)}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.sectionTitle}>分摊明细</div>
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <div className={styles.thName}>参与人</div>
              <div className={styles.thNum}>已付</div>
              <div className={styles.thNum}>应付</div>
              <div className={styles.thNum}>差额</div>
            </div>
            <div className={styles.tableBody}>
              {rows.map((row) => (
                <div
                  key={row.detail.participantId}
                  className={`${styles.tableRow} ${
                    row.isCurrentUser ? styles.currentRow : ''
                  }`}
                  style={{
                    background:
                      row.rowIndex % 2 === 0
                        ? 'var(--color-surface)'
                        : 'var(--color-bg)',
                  }}
                >
                  <div className={styles.tdName}>
                    <div className={styles.rowAvatar}>
                      {row.participant?.avatar ?? '👤'}
                    </div>
                    <span className={styles.rowName}>
                      {row.participant?.name ?? '未知'}
                      {row.isCurrentUser && (
                        <span className={styles.rowBadge}>我</span>
                      )}
                    </span>
                  </div>
                  <div className={styles.tdNum}>
                    {formatCurrency(row.paid)}
                  </div>
                  <div className={styles.tdNum}>
                    {formatCurrency(row.shouldPay)}
                  </div>
                  <div
                    className={`${styles.tdNum} ${styles.tdBalance} ${
                      row.balance > 0.01
                        ? styles.balancePositive
                        : row.balance < -0.01
                        ? styles.balanceNegative
                        : styles.balanceZero
                    }`}
                  >
                    {row.balance > 0.01
                      ? `+${formatCurrency(row.balance)}`
                      : row.balance < -0.01
                      ? `-${formatCurrency(Math.abs(row.balance))}`
                      : '0.00'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>总金额</span>
              <strong>{formatCurrency(expense.amount)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>参与人数</span>
              <strong>{rows.length} 人</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>人均</span>
              <strong>
                {formatCurrency(
                  rows.length > 0 ? expense.amount / rows.length : 0
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
