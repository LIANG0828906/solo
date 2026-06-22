import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { Participant, Expense, DebtRecord } from '../shared/types';
import { formatCurrency, formatDateTime } from '../shared/utils';
import styles from './ExpenseList.module.css';

interface ExpenseListProps {
  expenses: Expense[];
  participants: Participant[];
  debts: DebtRecord[];
  onRemove: (id: string) => void;
  onViewDetail: (expense: Expense) => void;
}

export default function ExpenseList({
  expenses,
  participants,
  onRemove,
  onViewDetail,
}: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<Record<string, number>>({});
  const [axisLocked, setAxisLocked] = useState<'x' | 'y' | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingOffset = useRef<Record<string, number>>({});

  const participantOf = (id: string) => participants.find((p) => p.id === id);

  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id);
      setTimeout(() => {
        onRemove(id);
        setDeletingId(null);
        setSwipeOffset((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        pendingOffset.current = {};
      }, 320);
    },
    [onRemove]
  );

  const applyOffset = useCallback(() => {
    rafRef.current = null;
    setSwipeOffset((prev) => ({ ...prev, ...pendingOffset.current }));
    pendingOffset.current = {};
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, id: string) => {
      const t = e.touches[0];
      setSwipeStartX(t.clientX);
      setSwipeStartY(t.clientY);
      setAxisLocked(null);
      setSwipeOffset((prev) => ({
        ...prev,
        [id]: prev[id] ?? 0,
      }));
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent, id: string) => {
      if (swipeStartX === null || swipeStartY === null) return;
      const t = e.touches[0];
      const dx = t.clientX - swipeStartX;
      const dy = t.clientY - swipeStartY;

      if (!axisLocked) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          setAxisLocked(Math.abs(dx) > Math.abs(dy) ? 'x' : 'y');
        } else {
          return;
        }
      }

      if (axisLocked !== 'x') return;

      const prev = swipeOffset[id] ?? 0;
      const total = Math.min(0, Math.max(-120, prev + dx));
      pendingOffset.current[id] = total;

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(applyOffset);
      }
    },
    [swipeStartX, swipeStartY, axisLocked, swipeOffset, applyOffset]
  );

  const handleTouchEnd = useCallback(
    (_e: React.TouchEvent, id: string) => {
      if (axisLocked !== 'x') {
        setSwipeStartX(null);
        setSwipeStartY(null);
        setAxisLocked(null);
        return;
      }
      const offset = swipeOffset[id] ?? 0;
      if (offset < -55) {
        pendingOffset.current[id] = -88;
      } else {
        pendingOffset.current[id] = 0;
      }
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(applyOffset);
      }
      setSwipeStartX(null);
      setSwipeStartY(null);
      setAxisLocked(null);
    },
    [axisLocked, swipeOffset, applyOffset]
  );

  const totalAmount = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  return (
    <div className={styles.listCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>费用列表</h3>
          <div className={styles.cardSubtitle}>
            {expenses.length} 笔待结算 · 合计 {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className={styles.emptyList}>
          <div className={styles.emptyIcon}>💳</div>
          <div className={styles.emptyTitle}>还没有费用</div>
          <div className={styles.emptyDesc}>
            输入第一笔费用来开始分摊吧
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {expenses.map((exp, idx) => {
            const payer = participantOf(exp.payerId);
            const offset = swipeOffset[exp.id] ?? 0;
            const isDeleting = deletingId === exp.id;
            return (
              <div
                key={exp.id}
                className={`${styles.itemWrap} ${
                  isDeleting ? styles.slideOut : ''
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <button
                  className={styles.deleteReveal}
                  onClick={() => handleDelete(exp.id)}
                >
                  <span>🗑️</span>
                  <span>删除</span>
                </button>
                <div
                  className={styles.item}
                  style={{
                    transform: `translateX(${offset}px)`,
                    transition:
                      swipeStartX === null
                        ? 'transform 220ms cubic-bezier(0.4,0,0.2,1)'
                        : 'none',
                  }}
                  onClick={() => {
                    if (Math.abs(offset) < 5) onViewDetail(exp);
                  }}
                  onTouchStart={(e) => handleTouchStart(e, exp.id)}
                  onTouchMove={(e) => handleTouchMove(e, exp.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, exp.id)}
                >
                  <div className={styles.itemPayer}>
                    <div className={styles.payerAvatar}>
                      {payer?.avatar ?? '👤'}
                    </div>
                  </div>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTitle}>{exp.description}</div>
                    <div className={styles.itemMeta}>
                      <span className={styles.metaTag}>
                        {payer?.name ?? '未知'} 支付
                      </span>
                      <span className={styles.metaDot}>·</span>
                      <span>{formatDateTime(exp.createdAt)}</span>
                      <span className={styles.metaDot}>·</span>
                      <span>
                        {exp.splitType === 'equal' && '均分'}
                        {exp.splitType === 'proportion' && '按比例'}
                        {exp.splitType === 'designated' && '指定金额'}
                      </span>
                    </div>
                    <div className={styles.itemPeople}>
                      {exp.splitDetails
                        .filter((d) => d.included)
                        .map((d) => {
                          const p = participantOf(d.participantId);
                          return (
                            <span
                              key={d.participantId}
                              className={styles.personChip}
                              title={`${p?.name ?? ''}: ¥${d.amount.toFixed(2)}`}
                            >
                              {p?.avatar}
                            </span>
                          );
                        })}
                    </div>
                  </div>
                  <div className={styles.itemAmount}>
                    {formatCurrency(exp.amount)}
                  </div>
                  <div className={styles.itemArrow}>›</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
