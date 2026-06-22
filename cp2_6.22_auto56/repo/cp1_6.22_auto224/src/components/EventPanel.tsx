import { useState, useEffect } from 'react';
import { TimelineEvent, categoryColors, categoryLabels } from '../utils/storage';

interface Props {
  events: TimelineEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  onAddEvent: (event: Omit<TimelineEvent, 'id'>) => string;
  onUpdateEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  fontSize: 13,
  color: '#1E293B',
  outline: 'none',
  background: '#F8FAFC',
  transition: 'all 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 6,
};

export default function EventPanel({
  events,
  selectedEventId,
  onSelectEvent,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: Props) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<TimelineEvent['category']>('task');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (selectedEventId) {
      const ev = events.find((e) => e.id === selectedEventId);
      if (ev) {
        setEditingId(ev.id);
        setName(ev.name);
        setDate(ev.date);
        setCategory(ev.category);
        setDescription(ev.description);
        setImageUrl(ev.imageUrl || '');
      }
    }
  }, [selectedEventId, events]);

  const resetForm = () => {
    setName('');
    setDate(new Date().toISOString().slice(0, 10));
    setCategory('task');
    setDescription('');
    setImageUrl('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 300);

    const eventData = {
      name: name.trim(),
      date,
      category,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
    };

    if (editingId) {
      onUpdateEvent(editingId, eventData);
    } else {
      const newId = onAddEvent(eventData);
      onSelectEvent(newId);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除此事件吗？')) {
      onDeleteEvent(id);
      if (editingId === id) {
        resetForm();
      }
    }
  };

  const handleEdit = (ev: TimelineEvent) => {
    onSelectEvent(ev.id);
  };

  const categories: { value: TimelineEvent['category']; label: string }[] = [
    { value: 'milestone', label: '里程碑' },
    { value: 'task', label: '任务' },
    { value: 'anniversary', label: '纪念日' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: '0 0 auto',
          width: '100%',
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>
            {editingId ? '编辑事件' : '添加新事件'}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              style={{
                fontSize: 12,
                color: '#64748B',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              取消编辑
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>事件名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入事件名称"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TimelineEvent['category'])}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>描述</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="事件详细描述（可选）"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>图片URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="图片链接地址（可选）"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px 20px',
                  background: '#3B82F6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  transform: isAdding ? 'scale(0.95)' : 'scale(1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#2563EB')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#3B82F6')}
              >
                {editingId ? '保存修改' : '添加事件'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#64748B',
            textTransform: 'uppercase' as const,
            letterSpacing: 0.5,
            padding: '4px 8px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>事件列表（{events.length}）</span>
        </div>
        {events.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: '#94A3B8',
              fontSize: 13,
            }}
          >
            暂无事件，添加第一个事件开始创建时间线
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev.id === selectedEventId ? null : ev.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: ev.id === selectedEventId ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  border: ev.id === selectedEventId ? '1px solid #BFDBFE' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (ev.id !== selectedEventId) {
                    e.currentTarget.style.background = '#F8FAFC';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    ev.id === selectedEventId ? '#EFF6FF' : 'transparent';
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: categoryColors[ev.category],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1E293B',
                      whiteSpace: 'nowrap' as const,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ev.name}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{ev.date}</span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: categoryColors[ev.category] + '1A',
                        color: categoryColors[ev.category],
                        fontWeight: 500,
                      }}
                    >
                      {categoryLabels[ev.category]}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(ev);
                    }}
                    style={{
                      padding: '5px 10px',
                      fontSize: 11,
                      border: '1px solid #E2E8F0',
                      background: '#fff',
                      color: '#475569',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F1F5F9';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(ev.id);
                    }}
                    style={{
                      padding: '5px 10px',
                      fontSize: 11,
                      border: '1px solid #FECACA',
                      background: '#fff',
                      color: '#EF4444',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FEF2F2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
