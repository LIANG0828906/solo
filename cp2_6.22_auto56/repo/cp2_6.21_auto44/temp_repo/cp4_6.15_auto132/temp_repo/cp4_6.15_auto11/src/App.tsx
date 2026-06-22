import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Participant, Expense, SettlementItem, TransferHistory, PageType } from './shared/types';
import { AVATAR_OPTIONS } from './shared/types';
import { generateId, formatCurrency, formatDate, getMonthKey } from './shared/utils';
import ExpenseForm from './expenses/ExpenseForm';
import ExpenseList from './expenses/ExpenseList';
import ExpenseDetail from './expenses/ExpenseDetail';
import SettlementView from './settlement/SettlementView';
import { calculateDebts, generateSettlement } from './settlement/SettlementEngine';
import styles from './App.module.css';

const STORAGE_KEY = 'expense-splitter-data';

interface AppData {
  participants: Participant[];
  expenses: Expense[];
  history: TransferHistory[];
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    participants: [
      { id: generateId(), name: '我', avatar: '👤', isCurrentUser: true },
      { id: generateId(), name: '小明', avatar: '👨' },
      { id: generateId(), name: '小红', avatar: '👩' },
    ],
    expenses: [],
    history: [],
  };
}

export default function App() {
  const initialData = useMemo(loadData, []);
  const [participants, setParticipants] = useState<Participant[]>(initialData.participants);
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses);
  const [history, setHistory] = useState<TransferHistory[]>(initialData.history);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterPerson, setFilterPerson] = useState<string>('all');

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ participants, expenses, history })
    );
  }, [participants, expenses, history]);

  const debts = useMemo(
    () => calculateDebts(expenses, participants),
    [expenses, participants]
  );

  const settlementItems = useMemo(
    () => generateSettlement(debts),
    [debts]
  );

  const unsettledCount = useMemo(
    () => expenses.filter((e) => !e.isSettled).length,
    [expenses]
  );

  const totalUnsettled = useMemo(
    () =>
      expenses
        .filter((e) => !e.isSettled)
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const addParticipant = useCallback(() => {
    setParticipants((prev) => [
      ...prev,
      {
        id: generateId(),
        name: `成员${prev.length + 1}`,
        avatar: AVATAR_OPTIONS[prev.length % AVATAR_OPTIONS.length],
      },
    ]);
  }, []);

  const updateParticipant = useCallback((id: string, updates: Partial<Participant>) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const removeParticipant = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setExpenses((prev) =>
      prev
        .filter((e) => e.payerId !== id || e.isSettled)
        .map((e) => ({
          ...e,
          splitDetails: e.splitDetails.filter((d) => d.participantId !== id),
        }))
    );
  }, []);

  const addExpense = useCallback((expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const confirmSettlements = useCallback(
    (items: SettlementItem[]) => {
      const validItems = items.filter((i) => !i.isIgnored && i.amount > 0);
      if (validItems.length === 0) return;

      const now = Date.now();
      const expenseIds = expenses
        .filter((e) => !e.isSettled)
        .map((e) => e.id);

      const newHistory: TransferHistory[] = validItems.map((item) => ({
        id: item.id,
        fromParticipantId: item.fromParticipantId,
        toParticipantId: item.toParticipantId,
        amount: item.amount,
        settledAt: now,
        relatedExpenseIds: expenseIds,
        description: '批量结算',
      }));

      setHistory((prev) => [...newHistory, ...prev]);
      setExpenses((prev) =>
        prev.map((e) => (e.isSettled ? e : { ...e, isSettled: true }))
      );
    },
    [expenses]
  );

  const removeHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      if (filterMonth !== 'all') {
        const date = new Date(h.settledAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (key !== filterMonth) return false;
      }
      if (filterPerson !== 'all') {
        if (h.fromParticipantId !== filterPerson && h.toParticipantId !== filterPerson) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const from = participants.find((p) => p.id === h.fromParticipantId);
        const to = participants.find((p) => p.id === h.toParticipantId);
        const q = searchQuery.toLowerCase();
        if (
          !(from?.name.toLowerCase().includes(q) ||
            to?.name.toLowerCase().includes(q) ||
            h.description.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [history, filterMonth, filterPerson, searchQuery, participants]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => {
      const date = new Date(h.settledAt);
      set.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort().reverse();
  }, [history]);

  return (
    <div className={styles.app}>
      <aside
        className={`${styles.sidebar} ${
          sidebarCollapsed ? styles.sidebarCollapsed : ''
        }`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>💸</span>
            {!sidebarCollapsed && <span className={styles.logoText}>分摊助手</span>}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed((c) => !c)}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className={styles.nav}>
          <NavButton
            icon="📝"
            label="费用管理"
            active={currentPage === 'home'}
            collapsed={sidebarCollapsed}
            badge={unsettledCount > 0 ? unsettledCount : undefined}
            onClick={() => setCurrentPage('home')}
          />
          <NavButton
            icon="🔄"
            label="结算方案"
            active={currentPage === 'settlement'}
            collapsed={sidebarCollapsed}
            badge={settlementItems.length > 0 ? settlementItems.length : undefined}
            onClick={() => setCurrentPage('settlement')}
          />
          <NavButton
            icon="📚"
            label="历史记录"
            active={currentPage === 'history'}
            collapsed={sidebarCollapsed}
            onClick={() => setCurrentPage('history')}
          />
        </nav>

        {!sidebarCollapsed && (
          <div className={styles.summary}>
            <div className={styles.summaryTitle}>待结算</div>
            <div className={styles.summaryAmount}>¥{totalUnsettled.toFixed(2)}</div>
            <div className={styles.summarySub}>
              {unsettledCount} 笔费用 · {settlementItems.length} 笔转账
            </div>
          </div>
        )}
      </aside>

      <nav className={styles.bottomNav}>
        <NavButton
          icon="📝"
          label="费用"
          active={currentPage === 'home'}
          collapsed={false}
          badge={unsettledCount > 0 ? unsettledCount : undefined}
          onClick={() => setCurrentPage('home')}
          vertical
        />
        <NavButton
          icon="🔄"
          label="结算"
          active={currentPage === 'settlement'}
          collapsed={false}
          badge={settlementItems.length > 0 ? settlementItems.length : undefined}
          onClick={() => setCurrentPage('settlement')}
          vertical
        />
        <NavButton
          icon="📚"
          label="历史"
          active={currentPage === 'history'}
          collapsed={false}
          onClick={() => setCurrentPage('history')}
          vertical
        />
      </nav>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          {currentPage === 'home' && (
            <div className={styles.gridLayout}>
              <div className={styles.leftCol}>
                <ExpenseForm
                  participants={participants}
                  onSubmit={addExpense}
                />
                <ExpenseList
                  expenses={expenses.filter((e) => !e.isSettled)}
                  participants={participants}
                  onRemove={removeExpense}
                  onViewDetail={setDetailExpense}
                  debts={debts}
                />
              </div>
              <div className={styles.rightCol}>
                <ParticipantPanel
                  participants={participants}
                  debts={debts}
                  onAdd={addParticipant}
                  onUpdate={updateParticipant}
                  onRemove={removeParticipant}
                />
              </div>
            </div>
          )}

          {currentPage === 'settlement' && (
            <SettlementView
              items={settlementItems}
              participants={participants}
              debts={debts}
              onConfirm={confirmSettlements}
            />
          )}

          {currentPage === 'history' && (
            <HistoryView
              history={filteredHistory}
              participants={participants}
              onRemove={removeHistory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterMonth={filterMonth}
              onFilterMonthChange={setFilterMonth}
              filterPerson={filterPerson}
              onFilterPersonChange={setFilterPerson}
              availableMonths={availableMonths}
            />
          )}
        </div>
      </main>

      {detailExpense && (
        <ExpenseDetail
          expense={detailExpense}
          participants={participants}
          onClose={() => setDetailExpense(null)}
        />
      )}
    </div>
  );
}

interface NavButtonProps {
  icon: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  onClick: () => void;
  vertical?: boolean;
}

function NavButton({
  icon,
  label,
  active,
  collapsed,
  badge,
  onClick,
  vertical,
}: NavButtonProps) {
  return (
    <button
      className={`${styles.navBtn} ${active ? styles.navBtnActive : ''} ${
        vertical ? styles.navBtnVertical : ''
      } ${collapsed ? styles.navBtnCollapsed : ''}`}
      onClick={onClick}
    >
      <span className={styles.navBtnIcon}>{icon}</span>
      {!collapsed && <span className={styles.navBtnLabel}>{label}</span>}
      {badge !== undefined && badge > 0 && (
        <span className={styles.navBtnBadge}>{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
  );
}

interface ParticipantPanelProps {
  participants: Participant[];
  debts: ReturnType<typeof calculateDebts>;
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<Participant>) => void;
  onRemove: (id: string) => void;
}

const ParticipantPanel = React.memo(function ParticipantPanel({
  participants,
  debts,
  onAdd,
  onUpdate,
  onRemove,
}: ParticipantPanelProps) {
  const [showAvatarPicker, setShowAvatarPicker] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');

  const handleStartEdit = (p: Participant) => {
    setEditingName(p.id);
    setNameValue(p.name);
  };

  const handleSaveName = (id: string) => {
    const trimmed = nameValue.trim();
    if (trimmed) onUpdate(id, { name: trimmed });
    setEditingName(null);
  };

  const balanceOf = (id: string) =>
    debts.find((d) => d.participantId === id)?.balance ?? 0;

  return (
    <div className={styles.participantPanel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>参与人</h3>
        <button className={styles.addBtn} onClick={onAdd}>
          <span>+</span> 添加
        </button>
      </div>

      <div className={styles.participantList}>
        {participants.map((p, idx) => {
          const bal = balanceOf(p.id);
          return (
            <div
              key={p.id}
              className={`${styles.participantItem} ${
                p.isCurrentUser ? styles.currentUser : ''
              }`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className={styles.avatarWrap}>
                <button
                  className={styles.avatarBtn}
                  onClick={() =>
                    setShowAvatarPicker(showAvatarPicker === p.id ? null : p.id)
                  }
                >
                  {p.avatar}
                </button>
                {showAvatarPicker === p.id && (
                  <div
                    className={styles.avatarPicker}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {AVATAR_OPTIONS.map((a) => (
                      <button
                        key={a}
                        className={styles.avatarOption}
                        onClick={() => {
                          onUpdate(p.id, { avatar: a });
                          setShowAvatarPicker(null);
                        }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.participantInfo}>
                {editingName === p.id ? (
                  <input
                    className={styles.nameInput}
                    value={nameValue}
                    autoFocus
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={() => handleSaveName(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName(p.id);
                      if (e.key === 'Escape') setEditingName(null);
                    }}
                  />
                ) : (
                  <button
                    className={styles.nameBtn}
                    onClick={() => handleStartEdit(p)}
                  >
                    {p.name}
                    {p.isCurrentUser && (
                      <span className={styles.currentBadge}>我</span>
                    )}
                  </button>
                )}
                <div
                  className={`${styles.balance} ${
                    bal > 0.01
                      ? styles.balancePositive
                      : bal < -0.01
                      ? styles.balanceNegative
                      : styles.balanceZero
                  }`}
                >
                  {bal > 0.01
                    ? `应收 ¥${bal.toFixed(2)}`
                    : bal < -0.01
                    ? `应付 ¥${Math.abs(bal).toFixed(2)}`
                    : '已结清'}
                </div>
              </div>

              {participants.length > 1 && !p.isCurrentUser && (
                <button
                  className={styles.removeBtn}
                  onClick={() => onRemove(p.id)}
                  aria-label="删除"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

interface HistoryViewProps {
  history: TransferHistory[];
  participants: Participant[];
  onRemove: (id: string) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterMonth: string;
  onFilterMonthChange: (v: string) => void;
  filterPerson: string;
  onFilterPersonChange: (v: string) => void;
  availableMonths: string[];
}

const HistoryView = React.memo(function HistoryView({
  history,
  participants,
  onRemove,
  searchQuery,
  onSearchChange,
  filterMonth,
  onFilterMonthChange,
  filterPerson,
  onFilterPersonChange,
  availableMonths,
}: HistoryViewProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<Record<string, number>>({});

  const participantOf = (id: string) =>
    participants.find((p) => p.id === id);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      onRemove(id);
      setDeletingId(null);
      setSwipeOffset((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    setSwipeStartX(e.touches[0].clientX);
    setSwipeOffset((prev) => ({ ...prev, [id]: prev[id] ?? 0 }));
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (swipeStartX === null) return;
    const delta = e.touches[0].clientX - swipeStartX;
    const prev = swipeOffset[id] ?? 0;
    const total = Math.min(0, Math.max(-120, prev + delta));
    setSwipeOffset((prevState) => ({ ...prevState, [id]: total }));
  };

  const handleTouchEnd = (_e: React.TouchEvent, id: string) => {
    const offset = swipeOffset[id] ?? 0;
    if (offset < -60) {
      setSwipeOffset((prev) => ({ ...prev, [id]: -88 }));
    } else {
      setSwipeOffset((prev) => ({ ...prev, [id]: 0 }));
    }
    setSwipeStartX(null);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, TransferHistory[]>();
    history.forEach((h) => {
      const key = formatDate(h.settledAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [history]);

  const totalAmount = useMemo(
    () => history.reduce((s, h) => s + h.amount, 0),
    [history]
  );

  return (
    <div className={styles.historyView}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>历史记录</h2>
          <div className={styles.pageSubtitle}>
            共 {history.length} 笔转账 · 合计 {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <span>🔍</span>
          <input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterMonth}
          onChange={(e) => onFilterMonthChange(e.target.value)}
        >
          <option value="all">全部月份</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={filterPerson}
          onChange={(e) => onFilterPersonChange(e.target.value)}
        >
          <option value="all">全部人员</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.avatar} {p.name}
            </option>
          ))}
        </select>
      </div>

      {grouped.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyText}>暂无历史记录</div>
          <div className={styles.emptySub}>完成结算后会自动记录在这里</div>
        </div>
      ) : (
        grouped.map(([date, items]) => (
          <div key={date} className={styles.historyGroup}>
            <div className={styles.groupHeader}>
              <span>{date}</span>
              <span className={styles.groupMeta}>
                {items.length} 笔 ·{' '}
                {formatCurrency(items.reduce((s, h) => s + h.amount, 0))}
              </span>
            </div>
            <div className={styles.historyList}>
              {items.map((h, idx) => {
                const from = participantOf(h.fromParticipantId);
                const to = participantOf(h.toParticipantId);
                const offset = swipeOffset[h.id] ?? 0;
                const isDeleting = deletingId === h.id;
                return (
                  <div
                    key={h.id}
                    className={`${styles.historyItemWrap} ${
                      isDeleting ? styles.slideOut : ''
                    }`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <button
                      className={styles.deleteReveal}
                      onClick={() => handleDelete(h.id)}
                    >
                      🗑️ 删除
                    </button>
                    <div
                      className={styles.historyItem}
                      style={{
                        transform: `translateX(${offset}px)`,
                        transition:
                          swipeStartX === null
                            ? 'transform 200ms ease'
                            : 'none',
                      }}
                      onTouchStart={(e) => handleTouchStart(e, h.id)}
                      onTouchMove={(e) => handleTouchMove(e, h.id)}
                      onTouchEnd={(e) => handleTouchEnd(e, h.id)}
                    >
                      <div className={styles.historyAvatars}>
                        <div className={styles.miniAvatar}>{from?.avatar ?? '👤'}</div>
                        <span className={styles.miniArrow}>→</span>
                        <div className={styles.miniAvatar}>{to?.avatar ?? '👤'}</div>
                      </div>
                      <div className={styles.historyInfo}>
                        <div className={styles.historyTitle}>
                          {from?.name ?? '未知'} → {to?.name ?? '未知'}
                        </div>
                        <div className={styles.historyDesc}>
                          {h.description} · {getMonthKey(h.settledAt)}
                        </div>
                      </div>
                      <div className={styles.historyAmount}>
                        {formatCurrency(h.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
});
