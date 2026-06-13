export type Category = '食品' | '交通' | '娱乐' | '医疗' | '教育' | '其他';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  date: string;
  note: string;
  createdAt: number;
}

export interface CategoryInfo {
  name: Category;
  icon: string;
  color: string;
}

export interface MonthlySummary {
  year: number;
  month: number;
  total: number;
  byCategory: Record<Category, number>;
  byDate: Record<string, number>;
  expenses: Expense[];
  dailyAvg: number;
  highestDate: { date: string; amount: number };
  categoryPercentages: Record<Category, number>;
}

export const CATEGORY_LIST: CategoryInfo[] = [
  { name: '食品', icon: '🍔', color: '#E74C3C' },
  { name: '交通', icon: '🚗', color: '#3498DB' },
  { name: '娱乐', icon: '🎮', color: '#9B59B6' },
  { name: '医疗', icon: '💊', color: '#2ECC71' },
  { name: '教育', icon: '📚', color: '#F39C12' },
  { name: '其他', icon: '📦', color: '#95A5A6' },
];

const STORAGE_KEY = 'family_expense_data';
const INIT_FLAG_KEY = 'family_expense_initialized';

const generateId = (): string => {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

const getCategoryInfo = (category: Category): CategoryInfo => {
  return CATEGORY_LIST.find((c) => c.name === category) || CATEGORY_LIST[5];
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

const padZero = (n: number): string => n.toString().padStart(2, '0');

const getSampleData = (): Expense[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const d = (day: number) => `${year}-${padZero(month + 1)}-${padZero(day)}`;

  return [
    {
      id: generateId(),
      amount: 128.5,
      category: '食品',
      date: d(Math.max(1, now.getDate() - 5)),
      note: '全家周末外出吃火锅',
      createdAt: Date.now() - 5 * 86400000,
    },
    {
      id: generateId(),
      amount: 45,
      category: '交通',
      date: d(Math.max(1, now.getDate() - 3)),
      note: '打车去机场接人',
      createdAt: Date.now() - 3 * 86400000,
    },
    {
      id: generateId(),
      amount: 299,
      category: '娱乐',
      date: d(Math.max(1, now.getDate() - 1)),
      note: '购买游戏和电影票',
      createdAt: Date.now() - 1 * 86400000,
    },
  ];
};

const getAllExpenses = (): Expense[] => {
  console.time('ExpenseService: 读取全部数据');
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    console.timeEnd('ExpenseService: 读取全部数据');
    return [];
  }
  try {
    const result = JSON.parse(raw) as Expense[];
    console.timeEnd('ExpenseService: 读取全部数据');
    return result;
  } catch {
    console.timeEnd('ExpenseService: 读取全部数据');
    return [];
  }
};

const saveAllExpenses = (list: Expense[]): void => {
  console.time('ExpenseService: 写入全部数据');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  console.timeEnd('ExpenseService: 写入全部数据');
};

const initializeIfNeeded = (): void => {
  console.time('ExpenseService: 初始化数据读取');
  const existing = getAllExpenses();
  console.timeEnd('ExpenseService: 初始化数据读取');

  if (existing.length === 0) {
    console.time('ExpenseService: 示例数据写入');
    saveAllExpenses(getSampleData());
    console.timeEnd('ExpenseService: 示例数据写入');
    console.log('[ExpenseService] 首次使用，已自动填充3条示例数据');
  }

  localStorage.setItem(INIT_FLAG_KEY, '1');
};

initializeIfNeeded();

export const ExpenseService = {
  CATEGORY_LIST,

  getCategoryInfo,

  addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const list = getAllExpenses();
    const expense: Expense = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    list.push(expense);
    saveAllExpenses(list);
    return expense;
  },

  updateExpense(id: string, patch: Partial<Pick<Expense, 'amount' | 'category' | 'date' | 'note'>>): Expense | null {
    const list = getAllExpenses();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    saveAllExpenses(list);
    return list[idx];
  },

  deleteExpense(id: string): boolean {
    const list = getAllExpenses();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    saveAllExpenses(list);
    return true;
  },

  getExpenseById(id: string): Expense | null {
    return getAllExpenses().find((e) => e.id === id) || null;
  },

  getAll(): Expense[] {
    return getAllExpenses().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  },

  getByMonth(year: number, month: number): Expense[] {
    const prefix = `${year}-${padZero(month)}`;
    return this.getAll().filter((e) => e.date.startsWith(prefix));
  },

  getMonthlySummary(year: number, month: number): MonthlySummary {
    console.time('ExpenseService: 月度汇总计算');
    const expenses = this.getByMonth(year, month);

    const byCategory: Record<Category, number> = {
      食品: 0, 交通: 0, 娱乐: 0, 医疗: 0, 教育: 0, 其他: 0,
    };
    const byDate: Record<string, number> = {};

    let total = 0;
    for (const exp of expenses) {
      total += exp.amount;
      byCategory[exp.category] += exp.amount;
      byDate[exp.date] = (byDate[exp.date] || 0) + exp.amount;
    }

    let highestDate = { date: '-', amount: 0 };
    for (const [d, amt] of Object.entries(byDate)) {
      if (amt > highestDate.amount) {
        highestDate = { date: d, amount: amt };
      }
    }

    const daysInMonth = getDaysInMonth(year, month);
    const dailyAvg = daysInMonth > 0 ? total / daysInMonth : 0;

    const categoryPercentages: Record<Category, number> = {
      食品: 0, 交通: 0, 娱乐: 0, 医疗: 0, 教育: 0, 其他: 0,
    };
    if (total > 0) {
      for (const cat of Object.keys(categoryPercentages) as Category[]) {
        categoryPercentages[cat] = (byCategory[cat] / total) * 100;
      }
    }

    const result = {
      year,
      month,
      total,
      byCategory,
      byDate,
      expenses,
      dailyAvg,
      highestDate,
      categoryPercentages,
    };
    console.timeEnd('ExpenseService: 月度汇总计算');
    return result;
  },

  getAvailableMonths(): { year: number; month: number }[] {
    const all = getAllExpenses();
    const set = new Set<string>();
    for (const exp of all) {
      set.add(exp.date.slice(0, 7));
    }
    const now = new Date();
    set.add(`${now.getFullYear()}-${padZero(now.getMonth() + 1)}`);
    const result: { year: number; month: number }[] = [];
    for (const key of set) {
      const [y, m] = key.split('-').map(Number);
      result.push({ year: y, month: m });
    }
    return result.sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month));
  },

  formatMoney(amount: number): string {
    return `¥${amount.toFixed(2)}`;
  },

  formatDateDisplay(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${y}年${Number(m)}月${Number(d)}日`;
  },
};
