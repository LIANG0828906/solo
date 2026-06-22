import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);

const defaultData = {
  users: [
    { id: 'user-1', name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang' },
    { id: 'user-2', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li' },
    { id: 'user-3', name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang' },
  ],
  transactions: [
    { id: 't1', userId: 'user-1', date: '2026-01-15', type: 'expense', category: '餐饮', amount: 35.5, note: '午餐' },
    { id: 't2', userId: 'user-1', date: '2026-01-16', type: 'income', category: '工资', amount: 10000, note: '1月工资' },
    { id: 't3', userId: 'user-1', date: '2026-01-17', type: 'expense', category: '交通', amount: 200, note: '地铁充值' },
    { id: 't4', userId: 'user-1', date: '2026-01-18', type: 'expense', category: '购物', amount: 599, note: '衣服' },
    { id: 't5', userId: 'user-1', date: '2026-01-20', type: 'expense', category: '娱乐', amount: 150, note: '电影' },
    { id: 't6', userId: 'user-1', date: '2026-02-05', type: 'expense', category: '餐饮', amount: 45, note: '晚餐' },
    { id: 't7', userId: 'user-1', date: '2026-02-10', type: 'income', category: '工资', amount: 10000, note: '2月工资' },
    { id: 't8', userId: 'user-1', date: '2026-02-15', type: 'expense', category: '购物', amount: 899, note: '电子产品' },
    { id: 't9', userId: 'user-1', date: '2026-03-01', type: 'expense', category: '交通', amount: 150, note: '打车' },
    { id: 't10', userId: 'user-1', date: '2026-03-10', type: 'income', category: '工资', amount: 10500, note: '3月工资' },
    { id: 't11', userId: 'user-1', date: '2026-04-10', type: 'income', category: '工资', amount: 10500, note: '4月工资' },
    { id: 't12', userId: 'user-1', date: '2026-04-15', type: 'expense', category: '餐饮', amount: 1200, note: '聚餐' },
    { id: 't13', userId: 'user-1', date: '2026-05-10', type: 'income', category: '工资', amount: 11000, note: '5月工资' },
    { id: 't14', userId: 'user-1', date: '2026-05-20', type: 'expense', category: '娱乐', amount: 500, note: 'KTV' },
    { id: 't15', userId: 'user-1', date: '2026-06-10', type: 'income', category: '工资', amount: 11000, note: '6月工资' },
    { id: 't16', userId: 'user-1', date: '2026-06-12', type: 'expense', category: '餐饮', amount: 80, note: '外卖' },
    { id: 't17', userId: 'user-1', date: '2026-06-13', type: 'expense', category: '购物', amount: 450, note: '日用品' },
    { id: 't18', userId: 'user-1', date: '2026-06-14', type: 'expense', category: '交通', amount: 80, note: '公交' },
    { id: 't19', userId: 'user-2', date: '2026-06-10', type: 'income', category: '工资', amount: 8000, note: '6月工资' },
    { id: 't20', userId: 'user-3', date: '2026-06-10', type: 'income', category: '工资', amount: 15000, note: '6月工资' },
  ],
  budgets: [
    { id: 'b1', userId: 'user-1', category: '餐饮', amount: 2000, month: '2026-06' },
    { id: 'b2', userId: 'user-1', category: '交通', amount: 500, month: '2026-06' },
    { id: 'b3', userId: 'user-1', category: '购物', amount: 1500, month: '2026-06' },
    { id: 'b4', userId: 'user-1', category: '娱乐', amount: 800, month: '2026-06' },
    { id: 'b5', userId: 'user-1', category: '住房', amount: 3000, month: '2026-06' },
    { id: 'b6', userId: 'user-1', category: '医疗', amount: 500, month: '2026-06' },
    { id: 'b7', userId: 'user-1', category: '教育', amount: 1000, month: '2026-06' },
    { id: 'b8', userId: 'user-1', category: '其他', amount: 500, month: '2026-06' },
  ],
};

const db = new Low(adapter, defaultData);
await db.read();
await db.write();

export const getUsers = () => db.data.users;

export const getTransactionsByUserId = (userId) => {
  return db.data.transactions.filter((t) => t.userId === userId);
};

export const createTransaction = (data) => {
  const transaction = { id: uuidv4(), ...data };
  db.data.transactions.push(transaction);
  db.write();
  return transaction;
};

export const updateTransaction = (id, data) => {
  const index = db.data.transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    db.data.transactions[index] = { ...db.data.transactions[index], ...data };
    db.write();
    return db.data.transactions[index];
  }
  return null;
};

export const deleteTransaction = (id) => {
  const index = db.data.transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    const deleted = db.data.transactions.splice(index, 1);
    db.write();
    return deleted[0];
  }
  return null;
};

export const getBudgetsByUserId = (userId) => {
  return db.data.budgets.filter((b) => b.userId === userId);
};

export const updateBudget = (id, data) => {
  const index = db.data.budgets.findIndex((b) => b.id === id);
  if (index !== -1) {
    db.data.budgets[index] = { ...db.data.budgets[index], ...data };
    db.write();
    return db.data.budgets[index];
  }
  return null;
};

export const createBudget = (data) => {
  const budget = { id: uuidv4(), ...data };
  db.data.budgets.push(budget);
  db.write();
  return budget;
};

export const calculateBalance = (userId) => {
  const transactions = getTransactionsByUserId(userId);
  return transactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);
};

export const calculateMonthlySummary = (userId, year, month) => {
  const transactions = getTransactionsByUserId(userId);
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthTransactions = transactions.filter((t) => t.date.startsWith(prefix));

  const income = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense };
};

export default db;
