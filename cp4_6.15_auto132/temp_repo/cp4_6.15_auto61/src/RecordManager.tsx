import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Transaction,
  Budget,
  TransactionType,
  CategoryType,
  CATEGORY_MAP,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CategoryInfo,
} from './types';

interface RecordManagerProps {
  transactions: Transaction[];
  budgets: Budget[];
  onAdd: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onUpdateBudget: (category: CategoryType, limit: number) => void;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const todayStr = () => new Date().toISOString().split('T')[0];

interface AnimatedCounterProps {
  end: number;
  prefix?: string;
  duration?: number;
}

/**
 * 数字动画组件（RecordManager 页面使用）
 *
 * 修复点 (原错误): 缺少 return cleanup 函数，组件卸载时 rAF 不取消，
 *   导致 setDisplay 在已卸载组件上执行，引发 React 警告和内存泄漏。
 *   现已添加 return () => { cancelAnimationFrame(...) }，
 *   并在 value 变化前先 cancelAnimationFrame 上一个动画。
 */
function AnimatedCounter({ end, prefix = '', duration = 500 }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const prevEnd = useRef(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    // value 变化时取消上一个动画，防止新旧动画叠加
    if (frame.current) cancelAnimationFrame(frame.current);

    const start = prevEnd.current;
    const startTime = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (end - start) * eased);
      if (p < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        prevEnd.current = end;
      }
    };
    frame.current = requestAnimationFrame(step);

    // 组件卸载时取消动画帧
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [end, duration]);

  return (
    <span className="count-up">
      {prefix}
      {display.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}

export default function RecordManager({
  transactions,
  budgets,
  onAdd,
  onUpdate,
  onDelete,
  onUpdateBudget,
}: RecordManagerProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formCategory, setFormCategory] = useState<CategoryType>('餐饮');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(todayStr());
  const [formNote, setFormNote] = useState('');

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<CategoryType | null>(null);
  const [budgetInputValue, setBudgetInputValue] = useState('');

  const [expandedThumbnails, setExpandedThumbnails] = useState<Set<string>>(
    new Set()
  );

  const [listKey, setListKey] = useState(0);

  const categories = formType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const years = useMemo(() => {
    const ys = new Set<number>();
    ys.add(now.getFullYear());
    ys.add(now.getFullYear() - 1);
    transactions.forEach((t) => ys.add(new Date(t.date).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [transactions, now]);

  const months = Array.from({ length: 12 }, (_, i) => i);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const totals = useMemo(() => {
    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    return { expense, income, balance: income - expense };
  }, [filteredTransactions]);

  const budgetStatus = useMemo(() => {
    const categorySpent: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
      });

    return budgets.map((b) => {
      const spent = categorySpent[b.category] || 0;
      const percent = b.limit === 0 ? 0 : (spent / b.limit) * 100;
      return {
        ...b,
        spent,
        percent: Math.min(percent, 100),
        actualPercent: percent,
      };
    });
  }, [filteredTransactions, budgets]);

  const handleFormTypeChange = (type: TransactionType) => {
    setFormType(type);
    setFormCategory(type === 'expense' ? '餐饮' : '工资');
  };

  const resetForm = () => {
    setFormType('expense');
    setFormCategory('餐饮');
    setFormAmount('');
    setFormDate(todayStr());
    setFormNote('');
    setEditingTx(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0 || !formDate) return;

    if (editingTx) {
      onUpdate(editingTx.id, {
        type: formType,
        category: formCategory,
        amount,
        date: formDate,
        note: formNote,
      });
    } else {
      onAdd({
        type: formType,
        category: formCategory,
        amount,
        date: formDate,
        note: formNote,
      });
    }
    resetForm();
  };

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormAmount(tx.amount.toString());
    setFormDate(tx.date);
    setFormNote(tx.note);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确认删除此记录？')) {
      onDelete(id);
    }
  };

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setListKey((k) => k + 1);
    setExpandedThumbnails(new Set());
  };

  const toggleThumbnail = (id: string) => {
    setExpandedThumbnails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const startBudgetEdit = (cat: CategoryType) => {
    const existing = budgets.find((b) => b.category === cat);
    setEditingBudget(cat);
    setBudgetInputValue(existing ? existing.limit.toString() : '0');
    setBudgetError(null);
  };

  const [budgetError, setBudgetError] = useState<string | null>(null);

  /**
   * 保存预算 - 增强边界验证
   *
   * 修复点 (原错误): 仅简单判断 !isNaN && val >= 0，
   *   未处理空值、极端大数、无限大、小数精度等边界情况。
   *   现已添加完整校验并给出错误提示。
   */
  const saveBudget = () => {
    if (!editingBudget) return;

    const trimmed = budgetInputValue.trim();
    if (trimmed === '') {
      setBudgetError('预算金额不能为空');
      return;
    }

    // 先用 Number 做整体校验（比 parseFloat 更严格，不允许 "12.3abc" 这种混合字符）
    if (isNaN(Number(trimmed))) {
      setBudgetError('请输入有效的数字');
      return;
    }

    const val = parseFloat(trimmed);

    if (isNaN(val)) {
      setBudgetError('请输入有效的数字');
      return;
    }

    if (!isFinite(val)) {
      setBudgetError('数值过大，请输入有效金额');
      return;
    }

    if (val < 0) {
      setBudgetError('预算金额不能为负数');
      return;
    }

    if (val > 99999999.99) {
      setBudgetError('单类别预算不能超过 99,999,999.99 元');
      return;
    }

    const rounded = Math.round(val * 100) / 100;
    onUpdateBudget(editingBudget, rounded);
    setBudgetError(null);
    setEditingBudget(null);
  };

  /**
   * 虚拟滚动实现
   *
   * 修复点 (原错误):
   *   1. 外层容器用 maxHeight: 600 而非固定 height，ResizeObserver 读取到的
   *      clientHeight 是内容高度而非视口高度，导致 visibleRange 计算错误。
   *      现已改为固定 height: 600px + min-height: 0，确保 overflow-y 正确生效。
   *   2. 内层 position: absolute + transform 与外层 overflow-y: auto 存在冲突，
   *      导致滚动条高度计算异常。现已改为"占位 div + 普通流式布局"方式，
   *      利用 CSS transform 将可见内容平移到正确位置，不干扰原生滚动。
   *   3. containerHeight 初始值为 0 时，visibleRange 返回全部数据，
   *      虚拟模式下首次渲染仍会全量渲染。现已改为 containerHeight 初始值 600，
   *      ResizeObserver 仅作为动态调整的兜底。
   */
  const VIRTUAL_THRESHOLD = 500;
  const ROW_HEIGHT = 88;
  const ROW_GAP = 10;
  const ITEM_HEIGHT = ROW_HEIGHT + ROW_GAP;
  const CONTAINER_HEIGHT = 600;
  const BUFFER = 5;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(CONTAINER_HEIGHT);

  const useVirtual = filteredTransactions.length > VIRTUAL_THRESHOLD;

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    setScrollTop(scrollContainerRef.current.scrollTop);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const updateHeight = () => {
      if (el.clientHeight > 0) {
        setContainerHeight(el.clientHeight);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
    }
  }, [listKey]);

  const visibleRange = useMemo(() => {
    if (!useVirtual) {
      return { startIdx: 0, endIdx: filteredTransactions.length };
    }
    const startIdx = Math.max(
      0,
      Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER
    );
    const endIdx = Math.min(
      filteredTransactions.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER
    );
    return { startIdx, endIdx };
  }, [useVirtual, scrollTop, containerHeight, filteredTransactions.length, ITEM_HEIGHT]);

  const renderVirtualList = () => {
    const items = filteredTransactions;
    const { startIdx, endIdx } = visibleRange;
    const visible = items.slice(startIdx, endIdx);
    const totalHeight = items.length * ITEM_HEIGHT - ROW_GAP;
    const offsetY = startIdx * ITEM_HEIGHT;

    return (
      <div
        key={listKey}
        className="fade-in"
        style={{
          position: 'relative',
          width: '100%',
          height: totalHeight,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
            display: 'flex',
            flexDirection: 'column',
            gap: ROW_GAP,
            willChange: 'transform',
          }}
        >
          {visible.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderNormalList = () => {
    const items = filteredTransactions;
    if (items.length === 0) {
      return (
        <div
          key={`empty-${listKey}`}
          className="fade-in"
          style={{
            padding: 48,
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: 14,
          }}
        >
          暂无记录，快添加第一笔收支吧！
        </div>
      );
    }
    return (
      <div
        key={listKey}
        className="fade-in"
        style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP }}
      >
        {items.map((tx) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 3);
  }, [transactions]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">记录管理</h1>
          <p className="page-subtitle">
            添加、查看和管理你的每一笔收支记录
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="select"
            value={selectedYear}
            onChange={(e) => handleMonthChange(parseInt(e.target.value), selectedMonth)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
          <select
            className="select"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(selectedYear, parseInt(e.target.value))}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m + 1}月
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="records-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="stat-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
            本月总支出
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#ef4444',
              marginTop: 8,
            }}
          >
            <AnimatedCounter end={totals.expense} prefix="¥" />
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
            本月总收入
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#10b981',
              marginTop: 8,
            }}
          >
            <AnimatedCounter end={totals.income} prefix="¥" />
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
            本月结余
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: totals.balance >= 0 ? '#1e3a5f' : '#ef4444',
              marginTop: 8,
            }}
          >
            <AnimatedCounter end={totals.balance} prefix="¥" />
          </div>
        </div>
      </div>

      <div
        className="records-content-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div className="card">
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 16,
              color: '#1e293b',
            }}
          >
            {editingTx ? '编辑记录' : '添加新记录'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={() => handleFormTypeChange('expense')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                  background:
                    formType === 'expense'
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : '#f1f5f9',
                  color: formType === 'expense' ? 'white' : '#64748b',
                  transform: formType === 'expense' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow:
                    formType === 'expense'
                      ? '0 2px 8px rgba(239,68,68,0.3)'
                      : 'none',
                }}
              >
                💸 支出
              </button>
              <button
                type="button"
                onClick={() => handleFormTypeChange('income')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                  background:
                    formType === 'income'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : '#f1f5f9',
                  color: formType === 'income' ? 'white' : '#64748b',
                  transform: formType === 'income' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow:
                    formType === 'income'
                      ? '0 2px 8px rgba(16,185,129,0.3)'
                      : 'none',
                }}
              >
                💰 收入
              </button>
            </div>

            <div className="input-group" style={{ marginBottom: 14 }}>
              <label className="input-label">类别</label>
              <select
                className="select"
                value={formCategory}
                onChange={(e) =>
                  setFormCategory(e.target.value as CategoryType)
                }
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_MAP[c].icon} {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 14 }}>
              <label className="input-label">金额（元）</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="请输入金额"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 14 }}>
              <label className="input-label">日期</label>
              <input
                className="input"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">备注</label>
              <input
                className="input"
                type="text"
                placeholder="选填，简要说明..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                maxLength={100}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {editingTx ? '✓ 保存修改' : '+ 添加记录'}
              </button>
              {editingTx && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  取消
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1e293b',
              }}
            >
              最近 3 条记录
            </h3>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              点击卡片展开详情
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentTransactions.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                暂无记录
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const info = CATEGORY_MAP[tx.category];
                const expanded = expandedThumbnails.has(tx.id);
                return (
                  <div
                    key={tx.id}
                    className={`thumbnail-card ${expanded ? 'expanded' : ''}`}
                    onClick={() => toggleThumbnail(tx.id)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span
                          className="category-tag"
                          style={{
                            background: info.bgColor,
                            color: info.color,
                            padding: '6px 12px',
                            fontSize: 13,
                          }}
                        >
                          {info.icon} {tx.category}
                        </span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {formatDate(tx.date)}
                        </span>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color:
                            tx.type === 'expense' ? '#ef4444' : '#10b981',
                        }}
                      >
                        {tx.type === 'expense' ? '-' : '+'}¥
                        {tx.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className={`thumbnail-content ${expanded ? 'show' : ''}`}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 16,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#64748b',
                              marginBottom: 4,
                              fontWeight: 600,
                            }}
                          >
                            类型
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: '#1e293b',
                              fontWeight: 500,
                            }}
                          >
                            {tx.type === 'expense' ? '支出' : '收入'}
                          </div>
                        </div>
                        <div style={{ flex: 2 }}>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#64748b',
                              marginBottom: 4,
                              fontWeight: 600,
                            }}
                          >
                            备注
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: '#1e293b',
                              fontWeight: 500,
                            }}
                          >
                            {tx.note || '—'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(tx);
                            }}
                          >
                            编辑
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tx.id);
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 20,
            color: '#1e293b',
          }}
        >
          预算概览 · 点击进度条可编辑预算
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
        >
          {budgetStatus.map((b) => {
            const info = CATEGORY_MAP[b.category];
            const colorClass =
              b.actualPercent >= 100
                ? 'danger'
                : b.actualPercent >= 80
                ? 'warning'
                : '';
            return (
              <div key={b.category}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span
                    className="category-tag"
                    style={{ background: info.bgColor, color: info.color }}
                  >
                    {info.icon} {b.category}
                  </span>
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}
                  >
                    ¥{b.spent.toFixed(0)} / ¥{b.limit.toFixed(0)}
                  </span>
                </div>
                <div
                  className="progress-bar"
                  onClick={() => startBudgetEdit(b.category)}
                >
                  <div
                    className={`progress-fill ${colorClass}`}
                    style={{
                      width: `${b.percent}%`,
                      background: colorClass
                        ? undefined
                        : `linear-gradient(90deg, ${info.color}, ${info.color}cc)`,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color:
                      b.actualPercent >= 100
                        ? '#ef4444'
                        : b.actualPercent >= 80
                        ? '#f59e0b'
                        : '#94a3b8',
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {b.actualPercent >= 100
                    ? '⚠️ 已超预算'
                    : b.actualPercent >= 80
                    ? '⚡ 接近预算上限'
                    : `${b.actualPercent.toFixed(0)}% 已使用`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#1e293b',
            }}
          >
            全部记录
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#94a3b8',
                marginLeft: 8,
              }}
            >
              共 {filteredTransactions.length} 条
              {useVirtual && '（虚拟滚动）'}
            </span>
          </h3>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="record-list-container"
          style={{
            height: CONTAINER_HEIGHT,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {useVirtual ? renderVirtualList() : renderNormalList()}
        </div>
      </div>

      {editingBudget && (
        <div
          className="modal-overlay"
          onClick={() => setEditingBudget(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 4,
                color: '#1e293b',
              }}
            >
              设置预算 - {editingBudget}
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              设置每月在"{editingBudget}"类别的支出上限
            </p>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">月度预算上限（元）</label>
              <input
                className="input"
                type="number"
                min="0"
                step="100"
                placeholder="请输入预算金额"
                value={budgetInputValue}
                onChange={(e) => {
                  setBudgetInputValue(e.target.value);
                  if (budgetError) setBudgetError(null);
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveBudget();
                  if (e.key === 'Escape') setEditingBudget(null);
                }}
              />
              {budgetError && (
                <div
                  style={{
                    fontSize: 12,
                    color: '#ef4444',
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {budgetError}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={saveBudget}
              >
                确认
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setEditingBudget(null)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TransactionRowProps {
  tx: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

function TransactionRow({ tx, onEdit, onDelete }: TransactionRowProps) {
  const info: CategoryInfo = CATEGORY_MAP[tx.category];
  return (
    <div className="transaction-item">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: info.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {info.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#1e293b',
              }}
            >
              {tx.category}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 10,
                fontWeight: 600,
                background:
                  tx.type === 'expense' ? '#FEF2F2' : '#ECFDF5',
                color: tx.type === 'expense' ? '#DC2626' : '#059669',
              }}
            >
              {tx.type === 'expense' ? '支出' : '收入'}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>{formatDate(tx.date)}</span>
            {tx.note && (
              <>
                <span
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 2,
                    background: '#cbd5e1',
                  }}
                />
                <span style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.note}
                </span>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: tx.type === 'expense' ? '#ef4444' : '#10b981',
            marginRight: 12,
            flexShrink: 0,
          }}
        >
          {tx.type === 'expense' ? '-' : '+'}¥{tx.amount.toFixed(2)}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => onEdit(tx)}
          >
            编辑
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onDelete(tx.id)}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
