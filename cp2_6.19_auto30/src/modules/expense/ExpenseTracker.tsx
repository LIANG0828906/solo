import React, { useState, useRef, useEffect } from 'react';
import { ChartPanel } from './ChartPanel';
import {
  useStore,
  ExpenseCategory,
  categoryLabels,
  categoryColors,
} from './store';
import {
  convertCurrency,
  formatCurrency,
  getCurrencySymbol,
  currencyNames,
} from '@/utils/currency';

interface ExpenseTrackerProps {
  tripId: string;
  onBack: () => void;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ tripId, onBack }) => {
  const {
    trips,
    addExpense,
    getExpensesByTrip,
    getTotalSpent,
    getExpensesByCategory,
    getDailyExpenses,
  } = useStore();

  const trip = trips.find((t) => t.id === tripId);
  const expenses = getExpensesByTrip(tripId);
  const totalSpent = getTotalSpent(tripId);
  const expensesByCategory = getExpensesByCategory(tripId);
  const dailyExpenses = getDailyExpenses(tripId);

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [amount, setAmount] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState(trip?.currency || 'CNY');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [displayedAmount, setDisplayedAmount] = useState(0);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const budget = trip?.budget || 0;
  const currency = trip?.currency || 'CNY';
  const budgetPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const isOverBudget = budgetPercentage >= 100;
  const isWarning = budgetPercentage >= 80 && !isOverBudget;

  useEffect(() => {
    if (originalCurrency && amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        const result = convertCurrency(numAmount, originalCurrency, currency);
        setIsRolling(true);
        setTimeout(() => {
          setDisplayedAmount(result.convertedAmount);
          setIsRolling(false);
        }, 250);
      } else {
        setDisplayedAmount(0);
      }
    } else {
      setDisplayedAmount(0);
    }
  }, [amount, originalCurrency, currency]);

  useEffect(() => {
    if (isOverBudget && !alertDismissed) {
      playAlertSound();
    }
  }, [isOverBudget, alertDismissed]);

  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch {
      // 音频播放失败时静默处理
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const result = convertCurrency(numAmount, originalCurrency, currency);

    const newExpense = addExpense({
      tripId,
      category,
      amount: result.convertedAmount,
      originalAmount: numAmount,
      originalCurrency,
      note,
      date: date.replace('T', ' '),
    });

    setHighlightedId(newExpense.id);
    setTimeout(() => setHighlightedId(null), 2000);

    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }, 50);

    setShowForm(false);
    setAmount('');
    setNote('');
    setOriginalCurrency(currency);
    const now = new Date();
    setDate(now.toISOString().slice(0, 16));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!trip) {
    return <div className="empty-state">未找到旅行项目</div>;
  }

  const remaining = budget - totalSpent;
  const days = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="expense-tracker">
      <div className="page-header">
        <div className="flex items-center gap-md mb-md">
          <button
            className="btn btn-secondary"
            onClick={onBack}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            ← 返回
          </button>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{trip.destination}</h1>
            <p className="page-subtitle">
              {trip.startDate} ~ {trip.endDate} · {days}天
            </p>
          </div>
        </div>

        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="card" style={{ padding: '16px' }}>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>总预算</p>
            <p style={{ fontSize: '24px', fontWeight: 700 }}>
              {formatCurrency(budget, currency)}
            </p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>已花费</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: isOverBudget ? 'var(--accent-coral)' : 'var(--accent-mint)' }}>
              {formatCurrency(totalSpent, currency)}
            </p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>剩余</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: remaining >= 0 ? 'var(--accent-mint)' : 'var(--accent-coral)' }}>
              {formatCurrency(Math.max(remaining, 0), currency)}
            </p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>每日平均</p>
            <p style={{ fontSize: '24px', fontWeight: 700 }}>
              {formatCurrency(days > 0 ? totalSpent / days : 0, currency)}
            </p>
          </div>
        </div>

        <div className="mt-md">
          <div className="flex justify-between items-center mb-sm">
            <span className="text-secondary" style={{ fontSize: '13px' }}>
              预算使用进度
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: isOverBudget ? 'var(--accent-coral)' : isWarning ? 'var(--accent-orange)' : 'var(--accent-mint)',
              }}
            >
              {budgetPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: '12px' }}>
            <div
              className={`progress-fill ${isOverBudget ? 'progress-fill-danger' : isWarning ? 'progress-fill-warning' : 'progress-fill-safe'}`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {(isWarning || isOverBudget) && !alertDismissed && (
        <div className={`alert-banner ${isOverBudget ? 'alert-danger' : 'alert-warning'}`}>
          <div className="flex items-center gap-sm">
            <span style={{ fontSize: '20px' }}>{isOverBudget ? '🚨' : '⚠️'}</span>
            <span style={{ fontWeight: 500 }}>
              {isOverBudget
                ? `已超出预算 ${formatCurrency(Math.abs(remaining), currency)}！`
                : `已使用预算的 ${budgetPercentage.toFixed(1)}%，注意控制开销！`}
            </span>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-md">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          开销记录
        </h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + 记一笔
        </button>
      </div>

      <div
        ref={listRef}
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          paddingRight: '8px',
        }}
      >
        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <p>还没有开销记录，点击"记一笔"开始记录</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className={`expense-item ${highlightedId === expense.id ? 'highlight' : ''}`}
              style={{
                opacity: 0,
                animation: `fadeIn 0.3s ease-out forwards`,
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-md">
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `${categoryColors[expense.category]}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    {expense.category === 'transport' && '🚗'}
                    {expense.category === 'hotel' && '🏨'}
                    {expense.category === 'food' && '🍜'}
                    {expense.category === 'attraction' && '🎡'}
                    {expense.category === 'shopping' && '🛍️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-sm">
                      <span
                        className={`category-tag category-${expense.category}`}
                      >
                        {categoryLabels[expense.category]}
                      </span>
                      <span className="text-muted" style={{ fontSize: '12px' }}>
                        {formatDate(expense.date)}
                      </span>
                    </div>
                    {expense.note && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {expense.note}
                      </p>
                    )}
                    {expense.originalCurrency !== currency && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        原始: {getCurrencySymbol(expense.originalCurrency)}{expense.originalAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-mint)' }}>
                    {formatCurrency(expense.amount, currency)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-lg">
        <ChartPanel
          expensesByCategory={expensesByCategory}
          dailyExpenses={dailyExpenses}
          budget={budget}
          currency={currency}
        />
      </div>

      {showForm && (
        <div
          className="glass-modal"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="glass-modal-content">
            <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '24px' }}>
              记录开销
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">类别</label>
                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                  {(['transport', 'hotel', 'food', 'attraction', 'shopping'] as ExpenseCategory[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`category-tag category-${cat}`}
                        style={{
                          padding: '10px 16px',
                          fontSize: '13px',
                          border: `2px solid ${category === cat ? categoryColors[cat] : 'transparent'}`,
                          background: category === cat ? `${categoryColors[cat]}30` : 'var(--glass-bg)',
                          transition: 'all 0.3s ease-out',
                          transform: category === cat ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        {cat === 'transport' && '🚗 '}
                        {cat === 'hotel' && '🏨 '}
                        {cat === 'food' && '🍜 '}
                        {cat === 'attraction' && '🎡 '}
                        {cat === 'shopping' && '🛍️ '}
                        {categoryLabels[cat]}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">金额</label>
                <div className="flex gap-sm">
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      className="form-input"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="请输入金额"
                      autoFocus
                    />
                  </div>
                  <select
                    className="form-input"
                    value={originalCurrency}
                    onChange={(e) => setOriginalCurrency(e.target.value)}
                    style={{ width: '100px' }}
                  >
                    {['USD', 'EUR', 'CNY', 'JPY', 'GBP'].map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                </div>
                {originalCurrency !== currency && (
                  <div
                    className={`number-roll ${isRolling ? 'rolling' : ''}`}
                    style={{ marginTop: '8px', fontSize: '13px' }}
                  >
                    <span className="text-muted">换算为{currencyNames[currency]}: </span>
                    <span className="number-value" style={{ color: 'var(--accent-mint)', fontWeight: 600 }}>
                      {formatCurrency(displayedAmount, currency)}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">备注</label>
                <input
                  type="text"
                  className="form-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="添加备注（可选）"
                />
              </div>

              <div className="form-group">
                <label className="form-label">时间</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="flex gap-md" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowForm(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onMouseDown={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
