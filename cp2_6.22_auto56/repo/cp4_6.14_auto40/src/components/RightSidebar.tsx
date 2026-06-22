import React, { useState, useRef } from 'react';
import { format, parseISO, isAfter } from 'date-fns';
import { useApp } from '../App';
import { Booking, Teacher, PracticeTask } from '../types';

type MobileTab = 'list' | 'detail';

export default function RightSidebar() {
  const { currentUser, bookings, selectedBooking, setSelectedBooking, teachers, refreshBookings } = useApp();
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [mobileTab, setMobileTab] = useState<MobileTab>('list');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const upcomingBookings = (Array.isArray(bookings) ? bookings : [])
    .filter(b => b.status !== 'cancelled' && isAfter(parseISO(b.date), new Date()))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const getTeacher = (teacherId: string): Teacher | undefined =>
    teachers.find(t => t.id === teacherId);

  const getPersonName = (booking: Booking): string => {
    if (currentUser.role === 'student') {
      return getTeacher(booking.teacherId)?.name ?? '老师';
    }
    return booking.studentId;
  };

  const getPersonAvatar = (booking: Booking): string => {
    if (currentUser.role === 'student') {
      return getTeacher(booking.teacherId)?.avatar ?? '';
    }
    return '';
  };

  const getCourseType = (booking: Booking): string => {
    const teacher = getTeacher(booking.teacherId);
    return teacher?.courses.find(c => c.id === booking.courseId)?.type ?? '';
  };

  const statusLabel: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
  };

  const handleToggleTask = async (task: PracticeTask) => {
    const endpoint = task.isCompleted
      ? `/api/tasks/${task.id}/uncomplete`
      : `/api/tasks/${task.id}/complete`;
    try {
      await fetch(endpoint, { method: 'PUT' });
      refreshBookings();
    } catch {}
  };

  const handleRecordingUpload = async (taskId: string, file: File) => {
    if (!file.name.toLowerCase().endsWith('.wav')) {
      setUploadError(prev => ({ ...prev, [taskId]: '仅支持 WAV 格式' }));
      setTimeout(() => {
        setUploadError(prev => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      }, 3000);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError(prev => ({ ...prev, [taskId]: '文件大小不能超过 2MB' }));
      setTimeout(() => {
        setUploadError(prev => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      }, 3000);
      return;
    }
    const formData = new FormData();
    formData.append('recording', file);
    formData.append('recordingName', file.name);
    try {
      const res = await fetch(`/api/tasks/${taskId}/recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingUrl: URL.createObjectURL(file),
          recordingName: file.name,
        }),
      });
      if (res.ok) {
        setUploadError(prev => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        refreshBookings();
      }
    } catch {}
  };

  const renderStars = (rating: number) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`star ${i <= rating ? 'active' : ''}`}
          style={{ cursor: 'default', fontSize: 16 }}
        >
          ★
        </span>
      ))}
    </div>
  );

  const renderTaskItem = (task: PracticeTask) => (
    <div
      key={task.id}
      style={{
        padding: '12px',
        background: '#FAFAFA',
        borderRadius: 8,
        marginBottom: 8,
        border: '1px solid #F3F4F6',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <input
          type="checkbox"
          checked={task.isCompleted}
          onChange={() => handleToggleTask(task)}
          style={{ marginTop: 3, accentColor: '#F59E0B', width: 16, height: 16, cursor: 'pointer' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: task.isCompleted ? '#9CA3AF' : '#1F2937',
              textDecoration: task.isCompleted ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>
              {task.description}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            截止: {format(parseISO(task.dueDate), 'MM/dd HH:mm')}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <input
            type="file"
            accept=".wav"
            ref={el => { fileInputRefs.current[task.id] = el; }}
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                handleRecordingUpload(task.id, file);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => fileInputRefs.current[task.id]?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: task.recordingUrl ? '#10B981' : '#6B7280',
              background: task.recordingUrl ? '#ECFDF5' : '#F9FAFB',
              border: `1px solid ${task.recordingUrl ? '#A7F3D0' : '#E5E7EB'}`,
              borderRadius: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {task.recordingUrl ? '✓ 录音' : '🎤 上传'}
          </button>
          {uploadError[task.id] && (
            <div style={{ fontSize: 10, color: '#EF4444', marginTop: 4, textAlign: 'right' }}>
              {uploadError[task.id]}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBookingDetail = (booking: Booking) => {
    const personName = getPersonName(booking);
    const personAvatar = getPersonAvatar(booking);
    const courseType = getCourseType(booking);

    return (
      <div style={{ animation: 'fadeIn 0.3s ease forwards' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>预约详情</h3>
          <button
            onClick={() => {
              setSelectedBooking(null);
              setMobileTab('list');
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: '#F3F4F6',
              color: '#6B7280',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {personAvatar && (
              <img src={personAvatar} alt="" className="avatar" style={{ width: 44, height: 44 }} />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1F2937' }}>{personName}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{courseType}</div>
            </div>
            <span
              className={`badge badge-${booking.status}`}
              style={{ marginLeft: 'auto' }}
            >
              {statusLabel[booking.status]}
            </span>
          </div>

          <div style={{ background: '#FEF3C7', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
              {format(parseISO(booking.date), 'yyyy年MM月dd日 EEEE')}
            </div>
            <div style={{ fontSize: 12, color: '#A16207', marginTop: 2 }}>
              {booking.startTime} - {booking.endTime}
            </div>
          </div>

          {booking.note && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>备注</div>
              <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', padding: 10, borderRadius: 6, lineHeight: 1.5 }}>
                {booking.note}
              </div>
            </div>
          )}

          {booking.review && (
            <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 12, border: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>评价</div>
              {renderStars(booking.review.rating)}
              {booking.review.description && (
                <div style={{ fontSize: 13, color: '#374151', marginTop: 6, lineHeight: 1.5 }}>
                  {booking.review.description}
                </div>
              )}
            </div>
          )}

          {booking.tasks && booking.tasks.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
                练习任务 ({booking.tasks.filter(t => t.isCompleted).length}/{booking.tasks.length})
              </div>
              {booking.tasks.map(renderTaskItem)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBookingListItem = (booking: Booking) => {
    const personName = getPersonName(booking);
    const courseType = getCourseType(booking);

    return (
      <div
        key={booking.id}
        onClick={() => {
          setSelectedBooking(booking);
          setMobileTab('detail');
        }}
        style={{
          padding: '12px',
          background: '#FAFAFA',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          border: '1px solid #F3F4F6',
          marginBottom: 8,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#FEF3C7';
          e.currentTarget.style.borderColor = '#FDE68A';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = '#FAFAFA';
          e.currentTarget.style.borderColor = '#F3F4F6';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
            {booking.startTime} - {booking.endTime}
          </span>
          <span className={`badge badge-${booking.status}`} style={{ fontSize: 11 }}>
            {statusLabel[booking.status]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          {personName} · {courseType}
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
          {format(parseISO(booking.date), 'MM/dd')}
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>即将到来</h3>
      {upcomingBookings.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 12px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 40, height: 40, marginBottom: 8, opacity: 0.4 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
          </svg>
          <div style={{ fontSize: 13 }}>暂无即将到来的预约</div>
        </div>
      ) : (
        upcomingBookings.map(renderBookingListItem)
      )}
    </div>
  );

  const sidebarContent = selectedBooking ? renderBookingDetail(selectedBooking) : renderList();

  return (
    <aside className="right-sidebar" style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: 300,
      height: '100vh',
      background: '#FFFBEB',
      borderLeft: '1px solid #E5E7EB',
      overflowY: 'auto',
      padding: 20,
      zIndex: 1000,
    }}>
      <div style={{ display: 'none' }} className="right-sidebar-mobile-tabs">
        <div className="tabs" style={{ marginBottom: 16 }}>
          <button
            className={`tab ${mobileTab === 'list' ? 'active' : ''}`}
            onClick={() => { setMobileTab('list'); setSelectedBooking(null); }}
          >
            预约列表
          </button>
          <button
            className={`tab ${mobileTab === 'detail' ? 'active' : ''}`}
            onClick={() => setMobileTab('detail')}
            disabled={!selectedBooking}
            style={{ opacity: selectedBooking ? 1 : 0.5, cursor: selectedBooking ? 'pointer' : 'not-allowed' }}
          >
            详情
          </button>
        </div>
      </div>
      {sidebarContent}
      <style>{`
        @media (max-width: 768px) {
          .right-sidebar-mobile-tabs {
            display: block !important;
          }
        }
      `}</style>
    </aside>
  );
}
