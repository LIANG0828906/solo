import type { Course, UserProgress } from '../../../shared/types';

interface CourseListProps {
  courses: Course[];
  progress: UserProgress[];
  onCourseClick: (courseId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成'
};

const STATUS_COLORS: Record<string, string> = {
  not_started: '#9CA3AF',
  in_progress: '#F59E0B',
  completed: '#10B981'
};

export default function CourseList({ courses, progress, onCourseClick }: CourseListProps) {
  const getProgressForCourse = (courseId: string) => {
    return progress.find(p => p.courseId === courseId);
  };

  const getProgressPercent = (courseId: string, estimatedMinutes: number) => {
    const p = getProgressForCourse(courseId);
    if (!p || estimatedMinutes === 0) return 0;
    return Math.min(Math.round((p.minutesSpent / estimatedMinutes) * 100), 100);
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}小时${mins > 0 ? `${mins}分` : ''}`;
    return `${mins}分钟`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>
        全部课程 ({courses.length})
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16
      }}>
        {courses.map(course => {
          const p = getProgressForCourse(course.id);
          const status = p?.status || 'not_started';
          const progressPercent = getProgressPercent(course.id, course.estimatedMinutes);

          return (
            <div
              key={course.id}
              className="course-card"
              onClick={() => onCourseClick(course.id)}
              style={{
                background: '#FFFFFF',
                padding: 20,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 8
              }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#1E293B',
                  flex: 1,
                  lineHeight: 1.4
                }}>
                  {course.name}
                </h3>
                <span style={{
                  fontSize: 12,
                  padding: '3px 10px',
                  borderRadius: 6,
                  background: `${STATUS_COLORS[status]}15`,
                  color: STATUS_COLORS[status],
                  fontWeight: 500,
                  flexShrink: 0
                }}>
                  {STATUS_LABELS[status]}
                </span>
              </div>

              <p style={{
                fontSize: 13,
                color: '#64748B',
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {course.description}
              </p>

              <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap'
              }}>
                {course.knowledgePoints.slice(0, 3).map(kp => (
                  <span key={kp} style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: '#F1F5F9',
                    color: '#64748B'
                  }}>
                    {kp}
                  </span>
                ))}
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: '#64748B'
                }}>
                  <span>学习进度</span>
                  <span>
                    {formatMinutes(p?.minutesSpent || 0)} / {formatMinutes(course.estimatedMinutes)}
                  </span>
                </div>
                <div style={{
                  height: 6,
                  background: '#E2E8F0',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: status === 'completed' ? '#10B981' : '#3B82F6',
                    borderRadius: 3,
                    transition: 'width 0.3s ease-out'
                  }} />
                </div>
              </div>

              {p && p.testScore > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#64748B'
                }}>
                  <span>测试分数:</span>
                  <span style={{
                    fontWeight: 600,
                    color: p.testScore >= 80 ? '#10B981' : p.testScore >= 60 ? '#F59E0B' : '#EF4444'
                  }}>
                    {p.testScore}分
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .course-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
        }
      `}</style>
    </div>
  );
}
