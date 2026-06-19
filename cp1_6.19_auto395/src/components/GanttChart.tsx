import { useRef, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Task, Milestone } from '../types';

const GanttChart = () => {
  const {
    tasks,
    milestones,
    dependencies,
    zoomLevel,
    updateTask,
    setSelectedTaskId,
    setIsTaskModalOpen,
    setSelectedMilestoneId,
    setIsMilestoneModalOpen,
    dependencyStartTaskId,
    setDependencyStartTaskId,
    addDependency,
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragTaskData, setDragTaskData] = useState<{ startDate: string; endDate: string } | null>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  const cellWidth = 60 * zoomLevel;
  const rowHeight = 48;
  const taskRowHeight = 36;
  const headerHeight = 44;
  const milestoneHeight = 56;
  const taskLabelWidth = 140;

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const { startDate, endDate, totalDays, dates } = useMemo(() => {
    const allDates: string[] = [];
    tasks.forEach((task) => {
      allDates.push(task.startDate, task.endDate);
    });
    milestones.forEach((m) => {
      allDates.push(m.date);
    });
    allDates.push(today);

    if (allDates.length === 0) {
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 7);
      const defaultEnd = new Date();
      defaultEnd.setDate(defaultEnd.getDate() + 14);
      allDates.push(defaultStart.toISOString().split('T')[0]);
      allDates.push(defaultEnd.toISOString().split('T')[0]);
    }

    const sortedDates = allDates.sort();
    const start = new Date(sortedDates[0]);
    start.setDate(start.getDate() - 2);
    const end = new Date(sortedDates[sortedDates.length - 1]);
    end.setDate(end.getDate() + 5);

    const days: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const total = days.length;
    return { startDate: start, endDate: end, totalDays: total, dates: days };
  }, [tasks, milestones, today]);

  const getDateOffset = (dateStr: string): number => {
    const date = new Date(dateStr);
    const diff = date.getTime() - startDate.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24)) * cellWidth;
  };

  const getTaskWidth = (task: Task): number => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
    return days * cellWidth;
  };

  const handleTaskMouseDown = (e: React.MouseEvent, task: Task, type: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(task.id);
    setDragType(type);
    setDragStartX(e.clientX);
    setDragTaskData({ startDate: task.startDate, endDate: task.endDate });
  };

  useEffect(() => {
    if (!dragging || !dragTaskData) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diffX = e.clientX - dragStartX;
      const diffDays = Math.round(diffX / cellWidth);

      if (diffDays === 0) return;

      const task = tasks.find((t) => t.id === dragging);
      if (!task) return;

      let newStart = new Date(dragTaskData.startDate);
      let newEnd = new Date(dragTaskData.endDate);

      if (dragType === 'move') {
        newStart.setDate(newStart.getDate() + diffDays);
        newEnd.setDate(newEnd.getDate() + diffDays);
      } else if (dragType === 'resize-start') {
        newStart.setDate(newStart.getDate() + diffDays);
        if (newStart >= newEnd) {
          newStart = new Date(newEnd);
          newStart.setDate(newStart.getDate() - 1);
        }
      } else if (dragType === 'resize-end') {
        newEnd.setDate(newEnd.getDate() + diffDays);
        if (newEnd <= newStart) {
          newEnd = new Date(newStart);
          newEnd.setDate(newEnd.getDate() + 1);
        }
      }

      updateTask(task.id, {
        startDate: newStart.toISOString().split('T')[0],
        endDate: newEnd.toISOString().split('T')[0],
      });
    };

    const handleMouseUp = () => {
      setDragging(null);
      setDragType(null);
      setDragTaskData(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragType, dragStartX, dragTaskData, tasks, updateTask, cellWidth]);

  const handleTaskClick = (taskId: string) => {
    if (!dragging) {
      setSelectedTaskId(taskId);
      setIsTaskModalOpen(true);
    }
  };

  const handleTaskContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    if (dependencyStartTaskId === null) {
      setDependencyStartTaskId(taskId);
    } else if (dependencyStartTaskId !== taskId) {
      addDependency(dependencyStartTaskId, taskId);
    } else {
      setDependencyStartTaskId(null);
    }
  };

  const handleMilestoneClick = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
    setIsMilestoneModalOpen(true);
  };

  const isOverdue = (task: Task): boolean => {
    if (task.status === 'done') return false;
    return new Date(task.endDate) < new Date(today);
  };

  const getTaskColor = (task: Task): string => {
    if (task.status === 'done') return '#4CAF50';
    if (isOverdue(task)) return '#F44336';
    return '#2196F3';
  };

  const renderDependencyLines = () => {
    return dependencies.map((dep) => {
      const fromTask = tasks.find((t) => t.id === dep.fromTaskId);
      const toTask = tasks.find((t) => t.id === dep.toTaskId);
      if (!fromTask || !toTask) return null;

      const fromIndex = tasks.findIndex((t) => t.id === dep.fromTaskId);
      const toIndex = tasks.findIndex((t) => t.id === dep.toTaskId);

      const fromX = taskLabelWidth + getDateOffset(fromTask.endDate) + cellWidth;
      const fromY = headerHeight + milestoneHeight + fromIndex * rowHeight + taskRowHeight / 2;
      const toX = taskLabelWidth + getDateOffset(toTask.startDate);
      const toY = headerHeight + milestoneHeight + toIndex * rowHeight + taskRowHeight / 2;

      const midX = (fromX + toX) / 2;

      const pathD = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

      return (
        <path
          key={dep.id}
          d={pathD}
          stroke="#F44336"
          strokeWidth="2"
          strokeDasharray="6,4"
          fill="none"
        />
      );
    });
  };

  const isDependentOn = (taskId: string): boolean => {
    return dependencies.some((d) => d.toTaskId === taskId);
  };

  const allDependenciesDone = (task: Task): boolean => {
    const taskDeps = dependencies.filter((d) => d.toTaskId === task.id);
    if (taskDeps.length === 0) return true;
    return taskDeps.every((d) => {
      const fromTask = tasks.find((t) => t.id === d.fromTaskId);
      return fromTask && fromTask.status === 'done';
    });
  };

  const totalWidth = taskLabelWidth + totalDays * cellWidth;
  const totalHeight = Math.max(
    containerHeight,
    headerHeight + milestoneHeight + tasks.length * rowHeight + 20
  );

  const todayIndex = dates.findIndex((d) => d === today);

  useEffect(() => {
    if (scrollRef.current && todayIndex >= 0) {
      const scrollPosition = taskLabelWidth + todayIndex * cellWidth - 200;
      scrollRef.current.scrollLeft = Math.max(0, scrollPosition);
    }
  }, [todayIndex, cellWidth]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E0E0E0',
        position: 'relative',
      }}
    >
      {dependencyStartTaskId && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '16px',
            padding: '6px 12px',
            backgroundColor: '#FFF3E0',
            border: '1px solid #FF9800',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#E65100',
            zIndex: 10,
          }}
        >
          右键点击另一个任务创建依赖（再次右键取消）
        </div>
      )}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <svg
          width={totalWidth}
          height={totalHeight}
          style={{ display: 'block', minWidth: '100%' }}
        >
          <defs>
            <linearGradient id="taskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
            </linearGradient>
          </defs>

          {dates.map((date, index) => {
            const isToday = date === today;
            const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
            return (
              <g key={date}>
                <rect
                  x={taskLabelWidth + index * cellWidth}
                  y={0}
                  width={cellWidth}
                  height={totalHeight}
                  fill={isToday ? '#E3F2FD' : (isWeekend ? '#FAFAFA' : (index % 2 === 0 ? '#FFFFFF' : '#F9F9F9'))}
                />
                <line
                  x1={taskLabelWidth + index * cellWidth}
                  y1={0}
                  x2={taskLabelWidth + index * cellWidth}
                  y2={totalHeight}
                  stroke="#E8E8E8"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          <rect
            x={0}
            y={0}
            width={taskLabelWidth}
            height={totalHeight}
            fill="#FFFFFF"
          />
          <line
            x1={taskLabelWidth}
            y1={0}
            x2={taskLabelWidth}
            y2={totalHeight}
            stroke="#E0E0E0"
            strokeWidth="1"
          />

          {dates.map((date, index) => {
            const dayOfMonth = new Date(date).getDate();
            const month = new Date(date).getMonth() + 1;
            const isFirstOfMonth = dayOfMonth === 1;
            return (
              <g key={`header-${date}`}>
                {isFirstOfMonth && (
                  <text
                    x={taskLabelWidth + index * cellWidth + cellWidth / 2}
                    y={18}
                    textAnchor="middle"
                    fontSize="11px"
                    fill="#999"
                    fontWeight="500"
                  >
                    {month}月
                  </text>
                )}
                <text
                  x={taskLabelWidth + index * cellWidth + cellWidth / 2}
                  y={36}
                  textAnchor="middle"
                  fontSize="12px"
                  fill={date === today ? '#1976D2' : '#666'}
                  fontWeight={date === today ? 'bold' : 'normal'}
                >
                  {dayOfMonth}
                </text>
              </g>
            );
          })}

          <line
            x1={0}
            y1={headerHeight}
            x2={totalWidth}
            y2={headerHeight}
            stroke="#E0E0E0"
            strokeWidth="1"
          />

          {milestones.map((milestone) => {
            const x = taskLabelWidth + getDateOffset(milestone.date) + cellWidth / 2;
            const y = headerHeight + 30;
            return (
              <g
                key={milestone.id}
                onClick={() => handleMilestoneClick(milestone.id)}
                style={{ cursor: 'pointer' }}
              >
                <polygon
                  points={`${x},${y - 12} ${x + 12},${y} ${x},${y + 12} ${x - 12},${y}`}
                  fill="#FF9800"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize="10px"
                  fill="white"
                  fontWeight="bold"
                >
                  ★
                </text>
                <text
                  x={x}
                  y={y + 28}
                  textAnchor="middle"
                  fontSize="11px"
                  fill="#FF9800"
                  fontWeight="500"
                >
                  {milestone.name}
                </text>
              </g>
            );
          })}

          {renderDependencyLines()}

          {tasks.map((task, index) => {
            const taskX = taskLabelWidth + getDateOffset(task.startDate);
            const taskY = headerHeight + milestoneHeight + index * rowHeight + (rowHeight - taskRowHeight) / 2;
            const taskWidth = getTaskWidth(task);
            const color = getTaskColor(task);
            const hasDependency = isDependentOn(task.id);
            const depsDone = allDependenciesDone(task);
            const isBeingDragged = dragging === task.id;
            const isDepStart = dependencyStartTaskId === task.id;

            return (
              <g key={task.id}>
                <rect
                  x={0}
                  y={headerHeight + milestoneHeight + index * rowHeight}
                  width={taskLabelWidth}
                  height={rowHeight}
                  fill={index % 2 === 0 ? '#FAFAFA' : '#FFFFFF'}
                />

                <text
                  x={12}
                  y={headerHeight + milestoneHeight + index * rowHeight + rowHeight / 2 + 4}
                  fontSize="13px"
                  fill="#333"
                  style={{ userSelect: 'none' }}
                >
                  {task.title.length > 12 ? task.title.slice(0, 12) + '...' : task.title}
                </text>

                <rect
                  x={taskX}
                  y={taskY}
                  width={taskWidth}
                  height={taskRowHeight}
                  rx={6}
                  fill={color}
                  style={{
                    cursor: 'move',
                    filter: isBeingDragged ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  }}
                  stroke={isDepStart ? '#FF9800' : 'transparent'}
                  strokeWidth={isDepStart ? 3 : 0}
                  onMouseDown={(e) => handleTaskMouseDown(e as any, task, 'move')}
                  onClick={() => handleTaskClick(task.id)}
                  onContextMenu={(e) => handleTaskContextMenu(e as any, task.id)}
                />

                <rect
                  x={taskX}
                  y={taskY}
                  width={taskWidth * (task.progress / 100)}
                  height={taskRowHeight}
                  rx={6}
                  fill="rgba(255,255,255,0.2)"
                  style={{ pointerEvents: 'none' }}
                />

                <rect
                  x={taskX}
                  y={taskY}
                  width={6}
                  height={taskRowHeight}
                  rx="6 0 0 6"
                  fill="rgba(0,0,0,0.15)"
                  style={{ cursor: 'ew-resize' }}
                  onMouseDown={(e) => handleTaskMouseDown(e as any, task, 'resize-start')}
                  onClick={(e) => e.stopPropagation()}
                />

                <rect
                  x={taskX + taskWidth - 6}
                  y={taskY}
                  width={6}
                  height={taskRowHeight}
                  rx="0 6 6 0"
                  fill="rgba(0,0,0,0.15)"
                  style={{ cursor: 'ew-resize' }}
                  onMouseDown={(e) => handleTaskMouseDown(e as any, task, 'resize-end')}
                  onClick={(e) => e.stopPropagation()}
                />

                <text
                  x={taskX + taskWidth / 2}
                  y={taskY + taskRowHeight / 2 + 4}
                  textAnchor="middle"
                  fontSize="12px"
                  fill="white"
                  fontWeight="500"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {task.title.length > 8 ? task.title.slice(0, 8) + '...' : task.title}
                </text>

                <g transform={`translate(${taskX + taskWidth + 6}, ${taskY + taskRowHeight / 2 - 9})`}>
                  <rect
                    x={0}
                    y={0}
                    width={36}
                    height={18}
                    rx={4}
                    fill="rgba(0,0,0,0.7)"
                  />
                  <text
                    x={18}
                    y={13}
                    textAnchor="middle"
                    fontSize="11px"
                    fill="white"
                    fontWeight="bold"
                  >
                    {task.progress}%
                  </text>
                </g>

                {hasDependency && task.status !== 'done' && (
                  <circle
                    cx={taskX + 10}
                    cy={taskY + taskRowHeight - 7}
                    r={5}
                    fill={depsDone ? '#4CAF50' : '#2196F3'}
                    stroke="white"
                    strokeWidth="1.5"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            );
          })}

          {todayIndex >= 0 && (
            <line
              x1={taskLabelWidth + todayIndex * cellWidth + cellWidth / 2}
              y1={headerHeight}
              x2={taskLabelWidth + todayIndex * cellWidth + cellWidth / 2}
              y2={totalHeight}
              stroke="#1976D2"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity={0.6}
            />
          )}
        </svg>
      </div>
    </div>
  );
};

export default GanttChart;
