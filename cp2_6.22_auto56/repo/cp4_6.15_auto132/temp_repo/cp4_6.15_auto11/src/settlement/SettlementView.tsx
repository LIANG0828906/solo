import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Participant, SettlementItem, DebtRecord } from '../shared/types';
import { formatCurrency, roundToTwo } from '../shared/utils';
import styles from './SettlementView.module.css';

interface SettlementViewProps {
  items: SettlementItem[];
  participants: Participant[];
  debts: DebtRecord[];
  onConfirm: (items: SettlementItem[]) => void;
}

export default function SettlementView({
  items: initialItems,
  participants,
  debts,
  onConfirm,
}: SettlementViewProps) {
  const [localItems, setLocalItems] = useState<SettlementItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setLocalItems(initialItems);
  }, [initialItems]);

  const participantOf = (id: string) => participants.find((p) => p.id === id);
  const debtOf = (id: string) =>
    debts.find((d) => d.participantId === id)?.balance ?? 0;

  const totalTransfer = useMemo(
    () =>
      localItems
        .filter((i) => !i.isIgnored)
        .reduce((s, i) => s + i.amount, 0),
    [localItems]
  );

  const toggleIgnore = useCallback((id: string) => {
    setLocalItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isIgnored: !i.isIgnored } : i))
    );
  }, []);

  const startEdit = useCallback((item: SettlementItem) => {
    setEditingId(item.id);
    setEditValue(item.amount.toFixed(2));
  }, []);

  const saveEdit = useCallback((id: string) => {
    const n = parseFloat(editValue);
    if (!isNaN(n) && n >= 0) {
      setLocalItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, amount: roundToTwo(n), isAdjusted: true }
            : i
        )
      );
    }
    setEditingId(null);
  }, [editValue]);

  const handleConfirm = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      const rect = btn.getBoundingClientRect();
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.style.position = 'absolute';
      circle.style.borderRadius = '50%';
      circle.style.background = 'rgba(255,255,255,0.5)';
      circle.style.transform = 'scale(0)';
      circle.style.animation = 'ripple 600ms linear';
      circle.style.pointerEvents = 'none';
      const exist = btn.querySelector('span[style*="ripple"]');
      if (exist) exist.remove();
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);

      setTimeout(() => onConfirm(localItems), 150);
    },
    [localItems, onConfirm]
  );

  const creditors = useMemo(
    () =>
      debts
        .filter((d) => d.balance > 0.01)
        .sort((a, b) => b.balance - a.balance),
    [debts]
  );
  const debtors = useMemo(
    () =>
      debts
        .filter((d) => d.balance < -0.01)
        .sort((a, b) => a.balance - b.balance),
    [debts]
  );

  const validItems = localItems.filter((i) => !i.isIgnored);

  return (
    <div className={styles.wrapper} style={{ animation: 'fadeIn 250ms ease' }}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>结算方案</h2>
          <div className={styles.pageSubtitle}>
            {localItems.length === 0
              ? '太棒了，没有需要结算的款项 🎉'
              : `最少 ${validItems.length} 笔转账 · 合计 ${formatCurrency(
                  totalTransfer
                )}`}
          </div>
        </div>
      </div>

      <div className={styles.debtOverview}>
        {creditors.length > 0 && (
          <div className={styles.overviewCol}>
            <div className={styles.overviewTitle}>
              <span>💰</span> 债权人（应收）
            </div>
            <div className={styles.overviewList}>
              {creditors.map((c) => {
                const p = participantOf(c.participantId);
                return (
                  <div key={c.participantId} className={styles.overviewItem}>
                    <div className={styles.overviewAvatar}>{p?.avatar}</div>
                    <div className={styles.overviewInfo}>
                      <div className={styles.overviewName}>{p?.name}</div>
                      <div className={styles.overviewAmountPositive}>
                        +{formatCurrency(c.balance)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {debtors.length > 0 && (
          <div className={styles.overviewCol}>
            <div className={styles.overviewTitle}>
              <span>💸</span> 债务人（应付）
            </div>
            <div className={styles.overviewList}>
              {debtors.map((d) => {
                const p = participantOf(d.participantId);
                return (
                  <div key={d.participantId} className={styles.overviewItem}>
                    <div className={styles.overviewAvatar}>{p?.avatar}</div>
                    <div className={styles.overviewInfo}>
                      <div className={styles.overviewName}>{p?.name}</div>
                      <div className={styles.overviewAmountNegative}>
                        -{formatCurrency(Math.abs(d.balance))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {localItems.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <div className={styles.emptyText}>所有账目已结清</div>
          <div className={styles.emptySub}>
            去费用管理页添加新的费用记录吧
          </div>
        </div>
      ) : (
        <>
          <div className={styles.hint}>
            点击卡片可手动调整金额或忽略该笔转账
          </div>
          <div className={styles.cardList}>
            {localItems.map((item, idx) => {
              const from = participantOf(item.fromParticipantId);
              const to = participantOf(item.toParticipantId);
              return (
                <SettlementCard
                  key={item.id}
                  item={item}
                  from={from}
                  to={to}
                  isEditing={editingId === item.id}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onStartEdit={() => startEdit(item)}
                  onSaveEdit={() => saveEdit(item.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onToggleIgnore={() => toggleIgnore(item.id)}
                  animationDelay={idx * 70}
                />
              );
            })}
          </div>

          <div className={styles.actionBar}>
            <button
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={validItems.length === 0}
            >
              <span>✓</span> 确认结算并记录
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface CardProps {
  item: SettlementItem;
  from?: Participant;
  to?: Participant;
  isEditing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleIgnore: () => void;
  animationDelay: number;
}

const SettlementCard = React.memo(function SettlementCard({
  item,
  from,
  to,
  isEditing,
  editValue,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleIgnore,
  animationDelay,
}: CardProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div
      className={`${styles.card} ${item.isIgnored ? styles.cardIgnored : ''} ${
        item.isAdjusted ? styles.cardAdjusted : ''
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={styles.cardLeft}>
        <svg
          className={styles.arrowSvg}
          viewBox="0 0 260 88"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={`arrowGrad-${item.id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          <path
            d="M 44 44 Q 130 0 216 44"
            fill="none"
            stroke={`url(#arrowGrad-${item.id})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="10 6"
            className={styles.dashPath}
          />

          <circle r="9" fill="#f87171" className={styles.dotStart}>
            <animateMotion dur="2.2s" repeatCount="indefinite" path="M 44 44 Q 130 0 216 44" />
          </circle>
          <circle r="9" fill="#34d399" className={styles.dotEnd}>
            <animateMotion dur="2.2s" repeatCount="indefinite" begin="-1.1s" path="M 44 44 Q 130 0 216 44" />
          </circle>

          <path
            d="M 206 36 L 222 44 L 206 52"
            fill="none"
            stroke="#34d399"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className={styles.partyLeft}>
          <div className={styles.bigAvatar}>{from?.avatar ?? '👤'}</div>
          <div className={styles.partyName}>{from?.name ?? '未知'}</div>
          <div className={styles.partyRole}>付款方</div>
        </div>

        <div className={styles.partyRight}>
          <div className={styles.bigAvatar}>{to?.avatar ?? '👤'}</div>
          <div className={styles.partyName}>{to?.name ?? '未知'}</div>
          <div className={styles.partyRole}>收款方</div>
        </div>
      </div>

      <div className={styles.cardRight}>
        <div className={styles.amountBlock}>
          {isEditing ? (
            <div className={styles.editRow}>
              <span className={styles.editPrefix}>¥</span>
              <input
                className={styles.editInput}
                autoFocus
                type="number"
                step="0.01"
                min="0"
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                onBlur={onSaveEdit}
              />
            </div>
          ) : (
            <button
              className={styles.amountBtn}
              onClick={onStartEdit}
              onDoubleClick={onStartEdit}
            >
              {formatCurrency(item.amount)}
              <span className={styles.editHint}>✏️</span>
            </button>
          )}
          {item.isAdjusted && !isEditing && (
            <div className={styles.adjustedTag}>已调整</div>
          )}
        </div>

        <div className={styles.cardActions}>
          <button
            className={`${styles.actionBtn} ${
              item.isIgnored ? styles.actionRestore : styles.actionIgnore
            }`}
            onClick={onToggleIgnore}
          >
            {item.isIgnored ? '↩ 恢复' : '✕ 忽略'}
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setShowDetail((s) => !s)}
          >
            {showDetail ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {showDetail && (
        <div className={styles.cardDetail}>
          <div className={styles.detailRow}>
            <span>付款方当前差额</span>
            <strong>{formatCurrency(0)}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>收款方当前差额</span>
            <strong>{formatCurrency(0)}</strong>
          </div>
          <div className={styles.detailTip}>
            💡 基于「贪心匹配」算法：每次匹配最大债权人与最大债务人，最小化转账次数
          </div>
        </div>
      )}
    </div>
  );
});
