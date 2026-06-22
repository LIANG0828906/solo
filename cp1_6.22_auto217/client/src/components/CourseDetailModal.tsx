import { useState, useEffect } from 'react';
import type { Course, UserProgress, CourseStatus } from '../../../shared/types';

interface CourseDetailModalProps {
  course: Course | null;
  progress: UserProgress | null;
  allCourses: Course[];
  onClose: () => void;
  onUpdate: (progress: UserProgress) => void;
}

const STATUS_OPTIONS: { value: CourseStatus; label: string; color: string }[] = [
  { value: 'not_started', label: '未开始', color: '#9CA3AF' },
  { value: 'in_progress', label: '进行中', color: '#F59E0B' },
  { value: 'completed', label: '已完成', color: '#10B981' }
];

export default function CourseDetailModal({
  course,
  progress,
  allCourses,
  onClose,
  onUpdate
}: CourseDetailModalProps) {
  const [status, setStatus] = useState<CourseStatus>('not_started');
  const [testScore, setTestScore] = useState<number>(0);
  const [minutesSpent, setMinutesSpent] = useState<number>(0);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) {
      setVisible(true);
      setStatus(progress?.status || 'not_started');
      setTestScore(progress?.testScore || 0);
      setMinutesSpent(progress?.minutesSpent || 0);
    } else {
      setVisible(false);
    }
  }, [course, progress]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (course) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [course]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleSave = async () => {
    if (!course) return;
    setSaving(true);

    const updated: UserProgress = {
      courseId: course.id,
      status,
      testScore,
      minutesSpent,
      lastUpdated: new Date().toISOString()
    };

    await onUpdate(updated);
    setSaving(false);
    handleClose();
  };

  const progressPercent = course
    ? Math.min(Math.round((minutesSpent / course.estimatedMinutes) * 100), 100)
    : 0;

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
    return `${mins}分钟`;
  };

  if (!course) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease-out'
        }}
      />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        pointerEvents: 'none'
      }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: 560,
            maxHeight: '90vh',
            overflow: 'auto',
            pointerEvents: 'auto',
            transform: visible ? 'scale(1)' : 'scale(0.9)',
            opacity: visible ? 1 : 0,
            transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
          }}
        >
          <div style={{
            padding: '24px 24px 16px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16
          }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>
                {course.name}
              </h2>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
                {course.description}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: '#F1F5F9',
                color: '#64748B',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s ease-out'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#F1F5F9')}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#1E293B', marginBottom: 8 }}>
                完成状态
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: status === opt.value ? `2px solid ${opt.color}` : '2px solid #E2E8F0',
                      background: status === opt.value ? `${opt.color}10` : '#FFFFFF',
                      color: status === opt.value ? opt.color : '#64748B',
                      fontWeight: 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-out'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#1E293B', marginBottom: 8 }}>
                学习进度
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 8
              }}>
                <div style={{
                  flex: 1,
                  height: 8,
                  background: '#E2E8F0',
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: status === 'completed' ? '#10B981' : '#3B82F6',
                    borderRadius: 4,
                    transition: 'width 0.3s ease-out'
                  }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', minWidth: 48, textAlign: 'right' }}>
                  {progressPercent}%
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <input
                  type="number"
                  min="0"
                  value={minutesSpent}
                  onChange={e => setMinutesSpent(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s ease-out'
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3B82F6')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                />
                <span style={{ fontSize: 13, color: '#64748B' }}>分钟</span>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>
                  (预计 {formatMinutes(course.estimatedMinutes)})
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#1E293B', marginBottom: 8 }}>
                测试分数 (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={testScore}
                onChange={e => setTestScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s ease-out'
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3B82F6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
              />
              {testScore > 0 && (
                <p style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: testScore >= 80 ? '#10B981' : testScore >= 60 ? '#F59E0B' : '#EF4444'
                }}>
                  {testScore >= 80 ? '🎉 优秀！' : testScore >= 60 ? '👍 继续加油！' : '💪 需要多练习！'}
                </p>
              )}
            </div>

            {course.prerequisites.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#1E293B', marginBottom: 8 }}>
                  前置课程
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {course.prerequisites.map(prereqId => {
                    const prereq = allCourses.find(c => c.id === prereqId);
                    return prereq ? (
                      <div key={prereqId} style={{
                        padding: '8px 12px',
                        background: '#F8FAFC',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#64748B'
                      }}>
                        📖 {prereq.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#1E293B', marginBottom: 8 }}>
                知识点
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {course.knowledgePoints.map(kp => (
                  <span key={kp} style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 6,
                    background: '#3B82F615',
                    color: '#3B82F6',
                    fontWeight: 500
                  }}>
                    {kp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            padding: '16px 24px 24px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleClose}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#64748B',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease-out'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#F8FAFC';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: saving ? '#93C5FD' : '#3B82F6',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease-out'
              }}
              onMouseEnter={e => {
                if (!saving) e.currentTarget.style.background = '#2563EB';
              }}
              onMouseLeave={e => {
                if (!saving) e.currentTarget.style.background = '#3B82F6';
              }}
            >
              {saving ? '保存中...' : '保存进度'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
