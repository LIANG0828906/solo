import type { RecommendedCourse, UserProgress } from '../../../shared/types';

interface LearningPathProps {
  recommendations: RecommendedCourse[];
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

export default function LearningPath({ recommendations, progress, onCourseClick }: LearningPathProps) {
  const getProgressForCourse = (courseId: string) => {
    return progress.find(p => p.courseId === courseId);
  };

  const getProgressPercent = (courseId: string, estimatedMinutes: number) => {
    const p = getProgressForCourse(courseId);
    if (!p || estimatedMinutes === 0) return 0;
    return Math.min(Math.round((p.minutesSpent / estimatedMinutes) * 100), 100);
  };

  if (recommendations.length === 0) {
    return (
      <div style={{
        background: '#FFFFFF',
        padding: 48,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        textAlign: 'center',
        color: '#64748B'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <p>暂无推荐课程，请先完成更多前置课程</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1E293B' }}>智能推荐学习路径</h2>
        <span style={{ fontSize: 14, color: '#64748B' }}>
          基于你的学习进度和知识图谱生成
        </span>
      </div>

      {recommendations.map((rec, index) => {
        const p = getProgressForCourse(rec.course.id);
        const status = p?.status || 'not_started';
        const progressPercent = getProgressPercent(rec.course.id, rec.course.estimatedMinutes);
        const confidenceColor = rec.confidence >= 80 ? '#10B981' : rec.confidence >= 60 ? '#3B82F6' : '#F59E0B';

        return (
          <div
            key={rec.course.id}
            className="rec-card"
            onClick={() => onCourseClick(rec.course.id)}
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
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, #3B82F6 0%, #10B981 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4
                  }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>
                      {rec.course.name}
                    </h3>
                    <span style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${STATUS_COLORS[status]}15`,
                      color: STATUS_COLORS[status],
                      fontWeight: 500
                    }}>
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                    {rec.reason}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `conic-gradient(${confidenceColor} ${rec.confidence}%, #E2E8F0 0%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: confidenceColor
                    }}>
                      {rec.confidence}%
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>推荐度</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                flex: 1,
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
              <span style={{ fontSize: 12, color: '#64748B', minWidth: 50, textAlign: 'right' }}>
                {progressPercent}%
              </span>
            </div>

            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap'
            }}>
              {rec.course.knowledgePoints.slice(0, 3).map(kp => (
                <span key={kp} style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 4,
                  background: '#F1F5F9',
                  color: '#64748B'
                }}>
                  {kp}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      <style>{`
        .rec-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
        }
      `}</style>
    </div>
  );
}
