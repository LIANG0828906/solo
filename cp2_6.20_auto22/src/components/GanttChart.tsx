import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
  isSameMonth,
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

const GanttChart: React.FC<GanttChartProps> = ({ tasks, projects, resources }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const dragState = useAppStore((s) => s.dragState);
  const setDragState = useAppStore((s) => s.setDragState);
  const updateTask = useAppStore((s) => s.updateTask);
  const criticalPath = useAppStore((s) => s.criticalPath);
  const dependencyConflicts = useAppStore((s) => s.dependencyConflicts);
  const addDependency = useAppStore((s) => s.addDependency);

  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showConflictAlert, setShowConflictAlert] = useState<string | null>(null);

  const dayWidth = viewMode === 'month' ? DAY_WIDTH_MONTH : DAY_WIDTH_WEEK;

  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return { start: startOfMonth(today), end: addMonths(startOfMonth(today), 1) };
    }
    let minDate = parseISO(tasks[0].startDate);
    let maxDate = parseISO(tasks[0].endDate);
    for (const task of tasks) {
      const start = parseISO(task.startDate);
      const end = parseISO(task.endDate);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }
    if (viewMode === 'month') {
      return { start: startOfMonth(minDate), end: addMonths(maxDate, 1) };
    } else {
      return { start: startOfWeek(minDate, { locale: zhCN }), end: addWeeks(maxDate, 1) };
    }
  }, [tasks, viewMode]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start);
  const chartWidth = totalDays * dayWidth;
  const chartHeight = HEADER_HEIGHT + tasks.length * ROW_HEIGHT + 20;

  const getDateX = useCallback(
    (date: Date) => differenceInDays(date, dateRange.start) * dayWidth,
    [dateRange.start, dayWidth]
  );

  const getTaskY = useCallback(
    (index: number) => HEADER_HEIGHT + index * ROW_HEIGHT + 8,
    []
  );

  const getResourceName = (id: string | null) => {
    if (!id) return '未分配';
    return resources.find((r) => r.id === id)?.name || '未知';
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || 'from-gray-200 to-gray-600';
  };

  const hasConflict = (taskId: string, depId: string) => {
    return dependencyConflicts.some(
      (c) => (c.taskId === taskId && c.dependentId === depId) ||
             (c.taskId === depId && c.dependentId === taskId)
    );
  };

  const handleMouseDown = (e: React.MouseEvent, taskId: string, type: 'start' | 'end' | 'move') => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setDragState({
      taskId,
      type,
      startX: e.clientX,
      originalStart: task.startDate,
      originalEnd: task.endDate,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!dragState.taskId || !dragState.type) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / dayWidth);
      const task = tasks.find((t) => t.id === dragState.taskId);
      if (!task) return;

      let newStart = parseISO(dragState.originalStart);
      let newEnd = parseISO(dragState.originalEnd);
      const duration = differenceInDays(newEnd, newStart);

      if (dragState.type === 'start') {
        newStart = addDays(newStart, deltaDays);
        if (differenceInDays(newEnd, newStart) < 1) {
          newStart = addDays(newEnd, -1);
        }
      } else if (dragState.type === 'end') {
        newEnd = addDays(newEnd, deltaDays);
        if (differenceInDays(newEnd, newStart) < 1) {
          newEnd = addDays(newStart, 1);
        }
      } else if (dragState.type === 'move') {
        newStart = addDays(newStart, deltaDays);
        newEnd = addDays(newEnd, deltaDays);
      }

      updateTask(dragState.taskId, {
        startDate: format(newStart, 'yyyy-MM-dd'),
        endDate: format(newEnd, 'yyyy-MM-dd'),
      });
    },
    [dragState, dayWidth, tasks, updateTask]
  );

  const handleMouseUp = useCallback(() => {
    setDragState({ taskId: null, type: null, startX: 0, originalStart: '', originalEnd: '' });
  }, [setDragState]);

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

  const handleConnectorClick = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFrom === null) {
      setConnectingFrom(taskId);
    } else if (connectingFrom !== taskId) {
      const success = addDependency(taskId, connectingFrom);
      if (!success) {
        setShowConflictAlert('无法创建依赖：可能造成循环依赖');
        setTimeout(() => setShowConflictAlert(null), 3000);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(null);
    }
  };

  useEffect(() => {
    if (connectingFrom) {
      const handleClick = () => setConnectingFrom(null);
      setTimeout(() => {
        window.addEventListener('click', handleClick);
      }, 0);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [connectingFrom]);

  const renderTimeHeaders = () => {
    const headers: JSX.Element[] = [];
    let current = new Date(dateRange.start);
    const end = dateRange.end;

    if (viewMode === 'month') {
      let monthX = 0;
      while (current < end) {
        const monthStart = current;
        const monthDays = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
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
        monthX += monthWidth;
        current = addMonths(current, 1);
      }
      current = new Date(dateRange.start);
      let dayIndex = 0;
      while (current < end) {
        const isWeekend = current.getDay() === 0 || current.getDay() === 6;
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
              fill={isSameDay(current, new Date()) ? '#d32f2f' : '#37474f'}
              fontSize={11}
              textAnchor="middle"
              fontWeight={isSameDay(current, new Date()) ? 'bold' : 'normal'}
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
        dayIndex++;
        current = addDays(current, 1);
      }
    } else {
      let current2 = new Date(dateRange.start);
      while (current2 < end) {
        const weekStart = current2;
        headers.push(
          <g key={`week-${format(current2, 'yyyy-ww')}`}>
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
              {`第${format(current2, 'I', { locale: zhCN })}周 - ${format(current2, 'M月d日', { locale: zhCN })}`}
            </text>
          </g>
        );
        current2 = addWeeks(current2, 1);
      }
      current2 = new Date(dateRange.start);
      while (current2 < end) {
        const isWeekend = current2.getDay() === 0 || current2.getDay() === 6;
        headers.push(
          <g key={`day-${format(current2, 'yyyy-MM-dd')}`}>
            <rect
              x={getDateX(current2)}
              y={40}
              width={dayWidth}
              height={40}
              fill={isWeekend ? '#f0f2f5' : '#eceff1'}
              stroke="#cfd8dc"
            />
            <text
              x={getDateX(current2) + dayWidth / 2}
              y={58}
              fill={isSameDay(current2, new Date()) ? '#d32f2f' : '#37474f'}
              fontSize={12}
              fontWeight={isSameDay(current2, new Date()) ? 'bold' : 'normal'}
              textAnchor="middle"
            >
              {format(current2, 'd')}
            </text>
            <text
              x={getDateX(current2) + dayWidth / 2}
              y={74}
              fill="#78909c"
              fontSize={10}
              textAnchor="middle"
            >
              {format(current2, 'EEEE', { locale: zhCN })}
            </text>
          </g>
        );
        current2 = addDays(current2, 1);
      }
    }

    return headers;
  };

  const renderGrid = () => {
    const lines: JSX.Element[] = [];
    let current = new Date(dateRange.start);
    let dayIndex = 0;
    while (current < dateRange.end) {
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      if (isWeekend || isSameDay(current, new Date())) {
        lines.push(
          <rect
            key={`bg-${dayIndex}`}
            x={getDateX(current)}
            y={HEADER_HEIGHT}
            width={dayWidth}
            height={tasks.length * ROW_HEIGHT}
            fill={isSameDay(current, new Date()) ? 'rgba(211, 47, 47, 0.06)' : 'rgba(0, 0, 0, 0.02)'}
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
  };

  const renderDependencies = () => {
    const arrows: JSX.Element[] = [];
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

        const isConflict = hasConflict(task.id, depId);
        const isCritical = criticalPath.includes(task.id) && criticalPath.includes(depId);

        const midX = (fromX + toX) / 2;
        const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

        arrows.push(
          <g key={`dep-${task.id}-${depId}`}>
            <defs>
              <marker
                id={`arrow-${task.id}-${depId}`}
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  fill={isConflict ? '#e53935' : isCritical ? '#ffc107' : '#90a4ae'}
                />
              </marker>
            </defs>
            <path
              d={path}
              fill="none"
              stroke={isConflict ? '#e53935' : isCritical ? '#ffc107' : '#90a4ae'}
              strokeWidth={isCritical ? 2.5 : 1.8}
              markerEnd={`url(#arrow-${task.id}-${depId})`}
              opacity={isConflict ? 1 : 0.7}
              style={{ transition: 'all 0.3s ease' }}
            />
          </g>
        );
      });
    });

    if (connectingFrom) {
      const fromTask = tasks.find((t) => t.id === connectingFrom);
      if (fromTask && containerRef.current) {
        const fromIndex = tasks.findIndex((t) => t.id === connectingFrom);
        const rect = containerRef.current.getBoundingClientRect();
        const fromX = getDateX(parseISO(fromTask.endDate));
        const fromY = getTaskY(fromIndex) + 17;
        const toX = mousePos.x - rect.left;
        const toY = mousePos.y - rect.top;
        const midX = (fromX + toX) / 2;
        arrows.push(
          <path
            key="connecting-line"
            d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
            fill="none"
            stroke="#1976d2"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        );
      }
    }

    return arrows;
  };

  const renderTasks = () => {
    return tasks.map((task, index) => {
      const startX = getDateX(parseISO(task.startDate));
      const endX = getDateX(parseISO(task.endDate));
      const taskWidth = Math.max(endX - startX, dayWidth * 0.5);
      const y = getTaskY(index);
      const isCritical = criticalPath.includes(task.id);
      const isDragging = dragState.taskId === task.id;
      const isConnecting = connectingFrom === task.id;
      const gradientId = `grad-${task.id}`;
      const [color1, color2] = getProjectColor(task.projectId).replace('from-', '').replace('to-', '').split(' ');

      const colorMap: Record<string, string> = {
        'blue-200': '#bbdefb', 'blue-600': '#1e88e5',
        'green-200': '#c8e6c9', 'green-600': '#43a047',
        'purple-200': '#e1bee7', 'purple-600': '#8e24aa',
        'pink-200': '#f8bbd0', 'pink-600': '#d81b60',
        'orange-200': '#ffe0b2', 'orange-600': '#fb8c00',
        'gray-200': '#eeeeee', 'gray-600': '#757575',
      };

      return (
        <g
          key={task.id}
          transform={`translate(${startX}, ${y})`}
          onMouseEnter={(e) => {
            setHoveredTask(task.id);
            setTooltipPos({ x: e.clientX, y: e.clientY });
          }}
          onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => setHoveredTask(null)}
          style={{ cursor: 'move' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorMap[color1] || '#bbdefb'} />
              <stop offset="100%" stopColor={colorMap[color2] || '#1e88e5'} />
            </linearGradient>
          </defs>

          {isDragging && (
            <rect
              x={-2}
              y={-2}
              width={taskWidth + 4}
              height={38}
              rx={8}
              fill="rgba(25, 118, 210, 0.25)"
              style={{ filter: 'blur(4px)' }}
            />
          )}

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
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: hoveredTask === task.id ? 'brightness(1.08) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
              transform: hoveredTask === task.id && !isDragging ? 'scaleY(1.05)' : 'scaleY(1)',
              transformOrigin: 'center',
            }}
            className={isCritical ? 'critical-task' : ''}
            onMouseDown={(e) => handleMouseDown(e, task.id, 'move')}
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
            style={{
              pointerEvents: 'none',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
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
            style={{ cursor: 'ew-resize', opacity: hoveredTask === task.id || isDragging ? 1 : 0 }}
            onMouseDown={(e) => handleMouseDown(e, task.id, 'start')}
          />

          <rect
            x={taskWidth - 3}
            y={4}
            width={6}
            height={26}
            rx={3}
            fill="#1976d2"
            style={{ cursor: 'ew-resize', opacity: hoveredTask === task.id || isDragging ? 1 : 0 }}
            onMouseDown={(e) => handleMouseDown(e, task.id, 'end')}
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
              opacity: hoveredTask === task.id || connectingFrom ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
            onClick={(e) => handleConnectorClick(task.id, e)}
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
            style={{ pointerEvents: 'none', opacity: hoveredTask === task.id || connectingFrom ? 1 : 0 }}
          >
            →
          </text>
        </g>
      );
    });
  };

  const renderTaskList = () => {
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
        {tasks.map((task, index) => {
          const project = projects.find((p) => p.id === task.projectId);
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
              <div style={{ fontSize: 13, fontWeight: 600, color: '#263238', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.name}
              </div>
              <div style={{ fontSize: 11, color: '#78909c', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: project?.color.includes('blue') ? '#1e88e5' :
                               project?.color.includes('green') ? '#43a047' :
                               project?.color.includes('purple') ? '#8e24aa' :
                               project?.color.includes('pink') ? '#d81b60' :
                               project?.color.includes('orange') ? '#fb8c00' : '#757575',
                  }}
                />
                {getResourceName(task.assigneeId)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a237e', marginBottom: 10 }}>{task.name}</div>
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
          <div style={{ marginTop: 6, width: '100%', height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${task.progress}%`, height: '100%', background: 'linear-gradient(90deg, #42a5f5, #1976d2)', borderRadius: 3 }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', background: 'white' }}>
      {renderTaskList()}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', padding: 8, background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #e0e0e0' }}>
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
        <div style={{ overflow: 'auto' }}>
          <svg
            ref={svgRef}
            width={chartWidth}
            height={chartHeight}
            style={{ display: 'block' }}
          >
            {renderTimeHeaders()}
            {renderGrid()}
            {renderDependencies()}
            {renderTasks()}
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
          animation: criticalPulse 2s ease-in-out infinite;
        }
        @keyframes criticalPulse {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(255,193,7,0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(255,193,7,0.8)); }
        }
      `}</style>
    </div>
  );
};

export default GanttChart;
