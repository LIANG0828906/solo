import { useEffect, useState } from 'react';
import type { JournalEntry, Expense } from '../data/TripDataManager';
import { TripDataManager } from '../data/TripDataManager';
import { PhotoManager, type Photo } from '../data/PhotoManager';

interface JournalPanelProps {
  selectedDate: string;
}

const EXPENSE_CATEGORIES: { key: Expense['category']; label: string; icon: string }[] = [
  { key: 'transport', label: '交通', icon: '🚗' },
  { key: 'food', label: '餐饮', icon: '🍽️' },
  { key: 'ticket', label: '门票', icon: '🎫' },
  { key: 'accommodation', label: '住宿', icon: '🏨' },
];

export function JournalPanel({ selectedDate }: JournalPanelProps) {
  const [allEntries, setAllEntries] = useState<JournalEntry[]>(() =>
    TripDataManager.getJournalEntries()
  );
  const [allExpenses, setAllExpenses] = useState<Expense[]>(() =>
    TripDataManager.getExpenses()
  );
  const [photos, setPhotos] = useState<Photo[]>(() => PhotoManager.getAllPhotos());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set([selectedDate]));
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);

  const [entryForm, setEntryForm] = useState({
    content: '',
    tags: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'food' as Expense['category'],
    amount: 0,
    description: '',
  });

  useEffect(() => {
    const unsub1 = TripDataManager.subscribe(() => {
      setAllEntries(TripDataManager.getJournalEntries());
      setAllExpenses(TripDataManager.getExpenses());
    });
    const unsub2 = PhotoManager.subscribe(() => {
      setPhotos(PhotoManager.getAllPhotos());
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  useEffect(() => {
    setExpandedDates((prev) => new Set(prev).add(selectedDate));
  }, [selectedDate]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleAddEntry = () => {
    if (!entryForm.content.trim()) return;
    TripDataManager.addJournalEntry({
      date: selectedDate,
      content: entryForm.content,
      tags: entryForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setEntryForm({ content: '', tags: '' });
    setShowEntryForm(false);
  };

  const handleAddExpense = () => {
    if (expenseForm.amount <= 0) return;
    TripDataManager.addExpense({
      date: selectedDate,
      category: expenseForm.category,
      amount: expenseForm.amount,
      description: expenseForm.description,
    });
    setExpenseForm({ category: 'food', amount: 0, description: '' });
    setShowExpenseForm(false);
  };

  const handleAddPhoto = (entryId: string) => {
    const photo = PhotoManager.addPhoto(selectedDate);
    TripDataManager.addPhotoToJournal(entryId, photo.id);
  };

  const getPhotosByIds = (ids: string[]) =>
    ids.map((id) => photos.find((p) => p.id === id)).filter((p): p is Photo => p !== undefined);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
  };

  const entriesByDate = allEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  const expensesByDate = allExpenses.reduce((acc, expense) => {
    if (!acc[expense.date]) acc[expense.date] = [];
    acc[expense.date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const allDates = Array.from(
    new Set([...Object.keys(entriesByDate), ...Object.keys(expensesByDate), selectedDate])
  ).sort((a, b) => b.localeCompare(a));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>旅行日志</h3>
          <p style={styles.currentDate}>{formatDate(selectedDate)}</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => setShowEntryForm(true)} style={styles.addBtn}>
            + 日志
          </button>
          <button onClick={() => setShowExpenseForm(true)} style={styles.addBtn}>
            + 花费
          </button>
        </div>
      </div>

      {showEntryForm && (
        <div style={styles.formOverlay} onClick={() => setShowEntryForm(false)}>
          <div style={styles.form} onClick={(e) => e.stopPropagation()}>
            <h4 style={styles.formTitle}>添加日志</h4>
            <textarea
              placeholder="记录今天的旅行故事..."
              value={entryForm.content}
              onChange={(e) => setEntryForm({ ...entryForm, content: e.target.value })}
              style={{ ...styles.input, height: 100, resize: 'none' }}
            />
            <input
              type="text"
              placeholder="标签（用逗号分隔）"
              value={entryForm.tags}
              onChange={(e) => setEntryForm({ ...entryForm, tags: e.target.value })}
              style={styles.input}
            />
            <div style={styles.formActions}>
              <button onClick={handleAddEntry} style={styles.primaryBtn}>
                添加
              </button>
              <button onClick={() => setShowEntryForm(false)} style={styles.secondaryBtn}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showExpenseForm && (
        <div style={styles.formOverlay} onClick={() => setShowExpenseForm(false)}>
          <div style={styles.form} onClick={(e) => e.stopPropagation()}>
            <h4 style={styles.formTitle}>添加花费</h4>
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as Expense['category'] })}
              style={styles.input}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="金额（元）"
              value={expenseForm.amount || ''}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="描述（可选）"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              style={styles.input}
            />
            <div style={styles.formActions}>
              <button onClick={handleAddExpense} style={styles.primaryBtn}>
                添加
              </button>
              <button onClick={() => setShowExpenseForm(false)} style={styles.secondaryBtn}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {previewPhoto && (
        <div style={styles.previewOverlay} onClick={() => setPreviewPhoto(null)}>
          <div
            style={{
              ...styles.previewPhoto,
              backgroundColor: previewPhoto.color,
            }}
          />
        </div>
      )}

      <div style={styles.content}>
        {allDates.map((date) => (
          <div key={date} style={styles.dateSection}>
            <div
              onClick={() => toggleDate(date)}
              style={{
                ...styles.dateHeader,
                borderLeft: date === selectedDate ? '3px solid #3B82F6' : '3px solid transparent',
              }}
            >
              <span style={styles.dateTitle}>{formatDate(date)}</span>
              <span style={styles.arrow}>{expandedDates.has(date) ? '▼' : '▶'}</span>
            </div>

            {expandedDates.has(date) && (
              <div style={styles.dateContent}>
                {(entriesByDate[date] || []).map((entry) => (
                  <div key={entry.id} style={styles.entryCard}>
                    <p style={styles.entryContent}>{entry.content}</p>
                    {entry.tags.length > 0 && (
                      <div style={styles.tags}>
                        {entry.tags.map((tag) => (
                          <span key={tag} style={styles.tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {getPhotosByIds(entry.photoIds).length > 0 && (
                      <div style={styles.photos}>
                        {getPhotosByIds(entry.photoIds).map((photo) => (
                          <div
                            key={photo.id}
                            onClick={() => setPreviewPhoto(photo)}
                            style={{
                              ...styles.photoThumb,
                              backgroundColor: photo.color,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => handleAddPhoto(entry.id)}
                      style={styles.addPhotoBtn}
                    >
                      + 添加照片
                    </button>
                  </div>
                ))}

                {(expensesByDate[date] || []).length > 0 && (
                  <div style={styles.expensesCard}>
                    <div style={styles.expensesHeader}>
                      <span style={styles.expensesTitle}>今日花费</span>
                      <span style={styles.expensesTotal}>
                        ¥
                        {(expensesByDate[date] || []).reduce((s, e) => s + e.amount, 0)}
                      </span>
                    </div>
                    {(expensesByDate[date] || []).map((expense) => {
                      const cat = EXPENSE_CATEGORIES.find((c) => c.key === expense.category);
                      return (
                        <div key={expense.id} style={styles.expenseItem}>
                          <span style={styles.expenseIcon}>{cat?.icon}</span>
                          <span style={styles.expenseDesc}>
                            {expense.description || cat?.label}
                          </span>
                          <span style={styles.expenseAmount}>¥{expense.amount}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    height: '100%',
  },
  header: {
    padding: '16px 20px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1E3A5F',
  },
  currentDate: {
    margin: 0,
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  headerActions: {
    display: 'flex',
    gap: 8,
  },
  addBtn: {
    padding: '8px 14px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    color: 'white',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  dateSection: {},
  dateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: 6,
    transition: 'all 0.3s ease',
  },
  dateTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1E3A5F',
  },
  arrow: {
    fontSize: 10,
    color: '#6B7280',
  },
  dateContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '8px 12px 0',
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 12,
    transition: 'all 0.3s ease',
  },
  entryContent: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
    color: '#374151',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    fontSize: 12,
    color: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    padding: '3px 8px',
    borderRadius: 10,
  },
  photos: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },
  addPhotoBtn: {
    marginTop: 10,
    padding: '6px 12px',
    border: '1px dashed #8B5CF6',
    borderRadius: 6,
    backgroundColor: '#F5F3FF',
    color: '#8B5CF6',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  expensesCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 12,
    transition: 'all 0.3s ease',
  },
  expensesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: '1px solid #F3F4F6',
  },
  expensesTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  expensesTotal: {
    fontSize: 14,
    fontWeight: 700,
    color: '#F59E0B',
  },
  expenseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
  },
  expenseIcon: {
    fontSize: 16,
  },
  expenseDesc: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  formOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    transition: 'opacity 0.3s ease',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
  },
  formTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1E3A5F',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
  },
  formActions: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1,
    padding: '10px 12px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    color: 'white',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  secondaryBtn: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    backgroundColor: 'white',
    color: '#6B7280',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    cursor: 'pointer',
    transition: 'opacity 0.3s ease',
  },
  previewPhoto: {
    width: 360,
    height: 360,
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    transition: 'transform 0.3s ease',
  },
};
