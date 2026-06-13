import React, { useState } from 'react';
import { AppContext } from '../App';
import { Booking, PracticeTask } from '../types';

const COLORS = {
  primary: '#F59E0B',
  light: '#FEF3C7',
  text: '#1F2937',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_BG: Record<string, string> = {
  pending: '#FEF3C7',
  confirmed: '#D1FAE5',
  completed: '#DBEAFE',
  cancelled: '#FEE2E2',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#D97706',
  confirmed: '#059669',
  completed: '#2563EB',
  cancelled: '#DC2626',
};

const ClickableStarRating: React.FC<{
  value: number;
  onChange: (v: number) => void;
}> = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        onClick={() => onChange(i)}
        style={{
          cursor: 'pointer',
          fontSize: 24,
          color: i <= value ? COLORS.primary : '#E5E7EB',
          transition: 'color 0.15s',
          userSelect: 'none',
        }}
      >
        ★
      </span>
    ))}
  </div>
);

const ReviewForm: React.FC<{
  bookingId: string;
  existingRating?: number;
  existingDescription?: string;
  onSubmitted: () => void;
}> = ({ bookingId, existingRating, existingDescription, onSubmitted }) => {
  const [rating, setRating] = useState(existingRating ?? 0);
  const [description, setDescription] = useState(existingDescription ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('请选择评分');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, description }),
      });
      if (!res.ok) throw new Error();
      onSubmitted();
    } catch {
      setError('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8, border: `1px solid ${COLORS.light}` }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>评价</div>
      <ClickableStarRating value={rating} onChange={setRating} />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="输入评价描述..."
        style={{
          width: '100%',
          marginTop: 8,
          padding: 8,
          borderRadius: 6,
          border: '1px solid #E5E7EB',
          fontSize: 13,
          resize: 'vertical',
          minHeight: 60,
          fontFamily: 'inherit',
          color: COLORS.text,
          boxSizing: 'border-box',
        }}
      />
      {error && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{error}</div>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          marginTop: 8,
          padding: '6px 16px',
          borderRadius: 6,
          border: 'none',
          background: COLORS.primary,
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? '提交中...' : '提交评价'}
      </button>
    </div>
  );
};

interface TaskInput {
  title: string;
  description: string;
  dueDate: string;
}

const TaskAssignmentForm: React.FC<{
  bookingId: string;
  onSubmitted: () => void;
}> = ({ bookingId, onSubmitted }) => {
  const [tasks, setTasks] = useState<TaskInput[]>([
    { title: '', description: '', dueDate: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addTask = () => {
    if (tasks.length >= 5) return;
    setTasks([...tasks, { title: '', description: '', dueDate: '' }]);
  };

  const updateTask = (index: number, field: keyof TaskInput, value: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const removeTask = (index: number) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validTasks = tasks.filter((t) => t.title.trim() !== '');
    if (validTasks.length === 0) {
      setError('请至少添加一个练习任务');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: validTasks }),
      });
      if (!res.ok) throw new Error();
      onSubmitted();
    } catch {
      setError('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #E5E7EB',
    fontSize: 13,
    color: COLORS.text,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8, border: `1px solid ${COLORS.light}` }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>布置练习任务</div>
      {tasks.map((task, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            marginBottom: 8,
            padding: 8,
            background: '#FAFAFA',
            borderRadius: 6,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, color: '#6B7280', width: '100%', marginBottom: 4 }}>任务 {i + 1}</div>
          <input
            placeholder="任务标题"
            value={task.title}
            onChange={(e) => updateTask(i, 'title', e.target.value)}
            style={{ ...inputStyle, flex: '1 1 120px' }}
          />
          <input
            placeholder="任务描述"
            value={task.description}
            onChange={(e) => updateTask(i, 'description', e.target.value)}
            style={{ ...inputStyle, flex: '2 1 200px' }}
          />
          <input
            type="date"
            value={task.dueDate}
            onChange={(e) => updateTask(i, 'dueDate', e.target.value)}
            style={{ ...inputStyle, flex: '1 1 120px' }}
          />
          {tasks.length > 1 && (
            <button
              onClick={() => removeTask(i)}
              style={{
                background: 'none',
                border: 'none',
                color: '#DC2626',
                cursor: 'pointer',
                fontSize: 16,
                padding: 4,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {tasks.length < 5 && (
        <button
          onClick={addTask}
          style={{
            background: 'none',
            border: `1px dashed ${COLORS.primary}`,
            color: COLORS.primary,
            padding: '6px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          + 添加任务
        </button>
      )}
      {error && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{error}</div>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          marginTop: 4,
          padding: '6px 16px',
          borderRadius: 6,
          border: 'none',
          background: COLORS.primary,
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? '提交中...' : '布置任务'}
      </button>
    </div>
  );
};

const BookingCard: React.FC<{
  booking: Booking;
  studentName: string;
  courseType: string;
  onRefresh: () => void;
}> = ({ booking, studentName, courseType, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) onRefresh();
    } catch {
    } finally {
      setUpdating(false);
    }
  };

  const completedTasks = (booking.tasks ?? []).filter((t) => t.isCompleted).length;
  const totalTasks = (booking.tasks ?? []).length;

  const hasRecording = (booking.tasks ?? []).some((t) => t.recordingUrl);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{studentName}</span>
            <span
              style={{
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 10,
                background: STATUS_BG[booking.status],
                color: STATUS_COLOR[booking.status],
                fontWeight: 600,
              }}
            >
              {STATUS_LABEL[booking.status]}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>{booking.date}</span>
            <span>{booking.startTime} - {booking.endTime}</span>
            <span>{courseType}</span>
          </div>
        </div>
        <span
          style={{
            fontSize: 12,
            color: '#9CA3AF',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid #F3F4F6' }}>
          {booking.note && (
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 12, fontStyle: 'italic' }}>
              备注: {booking.note}
            </div>
          )}

          {totalTasks > 0 && (
            <div style={{ marginTop: 12, padding: 12, background: '#FAFAFA', borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                任务完成情况 ({completedTasks}/{totalTasks})
              </div>
              {(booking.tasks ?? []).map((task: PracticeTask) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: '1px solid #F3F4F6',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 13, color: task.isCompleted ? '#059669' : '#6B7280' }}>
                    {task.isCompleted ? '✓' : '○'}
                  </span>
                  <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{task.title}</span>
                  {task.dueDate && (
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>截止: {task.dueDate}</span>
                  )}
                  {task.recordingUrl && (
                    <a
                      href={task.recordingUrl}
                      download={task.recordingName || 'recording'}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: 12,
                        color: COLORS.primary,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginLeft: 'auto',
                      }}
                    >
                      🎵 下载录音
                    </a>
                  )}
                  {!task.isCompleted && !task.recordingUrl && (
                    <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>未完成</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasRecording && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(booking.tasks ?? [])
                .filter((t) => t.recordingUrl)
                .map((task: PracticeTask) => (
                  <a
                    key={task.id}
                    href={task.recordingUrl}
                    download={task.recordingName || 'recording'}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: 12,
                      color: '#fff',
                      background: COLORS.primary,
                      padding: '4px 10px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    🎵 {task.recordingName || '录音'} 下载
                  </a>
                ))}
            </div>
          )}

          {booking.review && (
            <div style={{ marginTop: 12, padding: 12, background: COLORS.light, borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: COLORS.text }}>
                已评价
                <span style={{ marginLeft: 8 }}>
                  {'★'.repeat(booking.review.rating)}
                  <span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - booking.review.rating)}</span>
                </span>
              </div>
              {booking.review.description && (
                <div style={{ fontSize: 13, color: '#6B7280' }}>{booking.review.description}</div>
              )}
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={() => updateStatus('confirmed')}
                  disabled={updating}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: COLORS.primary,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.7 : 1,
                  }}
                >
                  确认
                </button>
                <button
                  onClick={() => updateStatus('cancelled')}
                  disabled={updating}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #FCA5A5',
                    background: '#fff',
                    color: '#DC2626',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.7 : 1,
                  }}
                >
                  取消
                </button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <button
                onClick={() => updateStatus('cancelled')}
                disabled={updating}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #FCA5A5',
                  background: '#fff',
                  color: '#DC2626',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.7 : 1,
                }}
              >
                取消预约
              </button>
            )}
            {booking.status === 'completed' && !booking.review && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: `1px solid ${COLORS.primary}`,
                  background: showReviewForm ? COLORS.light : '#fff',
                  color: COLORS.primary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {showReviewForm ? '收起评价' : '添加评价'}
              </button>
            )}
            {(booking.status === 'confirmed' || booking.status === 'completed') && !(booking.tasks ?? []).length && (
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: `1px solid ${COLORS.primary}`,
                  background: showTaskForm ? COLORS.light : '#fff',
                  color: COLORS.primary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {showTaskForm ? '收起任务' : '布置任务'}
              </button>
            )}
          </div>

          {showReviewForm && (
            <ReviewForm
              bookingId={booking.id}
              onSubmitted={() => {
                setShowReviewForm(false);
                onRefresh();
              }}
            />
          )}
          {showTaskForm && (
            <TaskAssignmentForm
              bookingId={booking.id}
              onSubmitted={() => {
                setShowTaskForm(false);
                onRefresh();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default function TeacherSchedule() {
  const { currentUser, bookings, teachers, refreshBookings } = React.useContext(AppContext);
  const [filter, setFilter] = useState<string>('all');

  const teacherBookings = bookings.filter((b: Booking) => b.teacherId === currentUser.id);
  const teacherCourses = teachers.find((t) => t.id === currentUser.id)?.courses ?? [];

  const filteredBookings = filter === 'all'
    ? teacherBookings
    : teacherBookings.filter((b: Booking) => b.status === filter);

  const sortedBookings = [...filteredBookings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getStudentName = (booking: Booking): string => {
    return (booking as any).studentName ?? `学生 ${booking.studentId}`;
  };

  const getCourseType = (booking: Booking): string => {
    const course = teacherCourses.find((c) => c.id === booking.courseId);
    return course ? `${course.type} (${course.duration}分钟)` : booking.courseId;
  };

  const statusFilters = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <div style={{ padding: 24, background: '#FFFBEB', minHeight: '100%', color: COLORS.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: COLORS.text }}>
        课程安排
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: filter === s ? COLORS.primary : '#fff',
              color: filter === s ? '#fff' : COLORS.text,
              fontSize: 13,
              fontWeight: filter === s ? 600 : 400,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              transition: 'all 0.15s',
            }}
          >
            {s === 'all' ? '全部' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {sortedBookings.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: '#9CA3AF',
            fontSize: 15,
          }}
        >
          暂无{filter === 'all' ? '' : STATUS_LABEL[filter]}预约
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedBookings.map((booking: Booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              studentName={getStudentName(booking)}
              courseType={getCourseType(booking)}
              onRefresh={refreshBookings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
