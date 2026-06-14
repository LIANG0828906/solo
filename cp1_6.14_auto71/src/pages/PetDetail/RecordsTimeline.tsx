import React, { useEffect, useState, useMemo } from 'react';
import { getRecords, createRecord, updateRecord, deleteRecord } from '../../api';
import type { Record, RecordType } from '../../types';

interface RecordsTimelineProps {
  petId: string;
}

const typeConfig: Record<RecordType, { icon: string; color: string; label: string }> = {
  feeding: { icon: '🍽️', color: '#fbbf24', label: '喂食' },
  walking: { icon: '🚶', color: '#34d399', label: '遛弯' },
  sleep: { icon: '😴', color: '#a78bfa', label: '睡眠' },
  other: { icon: '📝', color: '#9ca3af', label: '其他' },
};

const foodPresets = ['狗粮', '猫粮', '鸡胸肉', '牛肉', '鱼肉', '零食', '罐头'];

const RecordsTimeline: React.FC<RecordsTimelineProps> = ({ petId }) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [formData, setFormData] = useState({
    type: 'feeding' as RecordType,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    foodType: '',
    grams: '',
    duration: '',
    startTime: '',
    route: '',
    note: '',
  });

  useEffect(() => {
    loadRecords();
  }, [petId]);

  const loadRecords = async () => {
    try {
      const response = await getRecords(petId);
      if (response.data) {
        setRecords(response.data);
      }
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: Record[] } = {};

    if (viewMode === 'day') {
      records.forEach((record) => {
        if (!groups[record.date]) {
          groups[record.date] = [];
        }
        groups[record.date].push(record);
      });
    } else {
      records.forEach((record) => {
        const date = new Date(record.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!groups[weekKey]) {
          groups[weekKey] = [];
        }
        groups[weekKey].push(record);
      });
    }

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([key, items]) => ({
        key,
        records: items.sort((a, b) => b.time.localeCompare(a.time)),
      }));
  }, [records, viewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        petId,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        foodType: formData.foodType || undefined,
        grams: formData.grams ? parseFloat(formData.grams) : undefined,
        duration: formData.duration ? parseFloat(formData.duration) : undefined,
        startTime: formData.startTime || undefined,
        route: formData.route || undefined,
        note: formData.note || undefined,
      };

      if (editingRecord) {
        await updateRecord(editingRecord.id, data);
      } else {
        await createRecord(data);
      }

      loadRecords();
      closeModal();
    } catch (error) {
      console.error('Failed to save record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await deleteRecord(id);
        loadRecords();
        setExpandedId(null);
      } catch (error) {
        console.error('Failed to delete record:', error);
      }
    }
  };

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      date: record.date,
      time: record.time,
      foodType: record.foodType || '',
      grams: record.grams?.toString() || '',
      duration: record.duration?.toString() || '',
      startTime: record.startTime || '',
      route: record.route || '',
      note: record.note || '',
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingRecord(null);
    setFormData({
      type: 'feeding',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      foodType: '',
      grams: '',
      duration: '',
      startTime: '',
      route: '',
      note: '',
    });
  };

  const getRecordSummary = (record: Record): string => {
    switch (record.type) {
      case 'feeding':
        return `${record.foodType || '未指定'} · ${record.grams || 0}g`;
      case 'walking':
        return `时长 ${record.duration || 0}分钟${record.route ? ` · ${record.route}` : ''}`;
      case 'sleep':
        return `时长 ${record.duration || 0}小时${record.note ? ` · ${record.note}` : ''}`;
      default:
        return record.note || '无备注';
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === yesterday.toDateString()) return '昨天';

    if (viewMode === 'week') {
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `${date.getMonth() + 1}月${date.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
    }

    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-shimmer" style={{ height: '72px', borderRadius: '12px' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <button
            onClick={() => setViewMode('day')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: viewMode === 'day' ? 'linear-gradient(135deg, #ff9a9e, #fecfef)' : 'rgba(255,255,255,0.8)',
              color: viewMode === 'day' ? '#fff' : '#6b7280',
            }}
          >
            📅 按日
          </button>
          <button
            onClick={() => setViewMode('week')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: viewMode === 'week' ? 'linear-gradient(135deg, #ff9a9e, #fecfef)' : 'rgba(255,255,255,0.8)',
              color: viewMode === 'week' ? '#fff' : '#6b7280',
            }}
          >
            📆 按周
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ padding: '8px 16px', fontSize: '13px' }}>
          + 添加记录
        </button>
      </div>

      {groupedRecords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>暂无记录</h3>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>点击添加记录开始记录宝贝的日常</p>
        </div>
      ) : (
        groupedRecords.map((group) => (
          <div key={group.key} style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#6b7280',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              {formatDateLabel(group.key)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.records.map((record) => {
                const config = typeConfig[record.type];
                const isExpanded = expandedId === record.id;

                return (
                  <div key={record.id}>
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.7)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(255,255,255,0.5)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: config.color,
                          flexShrink: 0,
                          boxShadow: `0 0 8px ${config.color}40`,
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0, width: '50px' }}>
                        {record.time}
                      </span>
                      <span style={{ fontSize: '12px', color: config.color, fontWeight: 600, flexShrink: 0 }}>
                        {config.label}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#4b5563',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {getRecordSummary(record)}
                      </span>
                      <span style={{ fontSize: '12px', color: '#d1d5db' }}>
                        {isExpanded ? '◂' : '▸'}
                      </span>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '8px',
                          marginLeft: '22px',
                          padding: '20px',
                          background: 'rgba(255,255,255,0.85)',
                          backdropFilter: 'blur(12px)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.5)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                          animation: 'detailSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: config.color }} />
                            <span style={{ fontWeight: 600, color: '#374151' }}>{config.icon} {config.label}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                              style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#6b7280' }}
                            >
                              编辑
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                              style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', fontSize: '12px', color: '#ef4444' }}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>📅 日期：{record.date}</div>
                          <div>🕐 时间：{record.time}</div>
                          {record.type === 'feeding' && (
                            <>
                              <div>🍖 食物：{record.foodType || '未指定'}</div>
                              <div>⚖️ 克数：{record.grams || 0}g</div>
                            </>
                          )}
                          {record.type === 'walking' && (
                            <>
                              <div>⏱️ 时长：{record.duration || 0}分钟</div>
                              <div>🗺️ 路线：{record.route || '无'}</div>
                            </>
                          )}
                          {record.type === 'sleep' && (
                            <>
                              <div>⏱️ 时长：{record.duration || 0}小时</div>
                            </>
                          )}
                          {record.note && <div style={{ gridColumn: '1 / -1' }}>💬 备注：{record.note}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '18px' }} className="gradient-text">
              {editingRecord ? '编辑记录' : '添加记录'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>记录类型</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(Object.keys(typeConfig) as RecordType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: formData.type === type ? `2px solid ${typeConfig[type].color}` : '2px solid #e5e7eb',
                        background: formData.type === type ? `${typeConfig[type].color}15` : 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.2s',
                      }}
                    >
                      {typeConfig[type].icon} {typeConfig[type].label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>日期</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>时间</label>
                  <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required />
                </div>
              </div>

              {formData.type === 'feeding' && (
                <>
                  <div className="form-group">
                    <label>食物种类（快速选择）</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {foodPresets.map((food) => (
                        <button
                          key={food}
                          type="button"
                          onClick={() => setFormData({ ...formData, foodType: food })}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            border: formData.foodType === food ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                            background: formData.foodType === food ? '#fef3c7' : 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          {food}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={formData.foodType}
                      onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                      placeholder="或手动输入食物名称"
                    />
                  </div>
                  <div className="form-group">
                    <label>克数 (g)</label>
                    <input
                      type="number"
                      value={formData.grams}
                      onChange={(e) => setFormData({ ...formData, grams: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {formData.type === 'walking' && (
                <>
                  <div className="form-group">
                    <label>时长 (分钟)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>路线备注</label>
                    <input
                      type="text"
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      placeholder="如：小区花园"
                    />
                  </div>
                </>
              )}

              {formData.type === 'sleep' && (
                <div className="form-group">
                  <label>时长 (小时)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="0"
                  />
                </div>
              )}

              <div className="form-group">
                <label>备注</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="添加备注..."
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingRecord ? '保存修改' : '添加记录'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes detailSlideIn {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RecordsTimeline;
