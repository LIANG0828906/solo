import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from './store';
import type { Project, Task, Milestone, TaskPriority } from '../shared/types';

interface GanttChartProps {
  project: Project;
}

const TASK_HEIGHT = 36;
const TASK_GAP = 12;
const TIMELINE_HEIGHT = 60;
const ROW_HEADER_WIDTH = 160;
const PIXELS_PER_DAY = 20;
const MILESTONE_ROW_HEIGHT = 40;

function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getWeeksInRange(startDate: Date, endDate: Date): Date[] {
  const weeks: Date[] = [];
  const firstDay = new Date(startDate);
  const dayOfWeek = firstDay.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  firstDay.setDate(firstDay.getDate() + diffToMonday);

  let current = new Date(firstDay);
  while (current <= endDate) {
    weeks.push(new Date(current));
    current = addDays(current, 7);
  }
  return weeks;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'todo': return '#bdbdbd';
    case 'in-progress': return '#42a5f5';
    case 'completed': return '#66bb6a';
    default: return '#bdbdbd';
  }
}

function PriorityIcon({ priority }: { priority: TaskPriority }) {
  switch (priority) {
    case 'high':
      return <span className="priority-icon high" title="高优先级">!</span>;
    case 'medium':
      return <span className="priority-icon medium" title="中优先级">▲</span>;
    case 'low':
      return <span className="priority-icon low" title="低优先级">●</span>;
  }
}

function GanttChart({ project }: GanttChartProps) {
  const {
    tasks,
    milestones,
    selectedTaskId,
    dependencyMode,
    firstDependencyTaskId,
    highlightedTaskId,
    updateTask,
    addDependency,
    setSelectedTask,
    setDependencyMode,
    setFirstDependencyTask,
    setHighlightedTask
  } = useStore();

  const ganttRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    taskId: string;
    type: 'start' | 'end' | 'move';
    startX: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ startDate: Date; endDate: Date } | null>(null);

  const { startDate, endDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: addDays(today, 30),
        totalDays: 30
      };
    }

    let minDate = parseDate(tasks[0].startDate);
    let maxDate = parseDate(tasks[0].endDate);

    tasks.forEach(task => {
      const start = parseDate(task.startDate);
      const end = parseDate(task.endDate);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    });

    milestones.forEach(m => {
      const date = parseDate(m.date);
      if (date < minDate) minDate = date;
      if (date > maxDate) maxDate = date;
    });

    minDate = addDays(minDate, -7);
    maxDate = addDays(maxDate, 7);

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: diffDays(minDate, maxDate)
    };
  }, [tasks, milestones]);

  const weeks = useMemo(() => getWeeksInRange(startDate, endDate), [startDate, endDate]);
  const chartWidth = totalDays * PIXELS_PER_DAY;
  const chartHeight = MILESTONE_ROW_HEIGHT + tasks.length * (TASK_HEIGHT + TASK_GAP) + 40;

  const getXForDate = useCallback((date: Date): number => {
    return diffDays(startDate, date) * PIXELS_PER_DAY;
  }, [startDate]);

  const getDateFromX = useCallback((x: number): Date => {
    const days = Math.round(x / PIXELS_PER_DAY);
    return addDays(startDate, days);
  }, [startDate]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aStart = parseDate(a.startDate).getTime();
      const bStart = parseDate(b.startDate).getTime();
      return aStart - bStart;
    });
  }, [tasks]);

  const handleMouseDown = (e: React.MouseEvent, taskId: string, type: 'start' | 'end' | 'move') => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setDragging({
      taskId,
      type,
      startX: e.clientX,
      originalStart: parseDate(task.startDate),
      originalEnd: parseDate(task.endDate)
    });
    setDragPreview({
      startDate: parseDate(task.startDate),
      endDate: parseDate(task.endDate)
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !dragPreview) return;

    const deltaX = e.clientX - dragging.startX;
    const deltaDays = Math.round(deltaX / PIXELS_PER_DAY);

    let newStart = new Date(dragging.originalStart);
    let newEnd = new Date(dragging.originalEnd);

    if (dragging.type === 'start') {
      newStart = addDays(dragging.originalStart, deltaDays);
      if (newStart >= newEnd) {
        newStart = addDays(newEnd, -1);
      }
    } else if (dragging.type === 'end') {
      newEnd = addDays(dragging.originalEnd, deltaDays);
      if (newEnd <= newStart) {
        newEnd = addDays(newStart, 1);
      }
    } else if (dragging.type === 'move') {
      const duration = diffDays(dragging.originalStart, dragging.originalEnd);
      newStart = addDays(dragging.originalStart, deltaDays);
      newEnd = addDays(newStart, duration);
    }

    setDragPreview({ startDate: newStart, endDate: newEnd });
  }, [dragging, dragPreview]);

  const handleMouseUp = useCallback(async () => {
    if (!dragging || !dragPreview) {
      setDragging(null);
      setDragPreview(null);
      return;
    }

    const task = tasks.find(t => t.id === dragging.taskId);
    if (task) {
      const hasUncompletedDep = task.dependencies.some(depId => {
        const dep = tasks.find(t => t.id === depId);
        return dep && dep.status !== 'completed';
      });

      if (hasUncompletedDep && dragging.type !== 'start') {
        const affectedMilestones = milestones.filter(m =>
          m.taskIds.includes(task.id) && !m.completed
        );

        let message = '该任务有未完成的依赖任务，调整排期可能会影响后续进度。';
        if (affectedMilestones.length > 0) {
          message += `\n\n受影响的里程碑：${affectedMilestones.map(m => m.name).join('、')}`;
        }
        message += '\n\n确定要调整吗？';

        if (!window.confirm(message)) {
          setDragging(null);
          setDragPreview(null);
          return;
        }
      }

      await updateTask(dragging.taskId, {
        startDate: formatDate(dragPreview.startDate),
        endDate: formatDate(dragPreview.endDate)
      });
    }

    setDragging(null);
    setDragPreview(null);
  }, [dragging, dragPreview, tasks, milestones, updateTask]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTaskClick = (taskId: string) => {
    if (dependencyMode) {
      if (firstDependencyTaskId === null) {
        setFirstDependencyTask(taskId);
      } else if (firstDependencyTaskId !== taskId) {
        const firstTask = tasks.find(t => t.id === firstDependencyTaskId);
        const secondTask = tasks.find(t => t.id === taskId);
        if (firstTask && secondTask) {
          const firstStart = parseDate(firstTask.startDate).getTime();
          const secondStart = parseDate(secondTask.startDate).getTime();
          if (firstStart < secondStart) {
            addDependency(taskId, firstDependencyTaskId);
          } else {
            addDependency(firstDependencyTaskId, taskId);
          }
        }
        setDependencyMode(false);
        setFirstDependencyTask(null);
      }
    } else {
      setSelectedTask(selectedTaskId === taskId ? null : taskId);
    }
  };

  const renderDependencies = () => {
    const arrows: JSX.Element[] = [];

    sortedTasks.forEach((task, taskIndex) => {
      const taskY = MILESTONE_ROW_HEIGHT + taskIndex * (TASK_HEIGHT + TASK_GAP) + TASK_HEIGHT / 2;

      task.dependencies.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        const depIndex = sortedTasks.findIndex(t => t.id === depId);
        if (!depTask || depIndex === -1) return;

        const depY = MILESTONE_ROW_HEIGHT + depIndex * (TASK_HEIGHT + TASK_GAP) + TASK_HEIGHT / 2;
        const startX = getXForDate(parseDate(depTask.endDate));
        const endX = getXForDate(parseDate(task.startDate));

        const midX = (startX + endX) / 2;

        const pathD = `M ${startX} ${depY} 
                      L ${midX - 5} ${depY}
                      L ${midX} ${depY + 5}
                      L ${midX} ${taskY - 5}
                      L ${midX + 5} ${taskY}
                      L ${endX - 8} ${taskY}`;

        arrows.push(
          <g key={`dep-${depId}-${task.id}`}>
            <path
              d={pathD}
              fill="none"
              stroke="#666"
              strokeWidth="1.5"
            />
            <polygon
              points={`${endX},${taskY} ${endX - 8},${taskY - 4} ${endX - 8},${taskY + 4}`}
              fill="#666"
            />
          </g>
        );
      });
    });

    return arrows;
  };

  const renderMilestones = () => {
    return milestones.map(milestone => {
      const x = getXForDate(parseDate(milestone.date));
      const isCompleted = milestone.taskIds.every(taskId => {
        const task = tasks.find(t => t.id === taskId);
        return task && task.status === 'completed';
      });

      return (
        <g key={milestone.id} className={`milestone ${isCompleted ? 'completed' : ''}`}>
          <polygon
            points={`${x},10 ${x + 12},25 ${x},40 ${x - 12},25`}
            fill={isCompleted ? '#ffb300' : 'transparent'}
            stroke={isCompleted ? '#ffb300' : '#888'}
            strokeWidth="2"
            opacity={isCompleted ? 1 : 0.5}
          >
            {isCompleted && (
              <animate attributeName="transform" type="scale" values="1;1.3;1" dur="1s" repeatCount="1" />
            )}
          </polygon>
          <text
            x={x}
            y="55"
            textAnchor="middle"
            fill={isCompleted ? '#ffb300' : '#888'}
            fontSize="11"
            opacity={isCompleted ? 1 : 0.6}
          >
            {milestone.name}
          </text>
        </g>
      );
    });
  };

  const renderTasks = () => {
    return sortedTasks.map((task, index) => {
      const y = MILESTONE_ROW_HEIGHT + index * (TASK_HEIGHT + TASK_GAP);
      const taskStart = dragPreview && dragging?.taskId === task.id
        ? dragPreview.startDate
        : parseDate(task.startDate);
      const taskEnd = dragPreview && dragging?.taskId === task.id
        ? dragPreview.endDate
        : parseDate(task.endDate);
      const x = getXForDate(taskStart);
      const width = Math.max(diffDays(taskStart, taskEnd) * PIXELS_PER_DAY, 10);
      const isHighlighted = highlightedTaskId === task.id || selectedTaskId === task.id;
      const isDragging = dragging?.taskId === task.id;
      const isFirstDep = firstDependencyTaskId === task.id;

      return (
        <g
          key={task.id}
          className={`task-row ${isHighlighted ? 'highlighted' : ''} ${isDragging ? 'dragging' : ''} ${isFirstDep ? 'selected-dep' : ''}`}
          onClick={() => handleTaskClick(task.id)}
          style={{ cursor: dependencyMode ? 'pointer' : 'default' }}
        >
          <rect
            x={x}
            y={y}
            width={width}
            height={TASK_HEIGHT}
            rx="4"
            fill={getStatusColor(task.status)}
            opacity={isDragging ? 0.5 : 1}
            style={{ transition: isDragging ? 'none' : 'all 0.5s ease-in-out' }}
          />
          
          {!dependencyMode && (
            <>
              <rect
                x={x - 3}
                y={y}
                width="6"
                height={TASK_HEIGHT}
                rx="2"
                fill="rgba(255,255,255,0.3)"
                className="resize-handle resize-start"
                onMouseDown={(e) => handleMouseDown(e, task.id, 'start')}
                style={{ cursor: 'ew-resize' }}
              />
              <rect
                x={x + width - 3}
                y={y}
                width="6"
                height={TASK_HEIGHT}
                rx="2"
                fill="rgba(255,255,255,0.3)"
                className="resize-handle resize-end"
                onMouseDown={(e) => handleMouseDown(e, task.id, 'end')}
                style={{ cursor: 'ew-resize' }}
              />
              <rect
                x={x}
                y={y}
                width={width}
                height={TASK_HEIGHT}
                fill="transparent"
                className="move-handle"
                onMouseDown={(e) => handleMouseDown(e, task.id, 'move')}
                style={{ cursor: 'grab' }}
              />
            </>
          )}

          <text
            x={x + 8}
            y={y + TASK_HEIGHT / 2 + 4}
            fill="#fff"
            fontSize="12"
            fontWeight="500"
            className="task-name"
          >
            {task.name}
          </text>

          {isHighlighted && (
            <rect
              x={x - 2}
              y={y - 2}
              width={width + 4}
              height={TASK_HEIGHT + 4}
              rx="6"
              fill="none"
              stroke="#ffb300"
              strokeWidth="2"
              strokeDasharray="4,2"
            />
          )}
        </g>
      );
    });
  };

  const renderTimeline = () => {
    return (
      <g className="timeline">
        {weeks.map((week, index) => {
          const x = getXForDate(week);
          return (
            <g key={index}>
              <line
                x1={x}
                y1={0}
                x2={x}
                y2={chartHeight}
                stroke="#333"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.5"
              />
              <text
                x={x + 4}
                y="20"
                fill="#888"
                fontSize="11"
              >
                {week.getMonth() + 1}月{week.getDate()}日
              </text>
              <text
                x={x + 4}
                y="38"
                fill="#666"
                fontSize="10"
              >
                第{Math.ceil((week.getDate() - 1) / 7) + 1}周
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const incompleteTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <div className="gantt-container">
      <div className="gantt-main">
        <div className="gantt-header">
          <h2>{project.name}</h2>
          <div className="gantt-actions">
            <button
              className={`btn ${dependencyMode ? 'btn-warning' : 'btn-secondary'}`}
              onClick={() => setDependencyMode(!dependencyMode)}
            >
              {dependencyMode ? '取消关联' : '添加依赖'}
            </button>
            <button className="btn btn-primary">+ 新建任务</button>
          </div>
        </div>

        <div className="gantt-content">
          <div className="task-sidebar">
            <div className="sidebar-header" style={{ height: MILESTONE_ROW_HEIGHT }}>
              任务列表
            </div>
            {sortedTasks.map((task, index) => (
              <div
                key={task.id}
                className={`task-sidebar-item ${
                  highlightedTaskId === task.id ? 'highlighted' : ''
                } ${selectedTaskId === task.id ? 'selected' : ''} ${
                  firstDependencyTaskId === task.id ? 'dep-selected' : ''
                }`}
                style={{ height: TASK_HEIGHT + TASK_GAP, paddingTop: TASK_GAP / 2 }}
                onClick={() => {
                  setHighlightedTask(highlightedTaskId === task.id ? null : task.id);
                }}
              >
                <div className="sidebar-task-info">
                  <PriorityIcon priority={task.priority} />
                  <span className="sidebar-task-name">{task.name}</span>
                </div>
                <span className="sidebar-task-assignee">{task.assigneeName}</span>
              </div>
            ))}
          </div>

          <div className="gantt-chart-wrapper" ref={ganttRef}>
            <svg
              width={chartWidth}
              height={chartHeight}
              className="gantt-svg"
            >
              {renderTimeline()}
              {renderMilestones()}
              {renderDependencies()}
              {renderTasks()}
            </svg>
          </div>
        </div>
      </div>

      <div className="task-panel">
        <div className="panel-header">
          <h3>待办任务</h3>
          <span className="task-count">{incompleteTasks.length}项</span>
        </div>
        <div className="task-list">
          {incompleteTasks.map(task => (
            <div
              key={task.id}
              className={`task-card ${
                selectedTaskId === task.id ? 'selected' : ''
              } ${firstDependencyTaskId === task.id ? 'dep-first' : ''}`}
              onClick={() => handleTaskClick(task.id)}
              onMouseEnter={() => setHighlightedTask(task.id)}
              onMouseLeave={() => setHighlightedTask(null)}
            >
              <div className="task-card-header">
                <PriorityIcon priority={task.priority} />
                <span className="task-card-name">{task.name}</span>
              </div>
              <div className="task-card-footer">
                <span className="task-status-badge">
                  {task.status === 'todo' ? '待办' :
                   task.status === 'in-progress' ? '进行中' : '已完成'}
                </span>
                <span className="task-assignee-tag">{task.assigneeName}</span>
              </div>
            </div>
          ))}
        </div>

        {dependencyMode && (
          <div className="dependency-hint">
            💡 点击两个任务建立依赖关系
            {firstDependencyTaskId && (
              <p className="dep-hint-text">
                已选择第一个任务，再点击一个任务完成关联
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GanttChart;
