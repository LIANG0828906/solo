import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  startOfMonth,
  startOfWeek,
  differenceInDays,
  parseISO,
  isSameDay,
  startOfDay,
  getDaysInMonth,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Task, Project, Resource } from '../types';
import { useAppStore } from '../store';

interface GanttChartProps {
  tasks: Task[];
  projects: Project[];
  resources: Resource[];
  onExportPng?: () => void;
}

const DAY_WIDTH_MONTH = 30;
const DAY_WIDTH_WEEK = 80;
const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 80;
const TASK_LIST_WIDTH = 220;

const colorMap: Record<string, string> = {
  'blue-200': '#bbdefb', 'blue-600': '#1e88e5',
  'green-200': '#c8e6c9', 'green-600': '#43a047',
  'purple-200': '#e1bee7', 'purple-600': '#8e24aa',
  'pink-200': '#f8bbd0', 'pink-600': '#d81b60',
  'orange-200': '#ffe0b2', 'orange-600': '#fb8c00',
  'gray-200': '#eeeeee', 'gray-600': '#757575',
};

interface TaskBarProps {
  task: Task;
  index: number;
  startX: number;
  taskWidth: number;
  isCritical: boolean;
  isDragging: boolean;
  isConnecting: boolean;
  isHovered: boolean;
  projectColor: string;
  onMouseDown: (e: React.MouseEvent, type: 'start' | 'end' | 'move') => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onConnectorClick: (e: React.MouseEvent) => void;
  getResourceName: (id: string | null) => string;
}

const TaskBar = memo(function TaskBar({
  task,
  startX,
  taskWidth,
  isCritical,
  isDragging,
  isConnecting,
  isHovered,
  projectColor,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onConnectorClick,
}: TaskBarProps) {
  const y = 8;
  const gradientId = `grad-${task.id}`;
  const [c1, c2] = projectColor.replace('from-', '').replace('to-', '').split(' ');

  return (
    <g
      transform={`translate(${startX}, ${HEADER_HEIGHT + (task ? 0 : 0)})`}
      style={{ cursor: 'move' }}
      className={isCritical ? 'critical-task' : ''}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorMap[c1] || '#bbdefb'} />
          <stop offset="100%" stopColor={colorMap[c2] || '#1e88e5'} />
        </linearGradient>
      </defs>

      {isDragging && (
        <rect
          x={-2}
          y={y - 2}
          width={taskWidth + 4}
          height={38}
          rx={8}
          fill="rgba(25, 118, 210, 0.25)"
          style={{ filter: 'blur(4px)' }}
        />
      )}

      <g transform={`translate(0, ${y})`}>
        <rect
          x={0}
          y={0}
          width={taskWidth}
          height={34}
          rx={6}
          fill={`url(#${gradientId})`}
          stroke={isCritical ? '#ffc107' : isConnecting ? '#1976d2' : 'rgba(0,0,0,0.15)'}
          strokeWidth={isCritical ? 3 : isConnecting ? 2.5 : 1.5}
          style={{
            transition: isDragging ? 'none' : 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: isHovered && !isDragging ? 'brightness(1.08) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
            transformOrigin: 'center',
          }}
          className={isCritical ? 'critical-task-rect' : ''}
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, 'move');
          }}
        />

        <rect
          x={0}
          y={0}
          width={taskWidth * (task.progress / 100)}
          height={34}
          rx={6}
          fill="rgba(0,0,0,0.2)"
          style={{ pointerEvents: 'none' }}
        />

        <text
          x={10}
          y={22}
          fill="white"
          fontSize={12}
          fontWeight="600"
          style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
        >
          {taskWidth > 80 ? task.name : task.name.slice(0, Math.floor(taskWidth / 10)) + '...'}
        </text>

        {taskWidth > 100 && (
          <text
            x={taskWidth - 10}
            y={22}
            fill="rgba(255,255,255,0.95)"
            fontSize={11}
            textAnchor="end"
            style={{ pointerEvents: 'none' }}
          >
            {task.progress}%
          </text>
        )}

        <rect
          x={-3}
          y={4}
          width={6}
          height={26}
          rx={3}
          fill="#1976d2"
          style={{
            cursor: 'ew-resize',
            opacity: isHovered || isDragging ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, 'start');
          }}
        />

        <rect
          x={taskWidth - 3}
          y={4}
          width={6}
          height={26}
          rx={3}
          fill="#1976d2"
          style={{
            cursor: 'ew-resize',
            opacity: isHovered || isDragging ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, 'end');
          }}
        />

        <circle
          cx={taskWidth + 10}
          cy={17}
          r={7}
          fill={isConnecting ? '#1976d2' : '#ffffff'}
          stroke="#1976d2"
          strokeWidth={2}
          style={{
            cursor: 'pointer',
            opacity: isHovered || isConnecting ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onConnectorClick(e);
          }}
        >
          {isConnecting && (
            <animate attributeName="r" values="7;9;7" dur="1s" repeatCount="indefinite" />
          )}
        </circle>
        <text
          x={taskWidth + 10}
          y={21}
          fill={isConnecting ? '#ffffff' : '#1976d2'}
          fontSize={12}
          fontWeight="bold"
          textAnchor="middle"
          style={{ pointerEvents: 'none', opacity: isHovered || isConnecting ? 1 : 0 }}
        >
          →
        </text>
      </g>
    </g>
  );
});

interface DependencyArrowProps {
  taskId: string;
  depId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isConflict: boolean;
  isCritical: boolean;
  isPending: boolean;
}

const DependencyArrow = memo(function DependencyArrow({
  taskId,
  depId,
  fromX,
  fromY,
  toX,
  toY,
  isConflict,
  isCritical,
  isPending,
}: DependencyArrowProps) {
  const midX = (fromX + toX) / 2;
  const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  const markerId = `arrow-${taskId}-${depId}`;
  const strokeColor = isConflict ? '#e53935' : isCritical ? '#ffc107' : '#90a4ae';

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill={strokeColor} />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isCritical ? 2.5 : 1.8}
        strokeDasharray={isPending ? '6 4' : '0'}
        markerEnd={`url(#${markerId})`}
        opacity={isConflict ? 1 : 0.7}
        style={{ transition: 'all 0.3s ease' }}
      />
    </g>
  );
});

const GanttChart: React.FC<GanttChartProps> = ({ tasks, projects, resources }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{ id: string; start: string; end: string } | null>(null);

  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const dragState = useAppStore((s) => s.dragState);
  const setDragState = useAppStore((s) => s.setDragState);
  const updateTask = useAppStore((s) => s.updateTask);
  const criticalPath = useAppStore((s) => s.criticalPath);
  const dependencyConflicts = useAppStore((s) => s.dependencyConflicts);
  const addDependency = useAppStore((s) => s.addDependency);
  const pendingDependency = useAppStore((s) => s.pendingDependency);
  const setPendingDependency = useAppStore((s) => s.setPendingDependency);
  const detectCycle = useAppStore((s) => s.detectCycle);

  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showConflictAlert, setShowConflictAlert] = useState<string | null>(null);
  const [localDragData, setLocalDragData] = useState<{
    taskId: string;
    startDate: Date;
    endDate: Date;
  } | null>(null);

  const dayWidth = viewMode === 'month' ? DAY_WIDTH_MONTH : DAY_WIDTH_WEEK;

  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return { start: startOfMonth(today), end: addMonths(startOfMonth(today), 1) };
    }
    let minDate = startOfDay(parseISO(tasks[0].startDate));
    let maxDate = startOfDay(parseISO(tasks[0].endDate));
    for (const task of tasks) {
      const start = startOfDay(parseISO(task.startDate));
      const end = startOfDay(parseISO(task.endDate));
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }
    if (viewMode === 'month') {
      return { start: startOfMonth(minDate), end: addMonths(maxDate, 1) };
    } else {
      return { start: startOfWeek(minDate, { locale: zhCN }), end: addWeeks(maxDate, 1) };
    }
  }, [tasks, viewMode]);

  const totalDays = useMemo(
    () => differenceInDays(dateRange.end, dateRange.start),
    [dateRange]
  );
  const chartWidth = useMemo(() => totalDays * dayWidth, [totalDays, dayWidth]);
  const chartHeight = useMemo(
    () => HEADER_HEIGHT + tasks.length * ROW_HEIGHT + 20,
    [tasks.length]
  );

  const getDateX = useCallback(
    (date: Date) => {
      const days = differenceInDays(startOfDay(date), startOfDay(dateRange.start));
      return days * dayWidth;
    },
    [dateRange.start, dayWidth]
  );

  const getTaskY = useCallback(
    (index: number) => HEADER_HEIGHT + index * ROW_HEIGHT + 8,
    []
  );

  const getResourceName = useCallback(
    (id: string | null) => {
      if (!id) return '未分配';
      return resources.find((r) => r.id === id)?.name || '未知';
    },
    [resources]
  );

  const getProjectColor = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      return project?.color || 'from-gray-200 to-gray-600';
    },
    [projects]
  );

  const hasConflict = useCallback(
    (taskId: string, depId: string) => {
      return dependencyConflicts.some(
        (c) =>
          (c.taskId === taskId && c.dependentId === depId) ||
          (c.taskId === depId && c.dependentId === taskId)
      );
    },
    [dependencyConflicts]
  );

  const flushPendingUpdate = useCallback(() => {
    if (pendingUpdateRef.current && rafRef.current !== null) {
      const { id, start, end } = pendingUpdateRef.current;
      updateTask(id, { startDate: start, endDate: end });
      pendingUpdateRef.current = null;
      rafRef.current = null;
    }
  }, [updateTask]);

  const scheduleTaskUpdate = useCallback(
    (id: string, newStart: Date, newEnd: Date) => {
      pendingUpdateRef.current = {
        id,
        start: format(newStart, 'yyyy-MM-dd'),
        end: format(newEnd, 'yyyy-MM-dd'),
      };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushPendingUpdate);
      }
    },
    [flushPendingUpdate]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && tasks.length > 0) {
      const todayX = getDateX(new Date());
      const clientWidth = scrollContainerRef.current.clientWidth;
      const targetScroll = Math.max(0, todayX - clientWidth / 3);
      scrollContainerRef.current.scrollLeft = targetScroll;
    }
  }, [dateRange, viewMode, getDateX, tasks.length]);

  const handleMouseDown = useCallback(
    (taskId: string, type: 'start' | 'end' | 'move', clientX: number) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const startDate = startOfDay(parseISO(task.startDate));
      const endDate = startOfDay(parseISO(task.endDate));
      setLocalDragData({ taskId, startDate, endDate });
      setDragState({
        taskId,
        type,
        startX: clientX,
        originalStart: task.startDate,
        originalEnd: task.endDate,
      });
    },
    [tasks, setDragState]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!dragState.taskId || !dragState.type || !localDragData) return;

      const deltaX = e.clientX - dragState.startX;

      let pixelPerDay = dayWidth;
      if (viewMode === 'month' && localDragData) {
        const baseMonth = localDragData.startDate;
        const daysInCurrentMonth = getDaysInMonth(baseMonth);
        pixelPerDay = (DAY_WIDTH_MONTH * 30) / daysInCurrentMonth;
      }

      const deltaDays = Math.round(deltaX / pixelPerDay);
      let newStart = new Date(localDragData.startDate);
      let newEnd = new Date(localDragData.endDate);
      const durationMs = newEnd.getTime() - newStart.getTime();
      const durationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1);

      if (dragState.type === 'start') {
        newStart = addDays(newStart, deltaDays);
        const minEnd = addDays(newStart, 1);
        if (newEnd.getTime() < minEnd.getTime()) {
          newEnd = minEnd;
        }
      } else if (dragState.type === 'end') {
        newEnd = addDays(newEnd, deltaDays);
        const maxStart = addDays(newEnd, -durationDays);
        if (newStart.getTime() > maxStart.getTime()) {
          newStart = maxStart;
        }
      } else if (dragState.type === 'move') {
        newStart = addDays(newStart, deltaDays);
        newEnd = addDays(newEnd, deltaDays);
      }

      scheduleTaskUpdate(dragState.taskId, newStart, newEnd);
    },
    [dragState, localDragData, dayWidth, viewMode, scheduleTaskUpdate]
  );

  const handleMouseUp = useCallback(() => {
    flushPendingUpdate();
    setLocalDragData(null);
    setDragState({ taskId: null, type: null, startX: 0, originalStart: '', originalEnd: '' });
  }, [flushPendingUpdate, setDragState]);

  useEffect(() => {
    if (dragState.taskId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.taskId, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (dependencyConflicts.length > 0) {
      const msgs = dependencyConflicts.map((c) => c.message).join('\n');
      setShowConflictAlert(msgs);
      const timer = setTimeout(() => setShowConflictAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [dependencyConflicts]);

  const handleConnectorClick = useCallback(
    (taskId: string) => {
      if (connectingFrom === null) {
        setConnectingFrom(taskId);
      } else if (connectingFrom !== taskId) {
        const wouldCycle = detectCycle(taskId, connectingFrom);
        if (wouldCycle) {
          setShowConflictAlert('无法创建依赖：检测到循环依赖');
          setTimeout(() => setShowConflictAlert(null), 3000);
          setConnectingFrom(null);
          return;
        }
        setPendingDependency({ fromId: connectingFrom, toId: taskId });
        const confirm = window.confirm(
          `确认创建依赖关系？\n任务将按照: 前置任务 → 当前任务 的顺序执行`
        );
        if (confirm) {
          addDependency(taskId, connectingFrom);
        } else {
          setPendingDependency(null);
        }
        setConnectingFrom(null);
      } else {
        setConnectingFrom(null);
      }
    },
    [connectingFrom, detectCycle, addDependency, setPendingDependency]
  );

  useEffect(() => {
    if (connectingFrom) {
      const handleClick = () => setConnectingFrom(null);
      setTimeout(() => {
        window.addEventListener('click', handleClick);
      }, 0);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [connectingFrom]);

  const memoizedTasks = useMemo(
    () =>
      tasks.map((task, index) => {
        const startX = getDateX(parseISO(task.startDate));
        const endX = getDateX(parseISO(task.endDate));
        return {
          task,
          index,
          startX,
          taskWidth: Math.max(endX - startX, dayWidth * 0.5),
          isCritical: criticalPath.includes(task.id),
        };
      }),
    [tasks, getDateX, dayWidth, criticalPath]
  );

  const memoizedDependencies = useMemo(() => {
    const deps: Array<{
      taskId: string;
      depId: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      isConflict: boolean;
      isCritical: boolean;
      isPending: boolean;
    }> = [];
    tasks.forEach((task, taskIndex) => {
      task.dependencies.forEach((depId) => {
        const depTask = tasks.find((t) => t.id === depId);
        if (!depTask) return;
        const depIndex = tasks.findIndex((t) => t.id === depId);
        if (depIndex === -1) return;
        const fromX = getDateX(parseISO(depTask.endDate)) + dayWidth * 0.5;
        const fromY = getTaskY(depIndex) + 17;
        const toX = getDateX(parseISO(task.startDate));
        const toY = getTaskY(taskIndex) + 17;
        deps.push({
          taskId: task.id,
          depId,
          fromX,
          fromY,
          toX,
          toY,
          isConflict: hasConflict(task.id, depId),
          isCritical: criticalPath.includes(task.id) && criticalPath.includes(depId),
          isPending:
            pendingDependency !== null &&
            ((pendingDependency.fromId === depId && pendingDependency.toId === task.id) ||
              (pendingDependency.fromId === task.id && pendingDependency.toId === depId)),
        });
      });
    });
    return deps;
  }, [tasks, getDateX, getTaskY, dayWidth, hasConflict, criticalPath, pendingDependency]);

  const renderTimeHeaders = useMemo(() => {
    const headers: JSX.Element[] = [];
    let current = new Date(dateRange.start);
    const end = dateRange.end;

    if (viewMode === 'month') {
      while (current < end) {
        const monthStart = current;
        const monthDays = getDaysInMonth(current);
        const monthWidth = monthDays * dayWidth;
        headers.push(
          <g key={`month-${format(current, 'yyyy-MM')}`}>
            <rect
              x={getDateX(monthStart)}
              y={0}
              width={monthWidth}
              height={40}
              fill="#1a237e"
              stroke="#283593"
            />
            <text
              x={getDateX(monthStart) + monthWidth / 2}
              y={25}
              fill="white"
              fontSize={13}
              fontWeight="bold"
              textAnchor="middle"
            >
              {format(current, 'yyyy年 M月', { locale: zhCN })}
            </text>
          </g>
        );
        current = addMonths(current, 1);
      }
      current = new Date(dateRange.start);
      while (current < end) {
        const isWeekend = current.getDay() === 0 || current.getDay() === 6;
        const isToday = isSameDay(current, new Date());
        headers.push(
          <g key={`day-${format(current, 'yyyy-MM-dd')}`}>
            <rect
              x={getDateX(current)}
              y={40}
              width={dayWidth}
              height={40}
              fill={isWeekend ? '#f0f2f5' : '#eceff1'}
              stroke="#cfd8dc"
            />
            <text
              x={getDateX(current) + dayWidth / 2}
              y={58}
              fill={isToday ? '#d32f2f' : '#37474f'}
              fontSize={11}
              textAnchor="middle"
              fontWeight={isToday ? 'bold' : 'normal'}
            >
              {format(current, 'd')}
            </text>
            <text
              x={getDateX(current) + dayWidth / 2}
              y={72}
              fill="#78909c"
              fontSize={9}
              textAnchor="middle"
            >
              {format(current, 'E', { locale: zhCN })}
            </text>
          </g>
        );
        current = addDays(current, 1);
      }
    } else {
      let cur = new Date(dateRange.start);
      while (cur < end) {
        const weekStart = cur;
        headers.push(
          <g key={`week-${format(cur, 'yyyy-ww')}`}>
            <rect
              x={getDateX(weekStart)}
              y={0}
              width={7 * dayWidth}
              height={40}
              fill="#1a237e"
              stroke="#283593"
            />
            <text
              x={getDateX(weekStart) + (7 * dayWidth) / 2}
              y={25}
              fill="white"
              fontSize={13}
              fontWeight="bold"
              textAnchor="middle"
            >
              {`第${format(cur, 'I', { locale: zhCN })}周 - ${format(cur, 'M月d日', { locale: zhCN })}`}
            </text>
          </g>
        );
        cur = addWeeks(cur, 1);
      }
      cur = new Date(dateRange.start);
      while (cur < end) {
        const isWeekend = cur.getDay() === 0 || cur.getDay() === 6;
        const isToday = isSameDay(cur, new Date());
        headers.push(
          <g key={`day-${format(cur, 'yyyy-MM-dd')}`}>
            <rect
              x={getDateX(cur)}
              y={40}
              width={dayWidth}
              height={40}
              fill={isWeekend ? '#f0f2f5' : '#eceff1'}
              stroke="#cfd8dc"
            />
            <text
              x={getDateX(cur) + dayWidth / 2}
              y={58}
              fill={isToday ? '#d32f2f' : '#37474f'}
              fontSize={12}
              fontWeight={isToday ? 'bold' : 'normal'}
              textAnchor="middle"
            >
              {format(cur, 'd')}
            </text>
            <text
              x={getDateX(cur) + dayWidth / 2}
              y={74}
              fill="#78909c"
              fontSize={10}
              textAnchor="middle"
            >
              {format(cur, 'EEEE', { locale: zhCN })}
            </text>
          </g>
        );
        cur = addDays(cur, 1);
      }
    }
    return headers;
  }, [dateRange, viewMode, dayWidth, getDateX]);

  const renderGrid = useMemo(() => {
    const lines: JSX.Element[] = [];
    let current = new Date(dateRange.start);
    let dayIndex = 0;
    const today = new Date();
    while (current < dateRange.end) {
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      const isToday = isSameDay(current, today);
      if (isWeekend || isToday) {
        lines.push(
          <rect
            key={`bg-${dayIndex}`}
            x={getDateX(current)}
            y={HEADER_HEIGHT}
            width={dayWidth}
            height={tasks.length * ROW_HEIGHT}
            fill={isToday ? 'rgba(211, 47, 47, 0.06)' : 'rgba(0, 0, 0, 0.02)'}
          />
        );
      }
      lines.push(
        <line
          key={`vline-${dayIndex}`}
          x1={getDateX(current)}
          y1={HEADER_HEIGHT}
          x2={getDateX(current)}
          y2={HEADER_HEIGHT + tasks.length * ROW_HEIGHT}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      );
      dayIndex++;
      current = addDays(current, 1);
    }
    for (let i = 0; i <= tasks.length; i++) {
      lines.push(
        <line
          key={`hline-${i}`}
          x1={0}
          y1={HEADER_HEIGHT + i * ROW_HEIGHT}
          x2={chartWidth}
          y2={HEADER_HEIGHT + i * ROW_HEIGHT}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      );
    }
    return lines;
  }, [dateRange, dayWidth, tasks.length, getDateX, chartWidth]);

  const renderTaskList = useMemo(() => {
    return (
      <div
        className="task-list"
        style={{
          width: TASK_LIST_WIDTH,
          flexShrink: 0,
          borderRight: '1px solid #e0e0e0',
          background: '#fafafa',
        }}
      >
        <div
          style={{
            height: HEADER_HEIGHT,
            background: '#1a237e',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            fontWeight: 'bold',
            fontSize: 14,
            borderBottom: '1px solid #283593',
          }}
        >
          任务列表
        </div>
        {tasks.map((task) => {
          const project = projects.find((p) => p.id === task.projectId);
          const colorDot = project?.color.includes('blue')
            ? '#1e88e5'
            : project?.color.includes('green')
            ? '#43a047'
            : project?.color.includes('purple')
            ? '#8e24aa'
            : project?.color.includes('pink')
            ? '#d81b60'
            : project?.color.includes('orange')
            ? '#fb8c00'
            : '#757575';
          return (
            <div
              key={task.id}
              style={{
                height: ROW_HEIGHT,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 12px',
                borderBottom: '1px solid #e0e0e0',
                background: hoveredTask === task.id ? '#e3f2fd' : 'transparent',
                transition: 'background 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredTask(task.id)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#263238',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {task.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#78909c',
                  marginTop: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: colorDot,
                  }}
                />
                {getResourceName(task.assigneeId)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [tasks, projects, hoveredTask, getResourceName]);

  const renderTooltip = () => {
    if (!hoveredTask) return null;
    const task = tasks.find((t) => t.id === hoveredTask);
    if (!task) return null;
    const project = projects.find((p) => p.id === task.projectId);

    return (
      <div
        style={{
          position: 'fixed',
          left: tooltipPos.x + 15,
          top: tooltipPos.y + 15,
          zIndex: 1000,
          padding: 16,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid rgba(255,255,255,0.5)',
          minWidth: 220,
          animation: 'fadeIn 0.2s ease-out',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a237e', marginBottom: 10 }}>
          {task.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#455a64' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>项目：</span>
            <span style={{ fontWeight: 500 }}>{project?.name || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>负责人：</span>
            <span style={{ fontWeight: 500 }}>{getResourceName(task.assigneeId)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>开始：</span>
            <span style={{ fontWeight: 500 }}>{task.startDate}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>结束：</span>
            <span style={{ fontWeight: 500 }}>{task.endDate}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>工时：</span>
            <span style={{ fontWeight: 500 }}>{task.estimatedHours}小时</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>进度：</span>
            <span style={{ fontWeight: 600, color: '#1976d2' }}>{task.progress}%</span>
          </div>
          <div
            style={{
              marginTop: 6,
              width: '100%',
              height: 6,
              background: '#e0e0e0',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${task.progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #42a5f5, #1976d2)',
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const connectingLine = useMemo(() => {
    if (!connectingFrom) return null;
    const fromTask = tasks.find((t) => t.id === connectingFrom);
    if (!fromTask || !containerRef.current) return null;
    const fromIndex = tasks.findIndex((t) => t.id === connectingFrom);
    if (fromIndex === -1) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const fromX = getDateX(parseISO(fromTask.endDate));
    const fromY = getTaskY(fromIndex) + 17;
    const toX = mousePos.x - rect.left;
    const toY = mousePos.y - rect.top;
    const midX = (fromX + toX) / 2;
    return (
      <path
        d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
        fill="none"
        stroke="#1976d2"
        strokeWidth={2}
        strokeDasharray="6 4"
      />
    );
  }, [connectingFrom, tasks, getDateX, getTaskY, mousePos]);

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', background: 'white' }}
    >
      {renderTaskList}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            justifyContent: 'flex-end',
            padding: 8,
            background: 'rgba(255,255,255,0.95)',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <div style={{ display: 'flex', gap: 4, background: '#eceff1', borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => setViewMode('week')}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'week' ? '#1a237e' : 'transparent',
                color: viewMode === 'week' ? 'white' : '#455a64',
              }}
            >
              周视图
            </button>
            <button
              onClick={() => setViewMode('month')}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'month' ? '#1a237e' : 'transparent',
                color: viewMode === 'month' ? 'white' : '#455a64',
              }}
            >
              月视图
            </button>
          </div>
        </div>
        <div ref={scrollContainerRef} style={{ overflow: 'auto' }}>
          <svg ref={svgRef} width={chartWidth} height={chartHeight} style={{ display: 'block' }}>
            {renderTimeHeaders}
            {renderGrid}
            {memoizedDependencies.map((dep) => (
              <DependencyArrow
                key={`dep-${dep.taskId}-${dep.depId}`}
                taskId={dep.taskId}
                depId={dep.depId}
                fromX={dep.fromX}
                fromY={dep.fromY}
                toX={dep.toX}
                toY={dep.toY}
                isConflict={dep.isConflict}
                isCritical={dep.isCritical}
                isPending={dep.isPending}
              />
            ))}
            {connectingLine}
            {memoizedTasks.map(({ task, index, startX, taskWidth, isCritical }) => (
              <g key={task.id} transform={`translate(0, ${index * ROW_HEIGHT})`}>
                <TaskBar
                  task={task}
                  index={index}
                  startX={startX}
                  taskWidth={taskWidth}
                  isCritical={isCritical}
                  isDragging={dragState.taskId === task.id}
                  isConnecting={connectingFrom === task.id}
                  isHovered={hoveredTask === task.id}
                  projectColor={getProjectColor(task.projectId)}
                  onMouseDown={(e, type) => {
                    handleMouseDown(task.id, type, e.clientX);
                  }}
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                  onConnectorClick={() => {
                    handleConnectorClick(task.id);
                  }}
                  getResourceName={getResourceName}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
      {renderTooltip()}
      {showConflictAlert && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: 'rgba(229, 57, 53, 0.95)',
            color: 'white',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(229,57,53,0.4)',
            zIndex: 100,
            animation: 'slideDown 0.3s ease-out',
            whiteSpace: 'pre-line',
          }}
        >
          ⚠️ {showConflictAlert}
        </div>
      )}
      {connectingFrom && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(25, 118, 210, 0.95)',
            color: 'white',
            borderRadius: 8,
            fontSize: 13,
            zIndex: 100,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          点击另一任务的右侧连接点创建依赖关系，或点击空白处取消
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 0.7; }
        }
        .critical-task {
        }
        .critical-task-rect {
          animation: criticalPulse 2s ease-in-out infinite;
        }
        @keyframes criticalPulse {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(255,193,7,0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(255,193,7,0.9)); }
        }
      `}</style>
    </div>
  );
};

export default memo(GanttChart);
