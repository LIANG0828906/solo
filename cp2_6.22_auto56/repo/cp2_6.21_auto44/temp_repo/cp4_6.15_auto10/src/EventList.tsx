import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus, Edit3, Trash2, Calendar, MapPin, Users,
  CheckCircle, Download, Upload, X, AlertTriangle
} from 'lucide-react';
import { EventItem } from './types';
import { exportAsJSON, importFromJSON, generateCheckInCode, generateId } from './data';

interface EventListProps {
  events: EventItem[];
  onEventsChange: (events: EventItem[]) => void;
  onNavigateToCheckIn: (eventId: string) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  onRefreshData: () => void;
}

interface EventFormData {
  name: string;
  time: string;
  location: string;
  maxParticipants: number;
}

const EventCard = React.memo(({
  event,
  onEdit,
  onDelete,
  onCheckIn,
}: {
  event: EventItem;
  onEdit: () => void;
  onDelete: () => void;
  onCheckIn: () => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => {
      onDelete();
    }, 280);
  };

  const firstChar = event.name.charAt(0);
  const gradientColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  ];
  const gradient = gradientColors[event.name.length % gradientColors.length];
  const checkInRate = event.participantIds.length > 0
    ? Math.round((event.checkedInIds.length / event.participantIds.length) * 100)
    : 0;

  return (
    <div
      className={`event-card ${isDeleting ? 'animate-fade-out' : ''}`}
      style={{
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: '20px',
        transition: 'all var(--transition)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '24px',
            fontWeight: '700',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {firstChar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.name}
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginBottom: '2px',
            }}
          >
            <Calendar size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.time}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <MapPin size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.location}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Users size={14} />
            <span>
              {event.participantIds.length}/{event.maxParticipants} 人报名
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: '600',
              color: checkInRate >= 80
                ? 'var(--color-success)'
                : checkInRate >= 50
                ? 'var(--color-warning)'
                : 'var(--color-text-secondary)',
            }}
          >
            <CheckCircle size={14} />
            <span>签到率 {checkInRate}%</span>
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--color-border)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${checkInRate}%`,
              background: checkInRate >= 80
                ? 'linear-gradient(90deg, #10B981, #34D399)'
                : checkInRate >= 50
                ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                : 'linear-gradient(90deg, #3B82F6, #60A5FA)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onCheckIn(); }}
          style={{
            flex: 1,
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
        >
          <CheckCircle size={16} />
          签到核销
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-primary)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-light)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={handleDelete}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-error-light)',
            color: 'var(--color-error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-error)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-error-light)';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
});

EventCard.displayName = 'EventCard';

const EventList: React.FC<EventListProps> = ({
  events,
  onEventsChange,
  onNavigateToCheckIn,
  onShowToast,
  onRefreshData,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    time: '',
    location: '',
    maxParticipants: 50,
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importInputKey, setImportInputKey] = useState(0);

  const openCreateModal = useCallback(() => {
    setEditingEvent(null);
    setFormData({ name: '', time: '', location: '', maxParticipants: 50 });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((event: EventItem) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      time: event.time,
      location: event.location,
      maxParticipants: event.maxParticipants,
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.time.trim() || !formData.location.trim()) {
      onShowToast('请填写所有必填项', 'error');
      return;
    }
    if (formData.maxParticipants <= 0) {
      onShowToast('最大参与人数必须大于0', 'error');
      return;
    }

    if (editingEvent) {
      const newEvents = events.map(e =>
        e.id === editingEvent.id
          ? { ...e, ...formData }
          : e
      );
      onEventsChange(newEvents);
      onShowToast('活动更新成功', 'success');
    } else {
      const newEvent: EventItem = {
        id: generateId(),
        ...formData,
        checkInCode: generateCheckInCode(),
        participantIds: [],
        checkedInIds: [],
        createdAt: Date.now(),
      };
      onEventsChange([newEvent, ...events]);
      onShowToast('活动创建成功', 'success');
    }
    setShowModal(false);
  }, [formData, editingEvent, events, onEventsChange, onShowToast]);

  const handleDelete = useCallback((eventId: string) => {
    const newEvents = events.filter(e => e.id !== eventId);
    onEventsChange(newEvents);
    setDeleteConfirmId(null);
    onShowToast('活动已删除', 'success');
  }, [events, onEventsChange, onShowToast]);

  const handleExport = useCallback(() => {
    exportAsJSON();
    onShowToast('数据导出成功', 'success');
  }, [onShowToast]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await importFromJSON(file);
    if (success) {
      onRefreshData();
      onShowToast('数据导入成功', 'success');
    } else {
      onShowToast('导入失败：文件格式错误', 'error');
    }
    setImportInputKey(k => k + 1);
  }, [onRefreshData, onShowToast]);

  const sortedEvents = useMemo(() =>
    [...events].sort((a, b) => b.createdAt - a.createdAt),
    [events]
  );

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--color-text)',
              marginBottom: '4px',
            }}
          >
            活动管理
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            共 {events.length} 个活动
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-card)'; }}
          >
            <Upload size={16} />
            导入
            <input
              key={importInputKey}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </label>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-card)'; }}
          >
            <Download size={16} />
            导出
          </button>
          <button
            onClick={openCreateModal}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-md)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
          >
            <Plus size={16} />
            新建活动
          </button>
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <div
          style={{
            background: 'var(--color-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '64px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}
          >
            🎉
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            暂无活动
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            点击右上角"新建活动"按钮创建第一个活动
          </p>
          <button
            onClick={openCreateModal}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
          >
            <Plus size={16} />
            新建活动
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {sortedEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => openEditModal(event)}
              onDelete={() => setDeleteConfirmId(event.id)}
              onCheckIn={() => onNavigateToCheckIn(event.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
            style={{
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
                {editingEvent ? '编辑活动' : '新建活动'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                  活动名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入活动名称"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    transition: 'all var(--transition)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                  活动时间 *
                </label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="例如：2026-06-20 09:00 - 18:00"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                  活动地点 *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="请输入活动地点"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                  最大参与人数 *
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '24px',
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-border)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
              >
                {editingEvent ? '保存修改' : '创建活动'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div
          onClick={() => setDeleteConfirmId(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
            style={{
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--color-error-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={28} style={{ color: 'var(--color-error)' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              确认删除活动？
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              删除后将无法恢复，相关签到数据也会受到影响
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-border)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-error)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#DC2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-error)'; }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
