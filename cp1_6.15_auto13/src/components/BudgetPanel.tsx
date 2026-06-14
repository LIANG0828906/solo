import { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, Plus, Pencil, Trash2, Receipt } from 'lucide-react';
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
    fetchRooms,
  } = useStore();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [deletingItems, setDeletingItems] = useState<Map<string, DeletingItem>>(new Map());
  const [toast, setToast] = useState<{ show: boolean; message: string; onUndo?: () => void }>({
    show: false,
    message: '',
  });

  const currentRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  const totalBudget = currentRoom?.totalBudget ?? 0;
  const totalSpent = currentRoom?.spent ?? budget.reduce((sum, cat) => sum + cat.spent, 0);

  const overBudget = totalSpent > totalBudget;

  const ringData = useMemo(() => {
    const remaining = Math.max(0, totalBudget - totalSpent);
    return [
      { name: '已花费', value: totalSpent },
      { name: '剩余', value: remaining },
    ];
  }, [totalBudget, totalSpent]);

  const ringColor = overBudget ? '#FF8C00' : '#7CB342';
  const ringColors = [ringColor, '#E8D5B8'];

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
    setFormData({ ...initialForm, date: new Date().toISOString().split('T')[0] });
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
    await fetchRooms();
    closeModal();
  };

  const handleDelete = (item: BudgetItem) => {
    if (!selectedRoomId) return;

    setDeletingItems((prev) => {
      const next = new Map(prev);
      if (!next.has(item.id)) {
        const timeoutId = setTimeout(async () => {
          await deleteBudgetItem(selectedRoomId, item.id);
          await fetchRooms();
          setDeletingItems((p) => {
            const np = new Map(p);
            np.delete(item.id);
            return np;
          });
        }, 400);
        next.set(item.id, { id: item.id, categoryId: item.categoryId, timeoutId });
      }
      return next;
    });

    setToast({
      show: true,
      message: '支出记录已删除',
      onUndo: () => {
        const del = deletingItems.get(item.id);
        if (del?.timeoutId) {
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

  useEffect(() => {
    if (budget.length > 0) {
      const firstId = budget[0].id;
      setExpandedCategories((prev) => {
        const next = new Set(prev);
        next.add(firstId);
        return next;
      });
    }
  }, [budget.length > 0 ? budget[0].id : '']);

  const categoryNames = ['装修人工', '材料', '家具', '软装'];

  const getCategoryByName = (name: string): BudgetCategory | undefined => {
    return budget.find((c) => c.name === name);
  };

  const renderBarChart = (category: BudgetCategory | undefined) => {
    if (!category) return null;
    const exceeded = category.spent > category.allocated;
    const spentColor = exceeded ? '#FF8C00' : '#7CB342';
    const percentage = category.allocated > 0 ? Math.round((category.spent / category.allocated) * 100) : 0;

    const data = [
      { name: '预算', value: category.allocated, fill: '#D4B896' },
      { name: '已花费', value: category.spent, fill: spentColor },
    ];

    return (
      <div
        className="transition-all duration-300"
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(139, 105, 20, 0.06)',
          border: '1px solid #F0E4D0',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 105, 20, 0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 105, 20, 0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div className="serif text-base font-semibold mb-2" style={{ color: '#5A4524' }}>
          {category.name}
        </div>
        <div style={{ width: '100%', height: '70px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={12} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <ReTooltip
                formatter={(value: number) => `¥${value.toFixed(0)}`}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #D4B896',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs mt-2" style={{ color: exceeded ? '#FF8C00' : '#7CB342' }}>
          {percentage}% · ¥{Math.round(category.spent).toLocaleString()} / ¥{Math.round(category.allocated).toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div
        className="transition-all duration-300"
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(139, 105, 20, 0.08)',
          border: '1px solid #F0E4D0',
        }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <div className="relative" style={{ width: '220px', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ringData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1000}
                  animationBegin={0}
                >
                  {ringData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ringColors[index]} />
                  ))}
                </Pie>
                <ReTooltip
                  formatter={(value: number) => `¥${value.toFixed(0)}`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #D4B896',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ top: '-6px' }}
            >
              <div className="serif text-3xl font-bold" style={{ color: overBudget ? '#FF8C00' : '#7CB342' }}>
                ¥{Math.round(totalSpent).toLocaleString()}
              </div>
              <div className="text-xs mt-1" style={{ color: '#8B7355' }}>
                总预算 ¥{Math.round(totalBudget).toLocaleString()}
              </div>
              <div
                className="text-xs mt-1 font-medium"
                style={{ color: overBudget ? '#FF8C00' : '#7CB342' }}
              >
                {overBudget ? '⚠ 已超支' : `${Math.round((totalSpent / totalBudget) * 100)}% 已用`}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="serif text-xl font-semibold mb-4" style={{ color: '#5A4524' }}>
              预算分类概览
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoryNames.map((name) => (
                <div key={name}>{renderBarChart(getCategoryByName(name))}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="serif text-xl font-semibold" style={{ color: '#5A4524' }}>
          支出明细
        </div>
        {budget.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const percentage = category.allocated > 0 ? Math.round((category.spent / category.allocated) * 100) : 0;
          const exceeded = category.spent > category.allocated;

          return (
            <div
              key={category.id}
              className="transition-all duration-300 overflow-hidden"
              style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(139, 105, 20, 0.08)',
                border: '1px solid #F0E4D0',
              }}
            >
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-5 transition-all duration-300"
                style={{ textAlign: 'left', background: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FAF6F0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="transition-transform duration-300"
                    style={{
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      color: '#8B6914',
                    }}
                  >
                    <ChevronDown size={20} />
                  </div>
                  <div>
                    <div className="serif text-lg font-semibold" style={{ color: '#5A4524' }}>
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
                        ¥{Math.round(category.spent).toLocaleString()}
                      </span>
                      <span style={{ color: '#8B7355' }}> / ¥{Math.round(category.allocated).toLocaleString()}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: exceeded ? '#FF8C00' : '#7CB342' }}>
                      {percentage}%
                    </div>
                  </div>
                  <div style={{ width: '100px', height: '8px', background: '#F5EDE0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(percentage, 100)}%`,
                        background: exceeded
                          ? 'linear-gradient(90deg, #FF8C00, #E65100)'
                          : 'linear-gradient(90deg, #8BC34A, #7CB342)',
                        borderRadius: '999px',
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                </div>
              </button>

              <div
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  maxHeight: isExpanded ? '2000px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="px-5 pb-5 border-t" style={{ borderColor: '#F0E4D0' }}>
                  <div className="flex items-center justify-between py-3">
                    <div className="text-xs" style={{ color: '#8B7355' }}>
                      共 {category.items.length} 条支出记录
                    </div>
                    <button
                      onClick={() => openAddModal(category.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm btn-wood"
                      style={{ borderRadius: '8px' }}
                    >
                      <Plus size={16} />
                      新增支出
                    </button>
                  </div>

                  {category.items.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <Receipt size={40} style={{ color: '#D4B896' }} />
                      <span className="text-sm" style={{ color: '#8B7355' }}>
                        暂无支出记录，点击右上角添加
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
                            style={{
                              backgroundColor: '#FAF6F0',
                              border: '1px solid #F0E4D0',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F5EDE0';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FAF6F0';
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ background: 'white', border: '1px solid #F0E4D0' }}
                              >
                                <Receipt size={18} style={{ color: '#8B6914' }} />
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: '#3D2F1F' }}>
                                  {item.note || '支出记录'}
                                </div>
                                <div className="text-xs mt-0.5" style={{ color: '#9C8B70' }}>
                                  {item.date}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="serif font-semibold text-base" style={{ color: '#8B6914' }}>
                                ¥{item.amount.toFixed(2)}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 hover:bg-white"
                                  style={{ color: '#8B6914' }}
                                  title="编辑"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 hover:bg-white"
                                  style={{ color: '#FF8C00' }}
                                  title="删除"
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
          style={{ backgroundColor: 'rgba(90, 69, 36, 0.45)' }}
          onClick={closeModal}
        >
          <div
            className="bg-white w-full max-w-md p-6 animate-springIn"
            style={{ borderRadius: '12px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="serif text-lg font-semibold mb-5" style={{ color: '#5A4524' }}>
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
                    padding: '10px 14px',
                    color: '#3D2F1F',
                    fontSize: '14px',
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
                    padding: '10px 14px',
                    color: '#3D2F1F',
                    fontSize: '14px',
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
                    padding: '10px 14px',
                    color: '#3D2F1F',
                    fontSize: '14px',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#8B6914')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#D4B896')}
                  placeholder="例如：瓷砖费用、人工费等"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="btn-outline px-5 py-2.5 rounded-lg text-sm font-medium"
                style={{ borderRadius: '8px' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="btn-wood px-5 py-2.5 rounded-lg text-sm font-medium"
                style={{ borderRadius: '8px' }}
              >
                {editingItem ? '保存修改' : '确认添加'}
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
