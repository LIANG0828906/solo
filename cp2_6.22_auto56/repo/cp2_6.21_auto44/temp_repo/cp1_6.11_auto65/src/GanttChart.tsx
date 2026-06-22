import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Task, Dependency, ViewMode, DragState, Point } from './types';
import {
  formatDate,
  parseDate,
  addDays,
  dateToPixel,
  pixelToDate,
  snapToGrid,
  snapProgress,
  calculateBezierPath,
  getDayWidthForViewMode,
  getTotalDaysForViewMode,
  getViewModeLabel,
  generateDateTicks,
  getStatusColor,
  diffDays
} from './utils';
import { ZoomIn, ZoomOut, Wifi, WifiOff } from 'lucide-react';

const ROW_HEIGHT = 40;
const TASK_HEIGHT = 32;
const TIMELINE_HEIGHT = 60;
const FOOTER_HEIGHT = 50;

interface GanttChartProps {
  tasks: Task[];
  dependencies: Dependency[];
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  onTaskUpdate: (task: Task) => void;
  onTaskDoubleClick: (task: Task) => void;
  onTaskRightClick: (e: React.MouseEvent, taskId: string) => void;
  onDependencyCreate: (fromTaskId: string, toTaskId: string) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  dependencies,
  selectedTaskId,
  onTaskSelect,
  onTaskUpdate,
  onTaskDoubleClick,
  onTaskRightClick,
  onDependencyCreate
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [zoomLevel, setZoomLevel] = useState(50);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    type: null,
    taskId: null,
    startX: 0,
    startY: 0
  });
  const [tempDragData, setTempDragData] = useState<{
    startDate?: string;
    endDate?: string;
    progress?: number;
  }>({});
  const [depDragStart, setDepDragStart] = useState<Point | null>(null);
  const [depDragEnd, setDepDragEnd] = useState<Point | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  const dayWidth = useMemo(() => {
    const baseWidth = getDayWidthForViewMode(viewMode);
    return baseWidth * (0.5 + zoomLevel / 100);
  }, [viewMode, zoomLevel]);

  const totalDays = useMemo(() => getTotalDaysForViewMode(viewMode), [viewMode]);

  const ganttStartDate = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return addDays(today, -7);
    }
    const earliest = tasks.reduce((min, task) => {
      const taskDate = parseDate(task.startDate);
      return taskDate < min ? taskDate : min;
    }, parseDate(tasks[0].startDate));
    return addDays(earliest, -7);
  }, [tasks]);

  const ganttEndDate = useMemo(() => {
    return addDays(ganttStartDate, totalDays);
  }, [ganttStartDate, totalDays]);

  const totalWidth = useMemo(() => totalDays * dayWidth, [totalDays, dayWidth]);

  const todayPosition = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pos = dateToPixel(today, ganttStartDate, dayWidth);
    return pos > 0 && pos < totalWidth ? pos : null;
  }, [ganttStartDate, dayWidth, totalWidth]);

  const dateTicks = useMemo(() => {
    return generateDateTicks(ganttStartDate, totalDays, viewMode);
  }, [ganttStartDate, totalDays, viewMode]);

  const getTaskPosition = useCallback(
    (task: Task) => {
      const start = parseDate(task.startDate);
      const end = parseDate(task.endDate);
      const left = dateToPixel(start, ganttStartDate, dayWidth);
      const width = Math.max(dayWidth, dateToPixel(addDays(end, 1), ganttStartDate, dayWidth) - left);
      return { left, width };
    },
    [ganttStartDate, dayWidth]
  );

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(parseInt(e.target.value, 10));
  };

  const handleViewModeChange = () => {
    const modes: ViewMode[] = ['day', 'week', 'month'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    task: Task,
    type: 'move' | 'resize-left' | 'resize-right' | 'progress' | 'dependency'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (type === 'dependency') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDepDragStart({
          x: e.clientX - rect.left + scrollLeft,
          y: e.clientY - rect.top
        });
        setDragState({
          isDragging: true,
          type: 'dependency',
          taskId: task.id,
          startX: e.clientX,
          startY: e.clientY,
          fromTaskId: task.id
        });
      }
      return;
    }

    setDragState({
      isDragging: true,
      type: type === 'resize-left' || type === 'resize-right' ? 'resize' : type,
      taskId: task.id,
      startX: e.clientX,
      startY: e.clientY,
      initialStartDate: tempDragData.startDate || task.startDate,
      initialEndDate: tempDragData.endDate || task.endDate,
      initialProgress: tempDragData.progress !== undefined ? tempDragData.progress : task.progress
    });
    setTempDragData({
      startDate: task.startDate,
      endDate: task.endDate,
      progress: task.progress
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.taskId) return;

      const task = tasks.find(t => t.id === dragState.taskId);
      if (!task) return;

      if (dragState.type === 'dependency') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setDepDragEnd({
            x: e.clientX - rect.left + scrollLeft,
            y: e.clientY - rect.top
          });
        }
        return;
      }

      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / dayWidth);

      let updatedTask = { ...task };

      if (dragState.type === 'move') {
        let newStart = addDays(parseDate(dragState.initialStartDate!), deltaDays);
        let newEnd = addDays(parseDate(dragState.initialEndDate!), deltaDays);
        newStart = snapToGrid(newStart);
        newEnd = snapToGrid(newEnd);
        updatedTask.startDate = formatDate(newStart);
        updatedTask.endDate = formatDate(newEnd);
      } else if (dragState.type === 'resize') {
        if (deltaX < 0) {
          let newStart = addDays(parseDate(dragState.initialStartDate!), deltaDays);
          newStart = snapToGrid(newStart);
          if (newStart < parseDate(dragState.initialEndDate!)) {
            updatedTask.startDate = formatDate(newStart);
          }
        } else {
          let newEnd = addDays(parseDate(dragState.initialEndDate!), deltaDays);
          newEnd = snapToGrid(newEnd);
          if (newEnd > parseDate(dragState.initialStartDate!)) {
            updatedTask.endDate = formatDate(newEnd);
          }
        }
      } else if (dragState.type === 'progress') {
        const { width } = getTaskPosition(task);
        const progressDelta = (deltaX / width) * 100;
        const newProgress = snapProgress((dragState.initialProgress || 0) + progressDelta);
        updatedTask.progress = newProgress;
      }

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        setTempDragData({
          startDate: updatedTask.startDate,
          endDate: updatedTask.endDate,
          progress: updatedTask.progress
        });
      });
    },
    [dragState, tasks, dayWidth, scrollLeft, getTaskPosition]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging) return;

      if (dragState.type === 'dependency' && dragState.fromTaskId && depDragEnd) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = e.clientX - rect.left + scrollLeft;
          const mouseY = e.clientY - rect.top;
          
          let targetTask: Task | null = null;
          for (const task of tasks) {
            if (task.id === dragState.fromTaskId) continue;
            const taskIndex = tasks.indexOf(task);
            const { left, width } = getTaskPosition(task);
            const taskTop = taskIndex * ROW_HEIGHT + (ROW_HEIGHT - TASK_HEIGHT) / 2;
            const taskBottom = taskTop + TASK_HEIGHT;
            const taskLeft = left;
            const taskRight = left + width;
            
            if (
              mouseX >= taskLeft - 20 &&
              mouseX <= taskRight + 20 &&
              mouseY >= taskTop &&
              mouseY <= taskBottom
            ) {
              targetTask = task;
              break;
            }
          }

          if (targetTask) {
            onDependencyCreate(dragState.fromTaskId!, targetTask.id);
          }
        }
      } else if (dragState.taskId && tempDragData.startDate) {
        const task = tasks.find(t => t.id === dragState.taskId);
        if (task) {
          const updatedTask = {
            ...task,
            startDate: tempDragData.startDate,
            endDate: tempDragData.endDate!,
            progress: tempDragData.progress!
          };
          onTaskUpdate(updatedTask);
        }
      }

      setDragState({
        isDragging: false,
        type: null,
        taskId: null,
        startX: 0,
        startY: 0
      });
      setTempDragData({});
      setDepDragStart(null);
      setDepDragEnd(null);
    },
    [dragState, tempDragData, tasks, depDragEnd, scrollLeft, getTaskPosition, onTaskUpdate, onDependencyCreate]
  );

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.type === 'progress' ? 'ew-resize' : dragState.type === 'dependency' ? 'crosshair' : 'grabbing';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, dragState.type]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const renderDependencies = () => {
    return dependencies.map(dep => {
      const fromTask = tasks.find(t => t.id === dep.fromTaskId);
      const toTask = tasks.find(t => t.id === dep.toTaskId);
      if (!fromTask || !toTask) return null;

      const fromIndex = tasks.indexOf(fromTask);
      const toIndex = tasks.indexOf(toTask);
      const fromPos = getTaskPosition(fromTask);
      const toPos = getTaskPosition(toTask);

      const x1 = fromPos.left + fromPos.width;
      const y1 = fromIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
      const x2 = toPos.left;
      const y2 = toIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

      const path = calculateBezierPath(x1, y1, x2, y2);

      return (
        <g key={dep.id}>
          <path
            className="dependency-line"
            d={path}
            markerEnd="url(#arrowhead)"
          />
        </g>
      );
    });
  };

  const renderGrid = () => {
    const rows: React.ReactNode[] = [];
    const cols: React.ReactNode[] = [];

    for (let i = 0; i < tasks.length; i++) {
      rows.push(
        <div
          key={`row-${i}`}
          className="grid-row"
          style={{ height: ROW_HEIGHT }}
        />
      );
    }

    dateTicks.forEach((tick, i) => {
      const left = dateToPixel(tick.date, ganttStartDate, dayWidth);
      cols.push(
        <div
          key={`col-${i}`}
          className={`grid-col ${tick.isMajor ? 'major' : ''}`}
          style={{ left }}
        />
      );
    });

    return (
      <div className="gantt-grid">
        {rows}
        {cols}
      </div>
    );
  };

  const renderTimeline = () => {
    const majorTicks = dateTicks.filter(t => t.isMajor);
    const minorTicks = dateTicks;

    return (
      <div className="gantt-header" style={{ paddingLeft: 0 }}>
        <div className="gantt-timeline" style={{ height: TIMELINE_HEIGHT }}>
          <div className="timeline-header">
            <div className="timeline-header-row">
              {majorTicks.map((tick, i) => {
                const left = dateToPixel(tick.date, ganttStartDate, dayWidth);
                const nextTick = majorTicks[i + 1];
                const width = nextTick
                  ? dateToPixel(nextTick.date, ganttStartDate, dayWidth) - left
                  : totalWidth - left;
                return (
                  <div
                    key={`major-${i}`}
                    className="timeline-tick major"
                    style={{ position: 'absolute', left, width }}
                  >
                    {tick.label}
                  </div>
                );
              })}
            </div>
            <div className="timeline-header-row">
              {minorTicks.map((tick, i) => {
                const left = dateToPixel(tick.date, ganttStartDate, dayWidth);
                const nextTick = minorTicks[i + 1];
                const width = nextTick
                  ? dateToPixel(nextTick.date, ganttStartDate, dayWidth) - left
                  : totalWidth - left;
                return (
                  <div
                    key={`minor-${i}`}
                    className="timeline-tick"
                    style={{ position: 'absolute', left, width }}
                  >
                    {tick.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTasks = () => {
    return tasks.map((task, index) => {
      const { left, width } = getTaskPosition(task);
      const isDraggingThis = dragState.isDragging && dragState.taskId === task.id;
      const displayStartDate = tempDragData.startDate && isDraggingThis ? tempDragData.startDate : task.startDate;
      const displayEndDate = tempDragData.endDate && isDraggingThis ? tempDragData.endDate : task.endDate;
      const displayProgress = tempDragData.progress !== undefined && isDraggingThis ? tempDragData.progress : task.progress;

      const actualLeft = isDraggingThis ? getTaskPosition({ ...task, startDate: displayStartDate }).left : left;
      const actualWidth = isDraggingThis
        ? dateToPixel(addDays(parseDate(displayEndDate), 1), ganttStartDate, dayWidth) - actualLeft
        : width;

      const bgColor = getStatusColor({ ...task, progress: displayProgress });

      return (
        <div
          key={task.id}
          className="task-row"
          style={{ height: ROW_HEIGHT }}
          onClick={() => onTaskSelect(task.id)}
          onDoubleClick={() => onTaskDoubleClick(task)}
          onContextMenu={e => onTaskRightClick(e, task.id)}
        >
          <div
            className={`task-bar ${isDraggingThis ? 'dragging' : ''} ${selectedTaskId === task.id ? 'selected' : ''}`}
            style={{
              left: actualLeft,
              width: actualWidth,
              top: (ROW_HEIGHT - TASK_HEIGHT) / 2,
              backgroundColor: bgColor,
              transform: isDraggingThis ? 'translateZ(0)' : undefined
            }}
            onMouseDown={e => handleMouseDown(e, task, 'move')}
          >
            <div
              className="task-bar-progress"
              style={{ width: `${displayProgress}%` }}
            />
            <div className="task-bar-content">
              <span className="task-bar-name">{task.name}</span>
              <span className="task-bar-progress-text">{displayProgress}%</span>
            </div>
            <div className="task-bar-tooltip">
              {task.name} | {task.assignee} | {displayStartDate} ~ {displayEndDate}
            </div>

            <div
              className="task-connect-point left"
              onMouseDown={e => handleMouseDown(e, task, 'dependency')}
            />
            <div
              className="task-connect-point right"
              onMouseDown={e => handleMouseDown(e, task, 'dependency')}
            />

            <div
              className="progress-handle"
              style={{ left: `${displayProgress}%`, transform: 'translateX(-50%)' }}
              onMouseDown={e => handleMouseDown(e, task, 'progress')}
            />

            <div
              className="resize-handle left"
              onMouseDown={e => handleMouseDown(e, task, 'resize-left')}
            />
            <div
              className="resize-handle right"
              onMouseDown={e => handleMouseDown(e, task, 'resize-right')}
            />
          </div>
        </div>
      );
    });
  };

  const renderDependencyDragLine = () => {
    if (!depDragStart || !depDragEnd || !dragState.fromTaskId) return null;

    const fromTask = tasks.find(t => t.id === dragState.fromTaskId);
    if (!fromTask) return null;

    const fromIndex = tasks.indexOf(fromTask);
    const y1 = fromIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
    const path = calculateBezierPath(depDragStart.x, y1, depDragEnd.x, depDragEnd.y);

    return (
      <path
        className="drag-preview-line"
        d={path}
        markerEnd="url(#arrowhead-drag)"
      />
    );
  };

  return (
    <>
      {renderTimeline()}

      <div className="gantt-body">
        <div
          className="gantt-scroll-container"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          <div
            className="gantt-canvas"
            ref={canvasRef}
            style={{
              width: totalWidth,
              height: tasks.length * ROW_HEIGHT
            }}
          >
            {renderGrid()}

            {todayPosition !== null && (
              <div className="today-line" style={{ left: todayPosition }} />
            )}

            <svg
              className="dependencies-svg"
              style={{
                width: totalWidth,
                height: tasks.length * ROW_HEIGHT
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                </marker>
                <marker
                  id="arrowhead-drag"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                </marker>
              </defs>
              {renderDependencies()}
              {renderDependencyDragLine()}
            </svg>

            <div className="tasks-layer">{renderTasks()}</div>
          </div>
        </div>
      </div>

      <div className="gantt-footer">
        <div className="zoom-control">
          <ZoomOut size={16} style={{ color: '#6b7280' }} />
          <span className="zoom-label">缩放</span>
          <input
            type="range"
            min="10"
            max="200"
            value={zoomLevel}
            onChange={handleZoomChange}
            className="zoom-slider"
          />
          <ZoomIn size={16} style={{ color: '#6b7280' }} />
          <span
            className="view-mode-label"
            onClick={handleViewModeChange}
            style={{ cursor: 'pointer' }}
          >
            {getViewModeLabel(viewMode)}
          </span>
        </div>
        <div className="connection-status">
          {isConnected ? (
            <>
              <span className="status-dot connected" />
              <span>已连接</span>
            </>
          ) : (
            <>
              <span className="status-dot disconnected" />
              <span>已断开</span>
            </>
          )}
        </div>
      </div>
    </>
  );
};
