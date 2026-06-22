import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Trash2, Check, X, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ExpenseService, CATEGORY_LIST, type Expense } from '../services/ExpenseService';

function renderCustomLabel(props: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  name: string;
  value: number;
  color: string;
  total: number;
}) {
  const { cx, cy, midAngle, outerRadius, name, value, color, total } = props;
  if (total <= 0) return null;
  const RADIAN = Math.PI / 180;
  const pct = ((value / total) * 100).toFixed(0);
  if (Number(pct) < 5) return null;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <line
        x1={cx + (outerRadius - 5) * Math.cos(-midAngle * RADIAN)}
        y1={cy + (outerRadius - 5) * Math.sin(-midAngle * RADIAN)}
        x2={cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN)}
        y2={cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN)}
        stroke={color}
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={y}
        fill={color}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="700"
      >
        {`${name} ${pct}%`}
      </text>
    </g>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const summary = useMemo(
    () => ExpenseService.getMonthlySummary(year, month),
    [year, month, refreshKey]
  );

  const chartData = useMemo(() => {
    return CATEGORY_LIST
      .filter((c) => summary.byCategory[c.name] > 0)
      .map((c) => ({
        name: c.name,
        value: summary.byCategory[c.name],
        icon: c.icon,
        color: c.color,
      }));
  }, [summary]);

  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);

  const refresh = () => setRefreshKey((k) => k + 1);

  const goPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
    setExpandedId(null);
    setEditingId(null);
  };

  const goNextMonth = () => {
    const cur = new Date(year, month - 1, 1);
    const nxt = new Date(cur);
    nxt.setMonth(nxt.getMonth() + 1);
    const today = new Date();
    if (nxt.getFullYear() > today.getFullYear() || (nxt.getFullYear() === today.getFullYear() && nxt.getMonth() > today.getMonth())) {
      return;
    }
    setYear(nxt.getFullYear());
    setMonth(nxt.getMonth() + 1);
    setExpandedId(null);
    setEditingId(null);
  };

  const handleCardClick = (e: React.MouseEvent, exp: Expense) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('textarea') || target.closest('input')) {
      return;
    }
    if (expandedId === exp.id) {
      setExpandedId(null);
      setEditingId(null);
    } else {
      setExpandedId(exp.id);
      setEditNote(exp.note);
      setEditingId(null);
    }
  };

  const startEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setEditNote(exp.note);
  };

  const cancelEdit = (exp: Expense) => {
    setEditingId(null);
    setEditNote(exp.note);
  };

  const saveEdit = (id: string) => {
    ExpenseService.updateExpense(id, { note: editNote });
    setEditingId(null);
    refresh();
  };

  const deleteExp = (id: string) => {
    if (window.confirm('确定删除这笔支出记录吗？')) {
      ExpenseService.deleteExpense(id);
      setExpandedId(null);
      setEditingId(null);
      refresh();
    }
  };

  const sortedExpenses = useMemo(() => {
    return [...summary.expenses].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }, [summary]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#2D2D2D' }}>月度看板</h2>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>查看月度支出总览与明细</p>
        </div>
        <button
          onClick={() => navigate('/add')}
          className="btn btn-primary flex items-center gap-2 text-sm no-print"
        >
          <Plus size={16} /> 记一笔
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2 fade-in">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6 no-print">
              <button
                onClick={goPrevMonth}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-orange-50"
                style={{ color: '#F5A623' }}
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: '#2D2D2D' }}>{year} 年 {month} 月</div>
                <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>共 {summary.expenses.length} 笔支出</div>
              </div>
              <button
                onClick={goNextMonth}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-orange-50"
                style={{ color: '#F5A623' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="text-center mb-6 print:block">
              <div className="text-xs mb-1" style={{ color: '#6B7280' }}>本月总支出</div>
              <div className="text-3xl font-bold" style={{ color: '#F5A623' }}>
                {ExpenseService.formatMoney(summary.total)}
              </div>
            </div>

            <div className="relative h-72 mb-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      label={(props) => renderCustomLabel({ ...props, total: chartTotal })}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => ExpenseService.formatMoney(val)}
                      contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center" style={{ color: '#9CA3AF' }}>
                  <div className="text-5xl mb-3">📭</div>
                  <div className="text-sm">本月暂无支出记录</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_LIST.map((c) => {
                const amt = summary.byCategory[c.name];
                const pct = summary.categoryPercentages[c.name];
                const active = amt > 0;
                return (
                  <div
                    key={c.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: active ? c.color + '12' : '#F9FAFB',
                      opacity: active ? 1 : 0.5,
                    }}
                  >
                    <span className="text-base">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: '#374151' }}>{c.name}</div>
                      <div className="text-xs font-semibold" style={{ color: c.color }}>
                        {active ? ExpenseService.formatMoney(amt) : '¥0.00'}
                      </div>
                    </div>
                    {active && <div className="text-[10px] font-bold" style={{ color: c.color }}>{pct.toFixed(0)}%</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
              <span>📋</span> 支出明细
              <span className="text-xs font-normal ml-auto px-2 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
                按日期降序
              </span>
            </h3>

            {sortedExpenses.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center" style={{ color: '#9CA3AF' }}>
                <div className="text-6xl mb-4">💰</div>
                <div className="text-base font-medium mb-1">本月还没有支出记录</div>
                <div className="text-sm">点击右上角「记一笔」开始记账吧</div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {sortedExpenses.map((exp) => {
                  const cat = ExpenseService.getCategoryInfo(exp.category);
                  const isExpanded = expandedId === exp.id;
                  const isEditing = editingId === exp.id;
                  return (
                    <div
                      key={exp.id}
                      className="rounded-xl transition-all duration-200 overflow-hidden cursor-pointer"
                      style={{
                        background: '#FFFFFF',
                        boxShadow: isExpanded ? `0 6px 16px ${cat.color}22` : '0 2px 8px rgba(0, 0, 0, 0.06)',
                        border: `1px solid ${isExpanded ? cat.color + '66' : '#F3F4F6'}`,
                        transform: isExpanded ? 'translateY(-1px)' : 'translateY(0)',
                      }}
                      onClick={(e) => handleCardClick(e, exp)}
                    >
                      <div className="flex items-center gap-3 p-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: cat.color + '20' }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: cat.color }}>{cat.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                              {exp.date.slice(5)}
                            </span>
                          </div>
                          {exp.note && !isExpanded && (
                            <div className="text-xs mt-1 truncate" style={{ color: '#6B7280' }}>{exp.note}</div>
                          )}
                          {!exp.note && !isExpanded && (
                            <div className="text-xs mt-1 italic" style={{ color: '#D1D5DB' }}>点击卡片编辑备注</div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-bold" style={{ color: '#2D2D2D' }}>
                            {ExpenseService.formatMoney(exp.amount)}
                          </div>
                        </div>
                        <div
                          className="shrink-0 transition-transform duration-300 ml-1"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', color: '#9CA3AF' }}
                        >
                          <ChevronRight size={18} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div
                          className="expand-animation"
                          style={{ borderTop: `1px dashed ${cat.color}55` }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-4 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-xs mb-1" style={{ color: '#6B7280' }}>日期</div>
                                <div className="font-medium" style={{ color: '#2D2D2D' }}>{ExpenseService.formatDateDisplay(exp.date)}</div>
                              </div>
                              <div>
                                <div className="text-xs mb-1" style={{ color: '#6B7280' }}>类别</div>
                                <div className="font-medium flex items-center gap-1" style={{ color: cat.color }}>
                                  {cat.icon} {cat.name}
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="text-xs mb-2 flex items-center justify-between" style={{ color: '#6B7280' }}>
                                <span className="font-medium">备注信息</span>
                                {!isEditing && (
                                  <button
                                    onClick={() => startEdit(exp)}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all"
                                    style={{ background: cat.color + '18', color: cat.color }}
                                  >
                                    <Edit2 size={12} /> 编辑备注
                                  </button>
                                )}
                              </div>
                              {isEditing ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    rows={3}
                                    autoFocus
                                    placeholder="添加或修改这笔支出的备注信息..."
                                    className="w-full px-4 py-3 rounded-xl border-2 transition-all outline-none text-sm"
                                    style={{
                                      background: '#FFFCF7',
                                      borderColor: cat.color + '66',
                                    }}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => cancelEdit(exp)}
                                      className="flex items-center gap-1 text-xs px-4 py-2 rounded-lg transition-all"
                                      style={{ background: '#F3F4F6', color: '#374151' }}
                                    >
                                      <X size={12} /> 取消
                                    </button>
                                    <button
                                      onClick={() => saveEdit(exp.id)}
                                      className="flex items-center gap-1 text-xs px-4 py-2 rounded-lg text-white transition-all"
                                      style={{ background: cat.color }}
                                    >
                                      <Check size={12} /> 保存备注
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="p-4 rounded-xl text-sm"
                                  style={{ background: cat.color + '12', color: '#374151', minHeight: 56 }}
                                >
                                  {exp.note ? (
                                    <span>{exp.note}</span>
                                  ) : (
                                    <span className="italic" style={{ color: '#9CA3AF' }}>
                                      暂无备注，点击右上角「编辑备注」添加说明
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end pt-1 no-print">
                              <button
                                onClick={() => deleteExp(exp.id)}
                                className="flex items-center gap-1 text-xs px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                              >
                                <Trash2 size={12} /> 删除此记录
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
