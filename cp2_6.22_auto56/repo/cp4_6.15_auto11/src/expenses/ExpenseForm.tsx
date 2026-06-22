import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Participant, Expense, SplitType, SplitDetail } from '../shared/types';
import { generateId, roundToTwo } from '../shared/utils';
import { calculateExpenseSplit } from '../settlement/SettlementEngine';
import styles from './ExpenseForm.module.css';

interface ExpenseFormProps {
  participants: Participant[];
  onSubmit: (expense: Expense) => void;
}

const SPLIT_TABS: { key: SplitType; label: string; icon: string }[] = [
  { key: 'equal', label: '均分', icon: '⚖️' },
  { key: 'proportion', label: '按比例', icon: '📊' },
  { key: 'designated', label: '指定金额', icon: '✏️' },
];

function createRipple(event: React.MouseEvent<HTMLButtonElement>) {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.className = styles.ripple;
  const existing = button.getElementsByClassName(styles.ripple)[0];
  if (existing) existing.remove();
  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

export default function ExpenseForm({ participants, onSubmit }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [payerId, setPayerId] = useState(participants[0]?.id ?? '');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>(() =>
    participants.map((p) => ({
      participantId: p.id,
      weight: 1,
      amount: 0,
      included: true,
    }))
  );
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (participants.length === 0) return;
    if (!participants.find((p) => p.id === payerId)) {
      setPayerId(participants[0].id);
    }
    setSplitDetails((prev) => {
      const existing = new Map(prev.map((d) => [d.participantId, d]));
      return participants.map((p) => {
        const old = existing.get(p.id);
        return (
          old ?? {
            participantId: p.id,
            weight: 1,
            amount: 0,
            included: true,
          }
        );
      });
    });
  }, [participants, payerId]);

  const amount = useMemo(() => {
    const n = parseFloat(amountStr);
    return isNaN(n) ? 0 : roundToTwo(n);
  }, [amountStr]);

  const calculatedDetails = useMemo(() => {
    return calculateExpenseSplit(amount, splitType, splitDetails);
  }, [amount, splitType, splitDetails]);

  const totalDesignated = useMemo(() => {
    if (splitType !== 'designated') return 0;
    return roundToTwo(
      calculatedDetails
        .filter((d) => d.included)
        .reduce((s, d) => s + d.weight, 0)
    );
  }, [calculatedDetails, splitType]);

  const designatedMismatch =
    splitType === 'designated' && amount > 0 && Math.abs(totalDesignated - amount) > 0.01;

  const totalWeight = useMemo(() => {
    return calculatedDetails
      .filter((d) => d.included)
      .reduce((s, d) => s + d.weight, 0);
  }, [calculatedDetails]);

  const participantOf = (id: string) => participants.find((p) => p.id === id);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  }, []);

  const handleSubmit = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      if (amount <= 0) {
        setError('请输入有效金额');
        triggerShake();
        return;
      }
      if (!description.trim()) {
        setError('请填写费用描述');
        triggerShake();
        return;
      }
      if (splitType === 'designated' && designatedMismatch) {
        setError('分配金额总和不等于总金额');
        triggerShake();
        return;
      }
      if (calculatedDetails.filter((d) => d.included).length === 0) {
        setError('至少选择一位分摊人');
        triggerShake();
        return;
      }

      const expense: Expense = {
        id: generateId(),
        description: description.trim(),
        amount,
        payerId,
        splitType,
        splitDetails: calculatedDetails,
        createdAt: Date.now(),
        isSettled: false,
      };
      onSubmit(expense);

      setDescription('');
      setAmountStr('');
      setSplitType('equal');
      setError('');
      setSplitDetails(
        participants.map((p) => ({
          participantId: p.id,
          weight: 1,
          amount: 0,
          included: true,
        }))
      );
    },
    [
      amount,
      description,
      payerId,
      splitType,
      designatedMismatch,
      calculatedDetails,
      participants,
      onSubmit,
      triggerShake,
    ]
  );

  const toggleIncluded = useCallback((id: string) => {
    setSplitDetails((prev) =>
      prev.map((d) =>
        d.participantId === id ? { ...d, included: !d.included } : d
      )
    );
  }, []);

  const updateWeight = useCallback((id: string, weight: number) => {
    setSplitDetails((prev) =>
      prev.map((d) =>
        d.participantId === id ? { ...d, weight: Math.max(0, roundToTwo(weight)) } : d
      )
    );
  }, []);

  const dragStateRef = useRef<{
    id: string;
    startX: number;
    startWeight: number;
    rafId: number | null;
  } | null>(null);

  const handleSliderStart = useCallback(
    (clientX: number, id: string) => {
      const detail = splitDetails.find((d) => d.participantId === id);
      if (!detail) return;
      dragStateRef.current = {
        id,
        startX: clientX,
        startWeight: detail.weight,
        rafId: null,
      };
    },
    [splitDetails]
  );

  const handleSliderMove = useCallback((clientX: number) => {
    const state = dragStateRef.current;
    if (!state) return;
    const delta = clientX - state.startX;
    const pixelPerUnit = 2;
    const newWeight = Math.max(0, state.startWeight + delta / pixelPerUnit);
    if (state.rafId !== null) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(() => {
      updateWeight(state.id, roundToTwo(newWeight));
      state.rafId = null;
    });
  }, [updateWeight]);

  const handleSliderEnd = useCallback(() => {
    const state = dragStateRef.current;
    if (state && state.rafId !== null) cancelAnimationFrame(state.rafId);
    dragStateRef.current = null;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      handleSliderMove(clientX);
    };
    const onEnd = () => handleSliderEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [handleSliderMove, handleSliderEnd]);

  return (
    <div
      className={`${styles.formCard} ${shaking ? styles.shake : ''}`}
      onTransitionEnd={() => setError('')}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>添加费用</h3>
        {error && <div className={styles.errorText}>{error}</div>}
      </div>

      <div className={styles.formBody}>
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>费用描述</label>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                placeholder="例如：晚餐、打车、酒店..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className={styles.inputHighlight} />
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>金额（元）</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputPrefix}>¥</span>
              <input
                className={`${styles.input} ${styles.inputWithPrefix}`}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                step="0.01"
                min="0"
              />
              <span className={styles.inputHighlight} />
            </div>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>付款人</label>
          <div className={styles.payerRow}>
            {participants.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.payerChip} ${
                  payerId === p.id ? styles.payerChipActive : ''
                }`}
                onClick={() => setPayerId(p.id)}
              >
                <span className={styles.chipAvatar}>{p.avatar}</span>
                <span className={styles.chipName}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>分摊方式</label>
          <div className={styles.splitTabs}>
            {SPLIT_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.splitTab} ${
                  splitType === tab.key ? styles.splitTabActive : ''
                }`}
                onClick={() => setSplitType(tab.key)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.splitSection}>
          <div className={styles.splitHeader}>
            <span className={styles.splitHint}>
              {splitType === 'equal' && `每人分摊：参与人平摊金额`}
              {splitType === 'proportion' &&
                `权重总和：${totalWeight.toFixed(2)}（拖拽滑块调整比例）`}
              {splitType === 'designated' && (
                <span className={designatedMismatch ? styles.mismatch : ''}>
                  合计：¥{totalDesignated.toFixed(2)} / ¥{amount.toFixed(2)}
                  {designatedMismatch && ' ⚠️ 金额不匹配'}
                </span>
              )}
            </span>
          </div>

          <div className={styles.splitList}>
            {participants.map((p, idx) => {
              const detail = calculatedDetails.find(
                (d) => d.participantId === p.id
              );
              if (!detail) return null;
              const percent =
                splitType === 'proportion' && totalWeight > 0
                  ? (detail.weight / totalWeight) * 100
                  : 0;
              return (
                <div
                  key={p.id}
                  className={`${styles.splitItem} ${
                    !detail.included ? styles.splitItemDisabled : ''
                  }`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <label className={styles.checkboxWrap}>
                    <input
                      type="checkbox"
                      checked={detail.included}
                      onChange={() => toggleIncluded(p.id)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxBox}>
                      {detail.included && '✓'}
                    </span>
                  </label>

                  <div className={styles.splitAvatar}>{p.avatar}</div>
                  <div className={styles.splitName}>{p.name}</div>

                  {splitType === 'equal' && (
                    <div className={styles.splitAmount}>
                      {detail.included
                        ? `¥${detail.amount.toFixed(2)}`
                        : '—'}
                    </div>
                  )}

                  {splitType === 'proportion' && (
                    <div className={styles.sliderField}>
                      <div
                        className={styles.sliderBar}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSliderStart(e.clientX, p.id);
                        }}
                        onTouchStart={(e) => {
                          handleSliderStart(
                            e.touches[0].clientX,
                            p.id
                          );
                        }}
                      >
                        <div
                          className={styles.sliderFill}
                          style={{ width: `${Math.min(100, detail.weight * 5)}%` }}
                        />
                        <div
                          className={styles.sliderThumb}
                          style={{
                            left: `calc(${Math.min(100, detail.weight * 5)}% - 10px)`,
                          }}
                        />
                      </div>
                      <div className={styles.sliderMeta}>
                        <input
                          className={styles.weightInput}
                          type="number"
                          min="0"
                          step="0.1"
                          value={detail.weight}
                          onChange={(e) =>
                            updateWeight(p.id, parseFloat(e.target.value) || 0)
                          }
                        />
                        <span className={styles.weightPercent}>
                          {percent.toFixed(1)}%
                        </span>
                        <span className={styles.proportionAmount}>
                          ¥{detail.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {splitType === 'designated' && (
                    <div className={styles.designatedField}>
                      <span className={styles.designatedPrefix}>¥</span>
                      <input
                        className={styles.designatedInput}
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={!detail.included}
                        value={detail.included ? detail.weight : ''}
                        onChange={(e) =>
                          updateWeight(p.id, parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                      <span
                        className={`${styles.designatedAmountHint} ${
                          Math.abs(detail.weight - detail.amount) > 0.01
                            ? styles.mismatch
                            : ''
                        }`}
                      >
                        = ¥{detail.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className={styles.submitBtn}
          onClick={handleSubmit}
        >
          <span>➕</span> 添加费用
        </button>
      </div>
    </div>
  );
}
