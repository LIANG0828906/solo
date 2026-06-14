import { useState, useMemo, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import useStore from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { BudgetItem, BudgetCategory } from '@/store/useStore';
import Toast from './Toast';

interface FormState {
  date: string;
  amount: string;
  note: string;
}

const initialForm: FormState = {
  date: new Date().toISOString().split('T')[0],
  amount: '',
  note: '',
};

interface DeletingItem {
  id: string;
  categoryId: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

export default function BudgetPanel() {
  const {
    budget,
    selectedRoomId,
    rooms,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
  } = useStore();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [deletingItems, setDeletingItems] = useState<Map<string, DeletingItem>>(new Map());
  const [toast, setToast] = useState<{ show: boolean; message: string; onUndo?: () => void }>({ show: false, message: '' });

  const currentRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  const totalBudget = currentRoom?.totalBudget ?? 0;
  const totalSpent = useMemo(() => {
    return budget.reduce((sum, cat) => sum + cat.spent, 0);
  }, [budget]);

  const ringData = useMemo(() => {
    const remaining = Math.max(0, totalBudget - totalSpent);
    return [
      { name: '已花费', value: totalSpent },
      { name: '剩余', value: remaining },
    ];
  }, [totalBudget, totalSpent]);

  const ringColors = useMemo(() => {
    const spentColor = totalSpent > totalBudget ? '#FF8C00' : '#7CB342';
    return [spentColor, '#E8D5B8'];
  }, [totalSpent, totalBudget]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const openAddModal = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setEditingItem(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (item: BudgetItem) => {
    setActiveCategoryId(item.categoryId);
    setEditingItem(item);
    setFormData({
      date: item.date,
      amount: String(item.amount),
      note: item.note,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setActiveCategoryId(null);
  };

  const handleSave = async () => {
    if (!selectedRoomId || !activeCategoryId) return;
    if (!formData.amount || !formData.date) return;

    if (editingItem) {
      await updateBudgetItem(selectedRoomId, editingItem.id, {
        amount: Number(formData.amount),
        date: formData.date,
        note: formData.note,
      });
    } else {
      await addBudgetItem(selectedRoomId, {
        categoryId: activeCategoryId,
        amount: Number(formData.amount),
        date: formData.date,
        note: formData.note,
        receipt: '',
      });
    }
    closeModal();
  };

  const handleDelete = (item: BudgetItem) => {
    if (!selectedRoomId) return;

    setDeletingItems((prev) => {
      const next = new Map(prev);
      if (!next.has(item.id)) {
        const timeoutId = setTimeout(() => {
          deleteBudgetItem(selectedRoomId, item.id);
          setDeletingItems((p) => {
            const np = new Map(p);
            np.delete(item.id);
            return np;
          });
        }, 300);
        next.set(item.id, { id: item.id, categoryId: item.categoryId, timeoutId });
      }
      return next;
    });

    setToast({
      show: true,
      message: '支出记录已删除',
      onUndo: () => {
        const del = deletingItems.get(item.id) || {
          id: item.id,
          categoryId: item.categoryId,
          timeoutId: undefined as unknown as ReturnType<typeof setTimeout>,
        };
        if (del.timeoutId) {
          clearTimeout(del.timeoutId);
        }
        setDeletingItems((p) => {
          const np = new Map(p);
          np.delete(item.id);
          return np;
        });
      },
    });
  };

  const categoryNames = ['装修人工', '材料', '家具', '软装'];

  const getCategoryByName = (name: string): BudgetCategory | undefined => {
    return budget.find((c) => c.name === name);
  };

  const renderBarChart = (category: BudgetCategory | undefined) => {
    if (!category) return null;
    const spentColor = category.spent > category.allocated ? '#FF8C00' : '#7CB342';
    const data = [
      { name: '预算', value: category.allocated, fill: '#8B6914' },
      { name: '已花费', value: category.spent, fill: spentColor },
    ];
    const percentage = category.allocated > 0 ? Math.round((category.spent / category.allocated) * 100) : 0;

    return (
      <div
        className="bg-white rounded-card card-shadow p-4 flex flex-col items-center transition-all duration-300 hover:card-shadow-hover"
        style={{ width: 280, height: 160, borderRadius: '12px' }}
      >
        <div className="text-sm font-medium mb-1" style={{ color: '#5A4524' }}>
          {category.name}
        </div>
        <ResponsiveContainer width="100%" height="75%">
          <BarChart data={data} layout="vertical" barSize={14}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <ReTooltip
              formatter={(value: number) => `¥${value.toFixed(2)}`}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #D4B896',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs mt-1" style={{ color: percentage > 100 ? '#FF8C00' : '#7CB342' }}>
          {percentage}% · 已花费 ¥{category.spent.toFixed(2)} / 预算 ¥{category.allocated.toFixed(2)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div
        className="bg-white rounded-card card-shadow p-6 transition-all duration-300"
        style={{ borderRadius: '12px', padding: '24px' }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <div className="relative" style={{ width: 260, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ringData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {ringData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ringColors[index]} />
                  ))}
                </Pie>
                <ReTooltip
                  formatter={(value: number) => `¥${value.toFixed(2)}`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #D4B896',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span style={{ color: '#5A4524', fontSize: '12px' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ top: '-10px' }}
            >
              <div
                className="font-serif text-2xl font-semibold"
                style={{ color: '#8B6914' }}
              >
                ¥{totalSpent.toFixed(0)}
              </div>
              <div className="text-xs mt-1" style={{ color: '#8B7355' }}>
                总预算 ¥{totalBudget.toFixed(0)} / 已花费
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryNames.map((name) => renderBarChart(getCategoryByName(name)))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {budget.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const percentage = category.allocated > 0 ? Math.round((category.spent / category.allocated) * 100) : 0;
          const exceeded = category.spent > category.allocated;

          return (
            <div
              key={category.id}
              className="bg-white rounded-card card-shadow overflow-hidden transition-all duration-300"
              style={{ borderRadius: '12px' }}
            >
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-5 transition-all duration-300 hover:bg-wood-50"
                style={{ textAlign: 'left' }}
              >
                <div className="flex items-center gap-4">
                  <ChevronDown
                    size={20}
                    className="transition-transform duration-300"
                    style={{
                      color: '#8B6914',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                  <div>
                    <div className="font-serif text-lg font-semibold" style={{ color: '#5A4524' }}>
                      {category.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#8B7355' }}>
                      {category.items.length} 条记录
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm" style={{ color: '#5A4524' }}>
                      <span className="font-semibold" style={{ color: exceeded ? '#FF8C00' : '#7CB342' }}>
                        ¥{category.spent.toFixed(2)}
                      </span>
                      <span style={{ color: '#8B7355' }}> / ¥{category.allocated.toFixed(2)}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: exceeded ? '#FF8C00' : '#7CB342' }}>
                      {percentage}%
                    </div>
                  </div>
                  <div className="w-24 h-2 progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: exceeded ? '#FF8C00' : '#7CB342',
                      }}
                    />
                  </div>
                </div>
              </button>

              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: isExpanded ? '2000px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="px-5 pb-5 border-t border-wood-100">
                  <div className="flex items-center justify-between py-3">
                    <div className="text-xs" style={{ color: '#8B7355' }}>
                      点击左侧箭头可收起列表
                    </div>
                    <button
                      onClick={() => openAddModal(category.id)}
                      className="btn-wood flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm"
                      style={{ borderRadius: '8px' }}
                    >
                      <Plus size={16} />
                      新增支出
                    </button>
                  </div>

                  {category.items.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <span className="text-sm" style={{ color: '#8B7355' }}>
                        暂无支出记录
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {category.items.map((item) => {
                        const isDeleting = deletingItems.has(item.id);
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'flex items-center justify-between p-4 rounded-lg transition-all duration-300',
                              isDeleting && 'animate-slideOutLeft'
                            )}
                            style={{ backgroundColor: '#FAF6F0' }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-medium" style={{ color: '#8B6914' }}>
                                {item.date}
                              </div>
                              <div className="text-sm" style={{ color: '#3D2F1F' }}>
                                {item.note || '无备注'}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="font-semibold text-sm" style={{ color: '#5A4524' }}>
                                ¥{item.amount.toFixed(2)}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 hover:bg-white"
                                  style={{ color: '#8B6914' }}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 hover:bg-white"
                                  style={{ color: '#FF8C00' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl card-shadow w-full max-w-md p-6 animate-springIn"
            style={{ borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-5" style={{ color: '#5A4524' }}>
              {editingItem ? '编辑支出' : '新增支出'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#5A4524' }}>
                  日期
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg outline-none transition-all duration-300"
                  style={{
                    border: '1.5px solid #D4B896',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#3D2F1F',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#8B6914')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#D4B896')}
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#5A4524' }}>
                  金额 (¥)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-lg outline-none transition-all duration-300"
                  style={{
                    border: '1.5px solid #D4B896',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#3D2F1F',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#8B6914')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#D4B896')}
                  placeholder="请输入金额"
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#5A4524' }}>
                  备注
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full rounded-lg outline-none transition-all duration-300"
                  style={{
                    border: '1.5px solid #D4B896',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#3D2F1F',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#8B6914')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#D4B896')}
                  placeholder="例如：瓷砖、人工费等"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="btn-outline px-5 py-2 rounded-lg text-sm font-medium"
                style={{ borderRadius: '8px' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="btn-wood px-5 py-2 rounded-lg text-sm font-medium"
                style={{ borderRadius: '8px' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        onUndo={toast.onUndo}
        duration={4000}
        onClose={() => setToast({ show: false, message: '' })}
      />
    </div>
  );
}
