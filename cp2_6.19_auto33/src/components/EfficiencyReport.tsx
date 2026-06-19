import { useState } from 'react';
import { useBoardStore } from '../store/boardStore';

interface DailyData {
  date: string;
  label: string;
  completedTasks: number;
  completedPomodoros: number;
  totalFocusTime: number;
  tasks: { title: string; timeSpent: number }[];
}

export default function EfficiencyReport() {
  const { getCompletedTasksByDate, getCompletedPomodorosByDate, getTotalFocusTimeByDate } = useBoardStore();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const getLast7Days = (): DailyData[] => {
    const days: DailyData[] = [];
    const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const tasks = getCompletedTasksByDate(dateStr);
      
      days.push({
        date: dateStr,
        label: i === 0 ? '今天' : dayLabels[date.getDay()],
        completedTasks: tasks.length,
        completedPomodoros: getCompletedPomodorosByDate(dateStr),
        totalFocusTime: getTotalFocusTimeByDate(dateStr),
        tasks: tasks.map((t) => ({ title: t.title, timeSpent: t.totalTimeSpent })),
      });
    }
    return days;
  };

  const weeklyData = getLast7Days();
  const maxPomodoros = Math.max(...weeklyData.map((d) => d.completedPomodoros), 1);

  const todayData = weeklyData[weeklyData.length - 1];
  const totalTasks = weeklyData.reduce((sum, d) => sum + d.completedTasks, 0);
  const totalPomodoros = weeklyData.reduce((sum, d) => sum + d.completedPomodoros, 0);
  const totalFocusTime = weeklyData.reduce((sum, d) => sum + d.totalFocusTime, 0);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  };

  return (
    <div
      style={{
        backgroundColor: '#2d3e50',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      }}
    >
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
        📊 效率报告
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
        className="report-stats"
      >
        <div
          style={{
            backgroundColor: '#1a2332',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>已完成任务</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>{todayData.completedTasks}</div>
        </div>
        <div
          style={{
            backgroundColor: '#1a2332',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>番茄钟</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{todayData.completedPomodoros}</div>
        </div>
        <div
          style={{
            backgroundColor: '#1a2332',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>专注时长</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{formatTime(todayData.totalFocusTime)}</div>
        </div>
      </div>

      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#94a3b8' }}>
        过去7天番茄钟趋势
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '200px',
          gap: '8px',
          padding: '0 8px',
          marginBottom: '8px',
        }}
      >
        {weeklyData.map((day, index) => {
          const height = maxPomodoros > 0 ? (day.completedPomodoros / maxPomodoros) * 100 : 0;
          const isHovered = hoveredDay === index;
          
          return (
            <div
              key={day.date}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                height: '100%',
                justifyContent: 'flex-end',
              }}
              onMouseEnter={() => setHoveredDay(index)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1a2332',
                    border: '1px solid #3d5166',
                    borderRadius: '8px',
                    padding: '12px',
                    minWidth: '200px',
                    zIndex: 10,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    animation: 'fadeIn 0.2s ease-in-out',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}>
                    {day.label} ({day.date})
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    已完成: {day.completedTasks} 个任务
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    番茄钟: {day.completedPomodoros} 个
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                    专注时长: {formatTime(day.totalFocusTime)}
                  </div>
                  {day.tasks.length > 0 && (
                    <div style={{ borderTop: '1px solid #3d5166', paddingTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>任务列表:</div>
                      {day.tasks.map((task, i) => (
                        <div key={i} style={{ fontSize: '11px', color: '#94a3b8' }}>
                          • {task.title} ({formatTime(task.timeSpent)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div
                style={{
                  width: '100%',
                  maxWidth: '40px',
                  height: `${height}%`,
                  minHeight: day.completedPomodoros > 0 ? '8px' : '0',
                  backgroundColor: isHovered ? '#3b82f6' : 'rgba(59, 130, 246, 0.7)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.3s ease-in-out',
                  transform: isHovered ? 'scaleX(1.1)' : 'scaleX(1)',
                  transformOrigin: 'bottom',
                  animation: 'growUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  animationDelay: `${index * 0.05}s`,
                }}
              />
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                {day.label}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                {day.completedPomodoros}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #3d5166',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#94a3b8',
        }}
        className="report-summary"
      >
        <span>本周共完成: {totalTasks} 个任务</span>
        <span>共 {totalPomodoros} 个番茄</span>
        <span>总专注 {formatTime(totalFocusTime)}</span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .report-stats {
            grid-template-columns: 1fr !important;
          }
          .report-summary {
            flex-direction: column !important;
            gap: 8px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
