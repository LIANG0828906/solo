import { useMemo } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  Award,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import type { Course, CourseProgress } from './types';

interface Props {
  courses: Course[];
  progress: CourseProgress[];
  onEnterCourse: (courseId: string) => void;
  onRefresh: () => void;
}

function formatTime(ts: number): string {
  if (!ts) return '未开始学习';
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function LearningDashboard({
  courses,
  progress,
  onEnterCourse,
  onRefresh,
}: Props) {
  const enriched = useMemo(() => {
    return courses
      .map(course => {
        const p = progress.find(x => x.courseId === course.id);
        const totalLessons = course.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
        const completed = p
          ? p.lessons.filter(l => l.completed).length
          : 0;
        const percent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
        const progClass =
          percent < 40 ? 'progress-low' : percent < 80 ? 'progress-mid' : 'progress-high';
        return {
          course,
          progress: p,
          totalLessons,
          completed,
          percent,
          progClass,
          lastTime: p?.lastStudyTime || 0,
        };
      })
      .sort((a, b) => {
        if (b.lastTime !== a.lastTime) return b.lastTime - a.lastTime;
        return b.course.updatedAt - a.course.updatedAt;
      });
  }, [courses, progress]);

  const totalStats = useMemo(() => {
    const totalCourses = courses.length;
    const totalLessons = courses.reduce(
      (s, c) => s + c.chapters.reduce((a, ch) => a + ch.lessons.length, 0),
      0
    );
    const completedCourses = progress.filter(p => p.completed).length;
    const learnedLessons = progress.reduce(
      (s, p) => s + p.lessons.filter(l => l.completed).length,
      0
    );
    return { totalCourses, totalLessons, completedCourses, learnedLessons };
  }, [courses, progress]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 16 }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={22} style={{ color: '#00d2ff' }} />
          <h2 className="text-xl font-bold" style={{ color: '#fff' }}>
            学习看板
          </h2>
        </div>
        <button
          className="secondary-btn flex items-center gap-2"
          onClick={onRefresh}
        >
          <RefreshCw size={16} />
          刷新数据
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
        className="mb-2"
      >
        <div className="glass-panel p-4 flex items-center gap-3">
          <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 210, 255, 0.15)',
        }}
      >
          <BookOpen size={24} style={{ color: '#00d2ff' }} />
        </div>
        <div>
          <div
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            总课程数
          </div>
          <div className="text-2xl font-bold" style={{ color: '#fff' }}>
            {totalStats.totalCourses}
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 flex items-center gap-3">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 169, 77, 0.15)',
          }}
        >
          <Clock size={24} style={{ color: '#ffa94d' }} />
        </div>
        <div>
          <div
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            总课时数
          </div>
          <div className="text-2xl font-bold" style={{ color: '#fff' }}>
            {totalStats.totalLessons}
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 flex items-center gap-3">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(80, 255, 122, 0.15)',
          }}
        >
          <CheckCircle2 size={24} style={{ color: '#50ff7a' }} />
        </div>
        <div>
          <div
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            已完成课程
          </div>
          <div className="text-2xl font-bold" style={{ color: '#fff' }}>
            {totalStats.completedCourses}
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 flex items-center gap-3">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 107, 157, 0.15)',
          }}
        >
          <Award size={24} style={{ color: '#ff6b9d' }} />
        </div>
        <div>
          <div
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            已学课时
          </div>
          <div className="text-2xl font-bold" style={{ color: '#fff' }}>
            {totalStats.learnedLessons}
          </div>
        </div>
      </div>
    </div>

      </div>

      {enriched.length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <BookOpen size={48} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            暂无课程，请先在课程编辑器创建课程
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {enriched.map(item => (
            <div
              key={item.course.id}
              className="course-card"
              onClick={() => onEnterCourse(item.course.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(0, 210, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                      <BookOpen size={20} style={{ color: '#00d2ff' }} />
                    </div>
                  <div className="min-w-0">
                    <h3
                      className="font-bold truncate"
                      style={{ color: '#fff', fontSize: 16 }}
                      title={item.course.title}
                    >
                      {item.course.title}
                    </h3>
                    <div
                      className="text-xs truncate"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      title={item.course.description}
                    >
                      {item.course.description || '暂无描述'}
                    </div>
                  </div>
                </div>
                {item.progress?.completed && (
                  <div
                    style={{
                      padding: '4px 8px',
                      borderRadius: 12,
                      background: 'rgba(80, 255, 122, 0.15)',
                      flexShrink: 0,
                    }}
                  >
                    <Award
                      size={14}
                      style={{ color: '#50ff7a' }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div
                    className="text-xs"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    学习进度
                  </div>
                  <div
                    className="flex items-center gap-1 text-xs font-bold"
                    style={{ color: '#00d2ff' }}
                  >
                    <span
                    style={{ color: '#e0e0e0' }}
                  >
                    {item.completed}/{item.totalLessons}
                  </span>
                    <span
                      className="text-xs"
                      style={{
                        color:
                          item.percent < 40
                            ? '#ff9a5c'
                            : item.percent < 80
                            ? '#c0ff5c'
                            : '#50ff7a',
                      }}
                    >
                      {item.percent}%
                    </span>
                  </div>
                </div>
                <div className="progress-bar-wrap">
                  <div
                    className={`progress-bar-fill ${item.progClass}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>

              <div
                className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  <Clock size={12} />
                  {formatTime(item.lastTime)}
                </div>
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: '#00d2ff', fontWeight: 500 }}
                >
                  <Play size={12} />
                  {item.percent >= 100 ? '复习课程' : item.percent > 0 ? '继续学习' : '开始学习'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
