import React, { useEffect, useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getMedical, createMedical, updateMedical, deleteMedical } from '../../api';
import type { Medical, MedicalType } from '../../types';

interface MedicalCalendarProps {
  petId: string;
}

const typeColors: Record<MedicalType, string> = {
  vaccine: '#60a5fa',
  deworm: '#fb923c',
  checkup: '#34d399',
  other: '#9ca3af',
};

const typeLabels: Record<MedicalType, string> = {
  vaccine: '💉 疫苗',
  deworm: '🐛 驱虫',
  checkup: '🏥 体检',
  other: '📋 其他',
};

type FilterType = 'all' | 'pending' | 'completed';

const MedicalCalendar: React.FC<MedicalCalendarProps> = ({ petId }) => {
  const [medicalRecords, setMedicalRecords] = useState<Medical[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<{
    type: MedicalType;
    date: string;
    notes: string;
  }>({
    type: 'vaccine',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  useEffect(() => {
    loadMedical();
  }, [petId]);

  const loadMedical = async () => {
    try {
      const response = await getMedical(petId);
      if (response.data) {
        setMedicalRecords(response.data);
      }
    } catch (error) {
      console.error('Failed to load medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const dateMedicalMap = useMemo(() => {
    const map: Record<string, Medical[]> = {};
    medicalRecords.forEach((m) => {
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    });
    return map;
  }, [medicalRecords]);

  const selectedDateMedicals = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    let items = dateMedicalMap[dateStr] || [];
    if (filter === 'pending') items = items.filter((m) => !m.completed);
    if (filter === 'completed') items = items.filter((m) => m.completed);
    return items;
  }, [selectedDate, dateMedicalMap, filter]);

  const handleToggleComplete = async (medical: Medical) => {
    try {
      await updateMedical(medical.id, { completed: !medical.completed });
      loadMedical();
    } catch (error) {
      console.error('Failed to toggle medical record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除此医疗提醒吗？')) {
      try {
        await deleteMedical(id);
        loadMedical();
      } catch (error) {
        console.error('Failed to delete medical record:', error);
      }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMedical({ petId, type: formData.type, date: formData.date, notes: formData.notes || undefined });
      loadMedical();
      setShowAddModal(false);
      setFormData({ type: 'vaccine', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    } catch (error) {
      console.error('Failed to create medical record:', error);
    }
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待办' },
    { key: 'completed', label: '已完成' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '0 16px' }}>
        <div className="animate-shimmer" style={{ height: '360px', borderRadius: '16px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            style={{ border: 'none', background: 'rgba(255,255,255,0.8)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px' }}
          >
            ‹
          </button>
          <span style={{ fontWeight: 600, fontSize: '16px', color: '#374151' }}>
            {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            style={{ border: 'none', background: 'rgba(255,255,255,0.8)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px' }}
          >
            ›
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ padding: '8px 16px', fontSize: '13px' }}>
          + 添加提醒
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
        {weekDays.map((day) => (
          <div key={day} style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', padding: '8px 0', fontWeight: 500 }}>
            {day}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {monthDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayMedicals = dateMedicalMap[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          const dotColors = [...new Set(dayMedicals.map((m) => typeColors[m.type]))].slice(0, 3);

          return (
            <div
              key={i}
              onClick={() => setSelectedDate(day)}
              style={{
                textAlign: 'center',
                padding: '6px 2px',
                cursor: 'pointer',
                borderRadius: '10px',
                background: isSelected
                  ? 'linear-gradient(135deg, #ff9a9e, #fecfef)'
                  : isToday
                  ? 'rgba(255, 154, 158, 0.1)'
                  : 'transparent',
                transition: 'all 0.2s',
                opacity: isCurrentMonth ? 1 : 0.3,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,154,158,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background = isToday ? 'rgba(255,154,158,0.1)' : 'transparent';
                }
              }}
            >
              <div style={{ fontSize: '13px', color: isSelected ? '#fff' : isToday ? '#ff9a9e' : '#4b5563', fontWeight: isToday || isSelected ? 600 : 400 }}>
                {format(day, 'd')}
              </div>
              {dotColors.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                  {dotColors.map((color, ci) => (
                    <div key={ci} style={{ width: '5px', height: '5px', borderRadius: '50%', background: color }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '24px',
            maxHeight: '60vh',
            overflowY: 'auto',
            animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '16px', color: '#374151' }}>
              {format(selectedDate, 'M月d日', { locale: zhCN })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', position: 'relative' }}>
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: filter === f.key ? 600 : 400,
                  color: filter === f.key ? '#ff9a9e' : '#6b7280',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {f.label}
              </button>
            ))}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                height: '2px',
                width: `${100 / filters.length}%`,
                background: 'linear-gradient(90deg, #ff9a9e, #fecfef)',
                borderRadius: '1px',
                transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                left: `${filters.findIndex((f) => f.key === filter) * (100 / filters.length)}%`,
              }}
            />
          </div>

          {selectedDateMedicals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: '14px' }}>
              当日暂无安排
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedDateMedicals.map((medical) => {
                const color = typeColors[medical.type];
                return (
                  <div
                    key={medical.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.5)',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{typeLabels[medical.type].split(' ')[0]}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                          {typeLabels[medical.type].split(' ')[1]}
                        </span>
                        {!medical.completed && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: `${color}20`,
                              color: color,
                              animation: 'pendingBlink 2s ease-in-out infinite',
                            }}
                          >
                            待办
                          </span>
                        )}
                        {medical.completed && (
                          <span style={{ fontSize: '14px', color: '#34d399', fontWeight: 700 }}>✓</span>
                        )}
                      </div>
                      {medical.notes && (
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {medical.notes}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleToggleComplete(medical)}
                        style={{
                          border: 'none',
                          background: medical.completed ? '#f0fdf4' : `${color}15`,
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: medical.completed ? '#34d399' : color,
                        }}
                      >
                        {medical.completed ? '撤销' : '完成'}
                      </button>
                      <button
                        onClick={() => handleDelete(medical.id)}
                        style={{ border: 'none', background: '#fef2f2', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: '#ef4444' }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedDate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 99 }}
          onClick={() => setSelectedDate(null)}
        />
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '18px' }} className="gradient-text">添加医疗提醒</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>类型</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(Object.keys(typeLabels) as MedicalType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: formData.type === type ? `2px solid ${typeColors[type]}` : '2px solid #e5e7eb',
                        background: formData.type === type ? `${typeColors[type]}15` : 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.2s',
                      }}
                    >
                      {typeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="添加备注信息..."
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  添加提醒
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pendingBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default MedicalCalendar;
