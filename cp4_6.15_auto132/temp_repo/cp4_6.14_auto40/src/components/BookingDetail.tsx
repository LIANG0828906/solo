import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Booking, Teacher, Student, PracticeTask, Course } from '../types';

const COLORS = {
  primary: '#F59E0B',
  light: '#FEF3C7',
  text: '#1F2937',
  bg: '#FFFBEB',
  border: '#E5E7EB',
  muted: '#6B7280',
  white: '#FFFFFF',
  success: '#10B981',
  danger: '#EF4444',
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: '#D97706', bg: '#FEF3C7' },
  confirmed: { label: '已确认', color: '#2563EB', bg: '#DBEAFE' },
  completed: { label: '已完成', color: '#059669', bg: '#D1FAE5' },
  cancelled: { label: '已取消', color: '#DC2626', bg: '#FEE2E2' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, color: COLORS.muted, bg: COLORS.light };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        color: s.color,
        background: s.bg,
      }}
    >
      {s.label}
    </span>
  );
}

function Avatar({ src, name, size = 48 }: { src: string; name: string; size?: number }) {
  return (
    <img
      src={src}
      alt={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: `2px solid ${COLORS.light}`,
        flexShrink: 0,
      }}
    />
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => onChange(i)}
          style={{
            fontSize: 28,
            cursor: 'pointer',
            color: i <= value ? COLORS.primary : '#E5E7EB',
            transition: 'color 0.15s',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewForm({ bookingId, onSubmitted }: { bookingId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, description }),
      });
      if (res.ok) onSubmitted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: COLORS.white,
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: 20,
      }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: COLORS.text }}>
        提交评价
      </h3>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: COLORS.text }}>
          评分
        </label>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: COLORS.text }}>
          评价内容
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="请输入评价内容..."
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            fontSize: 14,
            color: COLORS.text,
            resize: 'vertical',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '10px 24px',
          borderRadius: 8,
          border: 'none',
          background: COLORS.primary,
          color: COLORS.white,
          fontSize: 14,
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? '提交中...' : '提交评价'}
      </button>
    </form>
  );
}

function TaskForm({ bookingId, onAdded }: { bookingId: string; onAdded: () => void }) {
  const [tasks, setTasks] = useState([{ title: '', description: '', dueDate: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const addRow = () => {
    if (tasks.length >= 5) return;
    setTasks([...tasks, { title: '', description: '', dueDate: '' }]);
  };

  const updateRow = (index: number, field: string, value: string) => {
    const next = [...tasks];
    next[index] = { ...next[index], [field]: value };
    setTasks(next);
  };

  const removeRow = (index: number) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = tasks.filter((t) => t.title.trim());
    if (valid.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/bookings/${bookingId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: valid }),
      });
      setTasks([{ title: '', description: '', dueDate: '' }]);
      onAdded();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: COLORS.white,
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>布置练习任务</h3>
        <button
          type="button"
          onClick={addRow}
          disabled={tasks.length >= 5}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: `1px solid ${COLORS.primary}`,
            background: 'transparent',
            color: COLORS.primary,
            fontSize: 13,
            fontWeight: 500,
            cursor: tasks.length >= 5 ? 'not-allowed' : 'pointer',
            opacity: tasks.length >= 5 ? 0.5 : 1,
          }}
        >
          + 添加任务 ({tasks.length}/5)
        </button>
      </div>
      {tasks.map((task, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
            marginBottom: 12,
            padding: 12,
            background: COLORS.bg,
            borderRadius: 8,
          }}
        >
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
              标题 *
            </label>
            <input
              value={task.title}
              onChange={(e) => updateRow(i, 'title', e.target.value)}
              placeholder="任务标题"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13,
                color: COLORS.text,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 3 }}>
            <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
              描述
            </label>
            <input
              value={task.description}
              onChange={(e) => updateRow(i, 'description', e.target.value)}
              placeholder="任务描述"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13,
                color: COLORS.text,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 1.2 }}>
            <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
              截止日期
            </label>
            <input
              type="date"
              value={task.dueDate}
              onChange={(e) => updateRow(i, 'dueDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13,
                color: COLORS.text,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          {tasks.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              style={{
                padding: '8px',
                border: 'none',
                background: 'transparent',
                color: COLORS.danger,
                fontSize: 18,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '10px 24px',
          borderRadius: 8,
          border: 'none',
          background: COLORS.primary,
          color: COLORS.white,
          fontSize: 14,
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? '提交中...' : '提交任务'}
      </button>
    </form>
  );
}

function TaskItem({
  task,
  isStudent,
  onToggle,
}: {
  task: PracticeTask;
  isStudent: boolean;
  onToggle: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (!file.name.toLowerCase().endsWith('.wav')) {
      setUploadError('仅支持 WAV 格式');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('文件大小不能超过 2MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingUrl: URL.createObjectURL(file),
          recordingName: file.name,
        }),
      });
      if (res.ok) {
        refreshBookings();
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 0',
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {isStudent && (
        <input
          type="checkbox"
          checked={task.isCompleted}
          onChange={onToggle}
          style={{
            width: 20,
            height: 20,
            accentColor: COLORS.primary,
            marginTop: 2,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.text,
            textDecoration: task.isCompleted ? 'line-through' : 'none',
            opacity: task.isCompleted ? 0.6 : 1,
          }}
        >
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>{task.description}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          {task.dueDate && (
            <span style={{ fontSize: 12, color: COLORS.muted }}>截止: {task.dueDate}</span>
          )}
          {task.recordingUrl && (
            <a
              href={task.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: COLORS.primary, textDecoration: 'none' }}
            >
              🎵 {task.recordingName || '录音'}
            </a>
          )}
          {isStudent && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${COLORS.primary}`,
                  background: 'transparent',
                  color: COLORS.primary,
                  fontSize: 12,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? '上传中...' : '上传录音'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {uploadError && (
                <span style={{ fontSize: 12, color: COLORS.danger }}>{uploadError}</span>
              )}
            </>
          )}
          {!isStudent && task.isCompleted && (
            <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 500 }}>✓ 已完成</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, bookings, teachers, setBookings, refreshBookings } = useApp();

  const booking: Booking | undefined = (Array.isArray(bookings) ? bookings : []).find((b) => b.id === id);

  const isTeacher = currentUser.role === 'teacher';

  const teacher = teachers.find((t) => t.id === booking?.teacherId);
  const student: Student | undefined = booking
    ? { id: booking.studentId, name: booking.studentId, role: 'student', avatar: '' }
    : undefined;

  const course: Course | undefined = teacher?.courses.find((c) => c.id === booking?.courseId);

  const handleToggleTask = async (task: PracticeTask) => {
    const endpoint = task.isCompleted
      ? `/api/tasks/${task.id}/uncomplete`
      : `/api/tasks/${task.id}/complete`;
    try {
      const res = await fetch(endpoint, { method: 'PUT' });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => {
            if (b.id !== booking?.id || !b.tasks) return b;
            return {
              ...b,
              tasks: b.tasks.map((t) =>
                t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t
              ),
            };
          })
        );
      }
    } catch {}
  };

  if (!booking) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: COLORS.muted }}>
        <p style={{ fontSize: 16, marginBottom: 16 }}>未找到预约信息</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: COLORS.primary,
            color: COLORS.white,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          返回
        </button>
      </div>
    );
  }

  const showReviewForm = isTeacher && booking.status === 'completed' && !booking.review;

  return (
    <div style={{ padding: 24, background: COLORS.bg, minHeight: '100%', color: COLORS.text }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.white,
          color: COLORS.text,
          fontSize: 14,
          cursor: 'pointer',
          marginBottom: 20,
        }}
      >
        ← 返回
      </button>

      <div
        style={{
          background: COLORS.white,
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>预约详情</h2>
          <StatusBadge status={booking.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 500, textTransform: 'uppercase' }}>
              日期 & 时间
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>
              {booking.date}
            </div>
            <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 2 }}>
              {booking.startTime} - {booking.endTime}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 500, textTransform: 'uppercase' }}>
              {isTeacher ? '学生' : '老师'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar
                src={isTeacher ? (student?.avatar || '') : (teacher?.avatar || '')}
                name={isTeacher ? (student?.name || '') : (teacher?.name || '')}
                size={40}
              />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>
                  {isTeacher ? (student?.name || '学生') : (teacher?.name || '老师')}
                </div>
                {!isTeacher && teacher?.bio && (
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {teacher.bio}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: 500, textTransform: 'uppercase' }}>
              课程信息
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>
              {course?.type || '课程'}
            </div>
            {course && (
              <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
                {course.duration} 分钟 · ¥{course.price}
              </div>
            )}
          </div>
        </div>

        {booking.note && (
          <div style={{ marginTop: 20, padding: 14, background: COLORS.light, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4, fontWeight: 500 }}>备注</div>
            <div style={{ fontSize: 14, color: COLORS.text }}>{booking.note}</div>
          </div>
        )}

        {booking.review && (
          <div style={{ marginTop: 20, padding: 16, background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 8 }}>已评价</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <StarInput value={booking.review.rating} onChange={() => {}} />
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.primary }}>
                {booking.review.rating.toFixed(1)}
              </span>
            </div>
            {booking.review.description && (
              <div style={{ fontSize: 14, color: COLORS.text }}>{booking.review.description}</div>
            )}
          </div>
        )}
      </div>

      {showReviewForm && <ReviewForm bookingId={booking.id} onSubmitted={() => {}} />}

      {isTeacher && (
        <TaskForm bookingId={booking.id} onAdded={() => {}} />
      )}

      {booking.tasks && booking.tasks.length > 0 && (
        <div
          style={{
            background: COLORS.white,
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: COLORS.text }}>
            练习任务
          </h3>
          {booking.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isStudent={!isTeacher}
              onToggle={() => handleToggleTask(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
