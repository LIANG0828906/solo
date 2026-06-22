import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Dashboard from './Dashboard';
import RecordManager from './RecordManager';
import {
  Transaction,
  Budget,
  DEFAULT_BUDGETS,
  TransactionType,
  CategoryType,
} from './types';

type ViewType = 'dashboard' | 'records';

const STORAGE_KEY = 'finance_tracker_data';

interface StoredData {
  transactions: Transaction[];
  budgets: Budget[];
}

const loadSampleData = (): StoredData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    /* ignore */
  }

  const today = new Date();
  const sampleTransactions: Transaction[] = [];
  const dateStr = (d: Date) => d.toISOString().split('T')[0];

  const addTx = (
    type: TransactionType,
    category: CategoryType,
    amount: number,
    daysAgo: number,
    note: string
  ) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    sampleTransactions.push({
      id: uuidv4(),
      type,
      category,
      amount,
      date: dateStr(d),
      note,
      createdAt: d.getTime(),
    });
  };

  addTx('income', '工资', 15000, 28, '6月工资');
  addTx('expense', '餐饮', 58, 1, '外卖点餐');
  addTx('expense', '交通', 35, 2, '打车回家');
  addTx('expense', '购物', 399, 3, '京东购物');
  addTx('expense', '餐饮', 128, 4, '朋友聚餐');
  addTx('expense', '娱乐', 88, 5, '电影票');
  addTx('expense', '交通', 200, 6, '地铁充值');
  addTx('expense', '医疗', 156, 7, '感冒药');
  addTx('expense', '餐饮', 45, 8, '早餐');
  addTx('expense', '购物', 899, 10, '新衣服');
  addTx('income', '奖金', 3000, 15, '项目奖金');
  addTx('expense', '娱乐', 200, 12, '游戏充值');
  addTx('expense', '餐饮', 880, 20, '家庭聚餐');
  addTx('expense', '其他', 300, 22, '水电费');
  addTx('expense', '交通', 450, 25, '加油');
  addTx('expense', '餐饮', 72, 26, '午餐');
  addTx('expense', '购物', 256, 27, '日用品');

  return {
    transactions: sampleTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    budgets: DEFAULT_BUDGETS,
  };
};

export default function App() {
  const [view, setView] = useState<ViewType>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [transitionView, setTransitionView] = useState(true);

  useEffect(() => {
    const data = loadSampleData();
    setTransactions(data.transactions);
    setBudgets(data.budgets);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ transactions, budgets })
      );
    }
  }, [transactions, budgets, isLoaded]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    setTransactions((prev) =>
      [newTx, ...prev].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev
        .map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
    );
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const updateBudget = useCallback((category: CategoryType, limit: number) => {
    setBudgets((prev) => {
      const existing = prev.find((b) => b.category === category);
      if (existing) {
        return prev.map((b) =>
          b.category === category ? { ...b, limit } : b
        );
      }
      return [...prev, { category, limit }];
    });
  }, []);

  const handleViewChange = (newView: ViewType) => {
    if (newView !== view) {
      setTransitionView(false);
      setTimeout(() => {
        setView(newView);
        setTimeout(() => setTransitionView(true), 50);
      }, 200);
    }
  };

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: '#64748b' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: 24 }}>💰</span>
          <span>财务管理</span>
        </div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleViewChange('dashboard')}
          >
            <span style={{ fontSize: 18 }}>📊</span>
            <span>数据仪表盘</span>
          </div>
          <div
            className={`nav-item ${view === 'records' ? 'active' : ''}`}
            onClick={() => handleViewChange('records')}
          >
            <span style={{ fontSize: 18 }}>📝</span>
            <span>记录管理</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          Finance Tracker v1.0
        </div>
      </aside>

      <main className="main-content">
        {transitionView ? (
        <div
          key={view}
          style={{
            opacity: 1,
            transition: 'opacity 0.25s ease',
          }}
          className="fade-in"
        >
          {view === 'dashboard' ? (
            <Dashboard
              transactions={transactions}
              budgets={budgets}
            />
          ) : (
            <RecordManager
              transactions={transactions}
              budgets={budgets}
              onAdd={addTransaction}
              onUpdate={updateTransaction}
              onDelete={deleteTransaction}
              onUpdateBudget={updateBudget}
            />
          )}
        </div>
      ) : null}
      </main>
    </div>
  );
}
