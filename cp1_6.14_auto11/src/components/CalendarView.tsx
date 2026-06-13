import { useMemo } from 'react';
import type { Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const weekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, []);

  const getTasksForDate = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return tasks.filter(
      (t) => t.dueDate >= start.getTime() && t.dueDate <= end.getTime()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const typeLabels: Record<string, string> = {
    water: '💧',
    fertilize: '🌿',
    repot: '🪴',
  };

  return (
    <div className="card">
      <h2 className="section-title">📅 本周养护日历</h2>
      <div className="calendar-grid">
        {weekDays.map((date, idx) => {
          const dayTasks = getTasksForDate(date);
          const todayFlag = isToday(date);

          return (
            <div
              key={idx}
              className={`calendar-day ${todayFlag ? 'today' : ''}`}
            >
              <div className="calendar-day-header">
                {weekdayNames[idx]} {date.getDate()}日
              </div>
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`calendar-task ${task.type} ${
                    task.completed ? 'completed' : ''
                  } ${todayFlag && !task.completed ? 'today-task' : ''}`}
                  onClick={() => onTaskClick(task)}
                >
                  {typeLabels[task.type]} {task.plantName}
                </div>
              ))}
              {dayTasks.length === 0 && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#a0b0a0',
                    textAlign: 'center',
                    padding: '8px 0',
                  }}
                >
                  无任务
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
