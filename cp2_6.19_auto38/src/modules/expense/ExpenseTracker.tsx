import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChartPanel from './ChartPanel';
import { useExpenseStore } from './store';
import { useTripStore } from '../trip/store';
import type { ExpenseCategory, ExpenseFormData } from './types';
import { EXPENSE_CATEGORIES, CATEGORY_ICONS, CATEGORY_CLASS_MAP } from './types';
import { convertCurrency, CURRENCY_LIST, formatCurrency } from '@/utils/currency';
import type { CurrencyCode } from '../trip/types';
import { CURRENCY_SYMBOLS } from '../trip/types';
import NumberRoller from '@/components/NumberRoller';

interface ExpenseTrackerProps {
  tripId: string;
}

interface FormErrors {
  category?: string;
  originalAmount?: string;
  originalCurrency?: string;
  timestamp?: string;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ tripId }) => {
  const trip = useTripStore((state) => state.getTripById(tripId));
  
  const {
    expenses,
    totalExpenses,
    budgetPercentage,
    dailyBudget,
    categoryTotals,
    cumulativeExpenses,
    addExpense,
    highlightedExpenseId,
    setHighlightedExpense,
  } = useExpenseStore((state) => ({
    expenses: state.getExpensesByTrip(tripId),
    totalExpenses: state.getTotalExpenses(tripId),
    budgetPercentage: trip ? state.getBudgetPercentage(tripId, trip.budget) : 0,
    dailyBudget: trip ? state.getDailyBudget(trip) : 0,
    categoryTotals: state.getCategoryTotals(tripId),
    cumulativeExpenses: trip ? state.getCumulativeExpenses(trip) : [],
    addExpense: state.addExpense,
    highlightedExpenseId: state.highlightedExpenseId,
    setHighlightedExpense: state.setHighlightedExpense,
  }));

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<ExpenseFormData, 'amount'>>({
    tripId,
    category: '餐饮',
    originalAmount: 0,
    originalCurrency: trip?.currency || 'CNY',
    note: '',
    timestamp: new Date().toISOString().slice(0, 16),
  });
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const expenseListRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (trip) {
      setFormData((prev) => ({
        ...prev,
        tripId,
        originalCurrency: trip.currency,
      }));
    }
  }, [tripId, trip]);

  useEffect(() => {
    if (formData.originalAmount > 0 && formData.originalCurrency && trip) {
      const result = convertCurrency(
        formData.originalAmount,
        formData.originalCurrency,
        trip.currency
      );
      setConvertedAmount(result.convertedAmount);
    } else {
      setConvertedAmount(0);
    }
  }, [formData.originalAmount, formData.originalCurrency, trip]);

  useEffect(() => {
    if (highlightedExpenseId) {
      const timer = setTimeout(() => {
        setHighlightedExpense(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedExpenseId, setHighlightedExpense]);

  useEffect(() => {
    if (highlightedExpenseId && expenseListRef.current) {
      const element = document.getElementById(`expense-${highlightedExpenseId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedExpenseId]);

  const playAlertSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(880, now, 0.15);
      playTone(660, now + 0.15, 0.15);
      playTone(440, now + 0.30, 0.15);

    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  const validateField = useCallback((name: keyof ExpenseFormData, value: string | number): string | undefined => {
    switch (name) {
      case 'category':
        if (!value) return '请选择类别';
        return undefined;
      case 'originalAmount':
        if (typeof value === 'number' && value <= 0) return '请输入有效金额';
        return undefined;
      case 'originalCurrency':
        if (!value) return '请选择货币类型';
        return undefined;
      case 'timestamp':
        if (!value) return '请选择时间';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'originalAmount' ? parseFloat(value) || 0 : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (touched[name]) {
      const error = validateField(name as keyof ExpenseFormData, processedValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'originalAmount' ? parseFloat(value) || 0 : value;

    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof ExpenseFormData, processedValue);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    const fieldsToValidate: Array<keyof ExpenseFormData> = ['category', 'originalAmount', 'originalCurrency', 'timestamp'];

    fieldsToValidate.forEach((key) => {
      const value = formData[key];
      const error = validateField(key, value as string | number);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({
      category: true,
      originalAmount: true,
      originalCurrency: true,
      timestamp: true,
    });

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !trip) return;

    const prevPercentage = budgetPercentage;

    addExpense({
      ...formData,
      amount: convertedAmount,
    });

    const newPercentage = useExpenseStore.getState().getBudgetPercentage(tripId, trip.budget);
    if (prevPercentage < 100 && newPercentage >= 100) {
      playAlertSound();
    }

    setShowForm(false);
    setFormData({
      tripId,
      category: '餐饮',
      originalAmount: 0,
      originalCurrency: trip.currency,
      note: '',
      timestamp: new Date().toISOString().slice(0, 16),
    });
    setErrors({});
    setTouched({});
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setErrors({});
    setTouched({});
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (!trip) {
    return <div className="text-center py-16 text-muted">未找到该旅行项目</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{trip.destination}</h1>
          <p className="text-muted text-sm">
            {new Date(trip.startDate).toLocaleDateString('zh-CN')} - {new Date(trip.endDate).toLocaleDateString('zh-CN')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + 记录开销
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card animate-fade-in-up stagger-1">
          <div className="text-sm text-muted mb-1">总预算</div>
          <div className="text-xl font-semibold text-cyan">
            {CURRENCY_SYMBOLS[trip.currency]}{trip.budget.toLocaleString()}
          </div>
        </div>
        <div className="card animate-fade-in-up stagger-2">
          <div className="text-sm text-muted mb-1">已花费</div>
          <div className="text-xl font-semibold">
            <NumberRoller value={totalExpenses} currency={trip.currency} decimals={0} />
          </div>
        </div>
        <div className="card animate-fade-in-up stagger-3">
          <div className="text-sm text-muted mb-1">每日预算</div>
          <div className="text-xl font-semibold">
            <NumberRoller value={dailyBudget} currency={trip.currency} decimals={0} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-secondary">预算使用进度</span>
          <span className={budgetPercentage >= 80 ? 'text-orange font-semibold' : 'text-cyan font-semibold'}>
            {budgetPercentage}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${
              budgetPercentage >= 100 ? 'danger' : budgetPercentage >= 80 ? 'warning' : 'success'
            }`}
            style={{ width: `${Math.min(100, budgetPercentage)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">开销记录</h2>
          <div
            ref={expenseListRef}
            className="max-h-[500px] overflow-y-auto pr-2"
          >
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💸</div>
                <p className="text-muted">还没有开销记录，点击上方按钮开始记录</p>
              </div>
            ) : (
              expenses.map((expense) => (
                <div
                  key={expense.id}
                  id={`expense-${expense.id}`}
                  className={`expense-item ${
                    highlightedExpenseId === expense.id ? 'highlight' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{CATEGORY_ICONS[expense.category]}</span>
                      <div>
                        <div className="font-medium">{expense.note || expense.category}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`category-tag ${CATEGORY_CLASS_MAP[expense.category]}`}>
                            {expense.category}
                          </span>
                          <span className="text-sm text-muted">{formatDateTime(expense.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatCurrency(expense.amount, trip.currency)}
                      </div>
                      {expense.originalCurrency !== trip.currency && (
                        <div className="text-sm text-muted">
                          原始: {CURRENCY_SYMBOLS[expense.originalCurrency as CurrencyCode] || expense.originalCurrency}
                          {expense.originalAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">数据统计</h2>
          <ChartPanel
            expenses={expenses}
            budget={trip.budget}
            currency={trip.currency}
            cumulativeData={cumulativeExpenses}
            categoryTotals={categoryTotals}
          />
        </div>
      </div>

      <div className={`modal-overlay ${showForm ? 'show' : ''}`} onClick={handleCloseForm}>
        <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-6">记录开销</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">类别</label>
              <div className="grid grid-cols-5 gap-2">
                {EXPENSE_CATEGORIES.map((cat: ExpenseCategory) => (
                  <button
                    key={cat}
                    type="button"
                    className={`p-3 rounded-lg text-center transition-all ${
                      formData.category === cat
                        ? 'bg-cyan-500/20 border-2 border-cyan-400'
                        : 'bg-[#0f3460] border-2 border-transparent hover:border-cyan-400/30'
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                  >
                    <div className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</div>
                    <div className="text-xs">{cat}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">金额</label>
                <input
                  type="number"
                  name="originalAmount"
                  value={formData.originalAmount || ''}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.originalAmount && touched.originalAmount ? 'error' : ''}`}
                  placeholder="请输入金额"
                  min="0"
                  step="0.01"
                />
                <div className={`error-message ${errors.originalAmount && touched.originalAmount ? 'show' : ''}`}>
                  {errors.originalAmount}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">货币类型</label>
                <select
                  name="originalCurrency"
                  value={formData.originalCurrency}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {CURRENCY_LIST.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {convertedAmount > 0 && formData.originalCurrency !== trip.currency && (
              <div className="form-group p-4 bg-[#0f3460] rounded-lg animate-scale-in">
                <div className="text-sm text-muted mb-1">换算结果</div>
                <div className="text-xl font-semibold text-cyan">
                  <NumberRoller value={convertedAmount} currency={trip.currency} />
                </div>
                <div className="text-xs text-muted mt-1">
                  汇率: 1 {formData.originalCurrency} = {(convertCurrency(1, formData.originalCurrency, trip.currency).rate).toFixed(4)} {trip.currency}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                className="form-input"
                placeholder="输入备注信息（可选）"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label">发生时间</label>
              <input
                type="datetime-local"
                name="timestamp"
                value={formData.timestamp}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.timestamp && touched.timestamp ? 'error' : ''}`}
              />
              <div className={`error-message ${errors.timestamp && touched.timestamp ? 'show' : ''}`}>
                {errors.timestamp}
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button type="button" className="btn btn-secondary flex-1" onClick={handleCloseForm}>
                取消
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                确认记录
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
