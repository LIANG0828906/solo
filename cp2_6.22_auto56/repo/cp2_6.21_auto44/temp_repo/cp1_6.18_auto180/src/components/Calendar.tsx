import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Check, Clock } from 'lucide-react';
import {
  generateCalendar,
  getPrevMonth,
  getNextMonth,
  getTodayYearMonth,
  type CalendarCell,
} from '../engine/calendarEngine';
import { usePlantStore, taskColors, taskLabels } from '../stores/plantStore';
import type { TaskType } from '../stores/plantStore';
import './Calendar.css';

interface CalendarProps {
  onDateSelect?: (dateStr: string) => void;
}

export default function Calendar({ onDateSelect }: CalendarProps) {
  const today = getTodayYearMonth();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [panelTasks, setPanelTasks] = useState<CalendarCell | null>(null);
  const tasks = usePlantStore(s => s.tasks);
  const plants = usePlantStore(s => s.plants);
  const completeTask = usePlantStore(s => s.completeTask);
  const postponeTask = usePlantStore(s => s.postponeTask);
  const addTask = usePlantStore(s => s.addTask);
  const [newTaskType, setNewTaskType] = useState<TaskType>('watering');

  useEffect(() => {
    usePlantStore.getState().fetchTasks();
    usePlantStore.getState().fetchPlants();
  }, []);

  const calendar = useMemo(() => generateCalendar(year, month, tasks), [year, month, tasks]);

  const handlePrev = () => {
    const p = getPrevMonth(year, month);
    setYear(p.year);
    setMonth(p.month);
  };

  const handleNext = () => {
    const n = getNextMonth(year, month);
    setYear(n.year);
    setMonth(n.month);
  };

  const handleDateClick = (cell: CalendarCell) => {
    setSelectedDate(cell.dateStr);
    setPanelTasks(cell);
    if (onDateSelect) onDateSelect(cell.dateStr);
  };

  const closePanel = () => {
    setPanelTasks(null);
    setSelectedDate(null);
  };

  const handleAddTask = async () => {
    if (!selectedDate) return;
    await addTask({ type: newTaskType, date: selectedDate });
  };

  const taskTypes: TaskType[] = ['sowing', 'watering', 'fertilizing', 'pruning', 'repotting'];

  return (
    <div className="calendar-wrap">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={handlePrev} aria-label="上个月">
          <ChevronLeft size={20} />
        </button>
        <h2 className="calendar-title">{calendar.year}年 {calendar.monthName}</h2>
        <button className="calendar-nav-btn" onClick={handleNext} aria-label="下个月">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {calendar.weekDays.map(d => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendar.cells.map((row, ri) =>
          row.map((cell, ci) => {
            const isSelected = selectedDate === cell.dateStr;
            const pendingCount = cell.tasks.filter(t => !t.completed).length;
            return (
              <button
                key={`${ri}-${ci}`}
                className={`calendar-cell ${!cell.isCurrentMonth ? 'dim' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDateClick(cell)}
              >
                {cell.isOverdue && (
                  <AlertCircle size={16} color="#FF6B6B" className="calendar-overdue" />
                )}
                <div className="calendar-cell-dots">
                  {cell.taskTypes.slice(0, 3).map((type, i) => (
                    <span
                      key={i}
                      className="calendar-cell-dot"
                      style={{ background: taskColors[type] }}
                    />
                  ))}
                </div>
                {cell.isToday ? (
                  <span className="calendar-cell-today">{cell.day}</span>
                ) : (
                  <span className="calendar-cell-day">{cell.day}</span>
                )}
                {pendingCount > 0 && (
                  <span className="calendar-cell-badge">{pendingCount}</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {panelTasks && (
        <div className="calendar-panel-overlay" onClick={closePanel}>
          <div className="calendar-panel" onClick={e => e.stopPropagation()}>
            <div className="calendar-panel-header">
              <h3>{panelTasks.dateStr} 的任务</h3>
              <button className="calendar-panel-close" onClick={closePanel}>×</button>
            </div>
            <div className="calendar-panel-tasks">
              {panelTasks.tasks.length === 0 ? (
                <p className="calendar-panel-empty">暂无任务</p>
              ) : (
                panelTasks.tasks.map(task => {
                  const plant = plants.find(p => p.id === task.plantId);
                  return (
                    <div key={task.id} className={`task-item ${task.completed ? 'done' : ''}`}>
                      <span className="task-type-dot" style={{ background: taskColors[task.type] }} />
                      <div className="task-info">
                        <div className="task-title">
                          {taskLabels[task.type]}
                          {plant && <span className="task-plant"> · {plant.name}</span>}
                        </div>
                        {task.completed && task.completedAt && (
                          <div className="task-meta">
                            <Check size={12} /> 已完成
                          </div>
                        )}
                      </div>
                      {!task.completed && (
                        <div className="task-actions">
                          <button
                            className="task-action-btn done"
                            onClick={() => completeTask(task.id)}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="task-action-btn postpone"
                            onClick={() => postponeTask(task.id)}
                          >
                            <Clock size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="calendar-panel-add">
              <select
                className="task-type-select"
                value={newTaskType}
                onChange={e => setNewTaskType(e.target.value as TaskType)}
              >
                {taskTypes.map(t => (
                  <option key={t} value={t}>{taskLabels[t]}</option>
                ))}
              </select>
              <button className="task-add-btn" onClick={handleAddTask}>添加任务</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
