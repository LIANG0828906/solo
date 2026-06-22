import { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Plus, Pencil, Trash2, X, Check, ChevronRight } from 'lucide-react';
import {
  ExpenseRecord,
  Category,
  CATEGORY_CONFIG,
  CATEGORY_LIST,
  QUICK_AMOUNTS,
} from '@/types';
import { cn } from '@/lib/utils';

function RecordItem({
  record,
  expandedId,
  setExpandedId,
  onEdit,
  onDelete,
  editingId,
  setEditingId,
  onSaveEdit,
}: {
  record: ExpenseRecord;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onSaveEdit: (data: Partial<ExpenseRecord>) => void;
}) {
  const isExpanded = expandedId === record.id;
  const isEditing = editingId === record.id;
  const config = CATEGORY_CONFIG[record.category];
  const Icon = config.icon;

  const [editAmount, setEditAmount] = useState(String(record.amount));
  const [editNote, setEditNote] = useState(record.note);
  const [editCategory, setEditCategory] = useState<Category>(record.category);
  const [editDate, setEditDate] = useState(record.date);

  useEffect(() => {
    if (isEditing) {
      setEditAmount(String(record.amount));
      setEditNote(record.note);
      setEditCategory(record.category);
      setEditDate(record.date);
    }
  }, [isEditing, record]);

  const handleSave = () => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    onSaveEdit({
      amount,
      note: editNote,
      category: editCategory,
      date: editDate,
    });
  };

  return (
    <div
      className={cn(
        'glass-card overflow-hidden transition-all duration-300',
        isExpanded && !isEditing && 'ring-1 ring-white/15'
      )}
    >
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => {
          if (!isEditing) {
            setExpandedId(isExpanded ? null : record.id);
          }
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}25` }}
        >
          <Icon size={22} style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-lg" style={{ color: config.color }}>
              ¥{record.amount.toFixed(2)}
            </span>
            <span className="text-sm text-white/50 flex-shrink-0">
              {moment(record.date).format('MM-DD')}
            </span>
          </div>
          <p className="text-sm text-white/60 truncate mt-0.5">
            {record.note || config.name}
          </p>
        </div>
        <ChevronRight
          size={18}
          className={cn(
            'text-white/40 transition-transform duration-300 flex-shrink-0',
            isExpanded && 'rotate-90'
          )}
        />
      </div>

      {isExpanded && !isEditing && (
        <div className="expand-card border-t border-white/5 px-4 py-3 bg-white/[0.02]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/50">类别</span>
                <div className="font-medium mt-0.5" style={{ color: config.color }}>
                  {config.name}
                </div>
              </div>
              <div>
                <span className="text-white/50">日期</span>
                <div className="font-medium mt-0.5">
                  {moment(record.date).format('YYYY-MM-DD')}
                </div>
              </div>
            </div>
            {record.note && (
              <div>
                <span className="text-white/50 text-sm">备注</span>
                <div className="font-medium mt-0.5 text-sm">{record.note}</div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="glass-button flex items-center gap-1.5 text-sm !py-2"
              >
                <Pencil size={14} />
                编辑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('确定删除这条记录吗？')) onDelete();
                }}
                className="glass-button flex items-center gap-1.5 text-sm !py-2 bg-red-500/20 border-red-500/30 hover:bg-red-500/30"
              >
                <Trash2 size={14} className="text-red-400" />
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="expand-card border-t border-white/5 px-4 py-4 bg-white/[0.02] space-y-3">
          <div className="flex gap-2 flex-wrap">
            {CATEGORY_LIST.map((cat) => {
              const c = CATEGORY_CONFIG[cat];
              const CatIcon = c.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setEditCategory(cat)}
                  className={cn(
                    'category-btn',
                    editCategory === cat && 'active'
                  )}
                  style={{
                    borderColor: editCategory === cat ? c.color : 'transparent',
                    backgroundColor:
                      editCategory === cat ? `${c.color}20` : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <CatIcon size={18} style={{ color: c.color }} />
                  <span className="text-xs" style={{ color: c.color }}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
          <input
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="glass-input w-full"
            placeholder="金额"
          />
          <input
            type="text"
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            className="glass-input w-full"
            placeholder="备注 (可选)"
          />
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="glass-input w-full"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="glass-button flex items-center gap-1.5 flex-1 justify-center bg-green-500/20 border-green-500/30 hover:bg-green-500/30"
            >
              <Check size={16} className="text-green-400" />
              保存
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="glass-button flex items-center gap-1.5 flex-1 justify-center"
            >
              <X size={16} />
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecordsPage() {
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category>('food');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/records').catch(() => null);
      if (res && res.data && Array.isArray(res.data)) {
        setRecords(
          [...res.data].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      } else {
        const mockData: ExpenseRecord[] = [
          {
            id: '1',
            amount: 35,
            category: 'food',
            note: '午餐外卖',
            date: moment().format('YYYY-MM-DD'),
          },
          {
            id: '2',
            amount: 15,
            category: 'transport',
            note: '地铁',
            date: moment().format('YYYY-MM-DD'),
          },
          {
            id: '3',
            amount: 128,
            category: 'shopping',
            note: '日用品',
            date: moment().subtract(1, 'day').format('YYYY-MM-DD'),
          },
          {
            id: '4',
            amount: 60,
            category: 'entertainment',
            note: '电影票',
            date: moment().subtract(2, 'day').format('YYYY-MM-DD'),
          },
          {
            id: '5',
            amount: 20,
            category: 'other',
            note: '',
            date: moment().subtract(3, 'day').format('YYYY-MM-DD'),
          },
        ];
        setRecords(mockData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (val: number) => {
    if (selectedQuickAmount === val) {
      setSelectedQuickAmount(null);
      setAmount('');
    } else {
      setSelectedQuickAmount(val);
      setAmount(String(val));
    }
  };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    try {
      setSubmitting(true);
      const payload = {
        amount: amt,
        category: selectedCategory,
        note,
        date,
      };
      const res = await axios.post('/api/records', payload).catch(() => null);
      if (res && res.data) {
        setRecords((prev) =>
          [res.data, ...prev].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      } else {
        const newRecord: ExpenseRecord = {
          id: Date.now().toString(),
          ...payload,
          createdAt: new Date().toISOString(),
        };
        setRecords((prev) =>
          [newRecord, ...prev].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      }
      setAmount('');
      setNote('');
      setSelectedQuickAmount(null);
      setDate(moment().format('YYYY-MM-DD'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`/api/records/${id}`).catch(() => null);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setExpandedId(null);
  };

  const handleSaveEdit = async (id: string, data: Partial<ExpenseRecord>) => {
    try {
      const res = await axios
        .put(`/api/records/${id}`, data)
        .catch(() => null);
      if (res && res.data) {
        setRecords((prev) =>
          prev
            .map((r) => (r.id === id ? res.data : r))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );