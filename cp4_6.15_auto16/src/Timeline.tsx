import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useKanbanStore, TEAM_MEMBERS } from './store';
import type { Task, Priority } from './types';
import dayjs from 'dayjs';

interface TooltipData {
  task: Task;
  x: number;
  y: number;
}

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 48;
const SIDEBAR_WIDTH = 120;
const DAY_MS = 86400000;

function getStatusLabel(status: string): string {
  switch (status) {
    case 'not_started': return '未开始';
    case 'in_progress': return '进行中';
    case 'completed': return '已完成';
    default: return status;
  }
}

const Timeline = React.memo(function Timeline() {
  const tasks = useKanbanStore((s) => s.getFilteredTasks());
  const zoomLevel = useKanbanStore((s) => s.zoomLevel);
  const setZoomLevel = useKanbanStore((s) => s.setZoomLevel);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const openModal = useKanbanStore((s) => s.openModal);
  const openDeleteConfirm = useKanbanStore((s) => s.openDeleteConfirm);

  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dragState, setDragState] = useState<{
    taskId: string;
    type: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    startY: number;
    origStart: string;
    origEnd: string;
    origAssignee: string;
    currentOffsetDays: number;
    currentAssigneeIdx: number;
  } | null>(null);

  const [guideLine, setGuideLine] = useState<{ x: number; label: string } | null>(null);

  const dayWidth = Math.max(20, Math.min(80, 800 / zoomLevel));

  const assignees = TEAM_MEMBERS.map((m) => m.name);
  const assigneeTaskMap = new Map<string, Task[]>();
  assignees.forEach((a) => assigneeTaskMap.set(a, []));
  tasks.forEach((t) => {
    const list = assigneeTaskMap.get(t.assignee);
    if (list) list.push(t);
    else assigneeTaskMap.set(t.assignee, [t]);
  });

  const timelineStart = React.useMemo(() => {
    if (tasks.length === 0) return dayjs().subtract(7, 'day');
    const allStarts = tasks.map((t) => dayjs(t.startDate).valueOf());
    return dayjs(Math.min(...allStarts)).subtract(3, 'day');
  }, [tasks]);

  const timelineEnd = React.useMemo(() => {
    if (tasks.length === 0) return dayjs().add(zoomLevel, 'day');
    const allEnds = tasks.map((t) => dayjs(t.endDate).valueOf());
    const maxEnd = dayjs(Math.max(...allEnds));
    const minEnd = timelineStart.add(zoomLevel, 'day');
    return maxEnd.isAfter(minEnd) ? maxEnd.add(3, 'day') : minEnd;
  }, [tasks, zoomLevel, timelineStart]);

  const totalDays = timelineEnd.diff(timelineStart, 'day') + 1;
  const totalWidth = totalDays * dayWidth;

  const getTaskRow = useCallback((task: Task) => {
    const idx = assignees.indexOf(task.assignee);
    const taskList = assigneeTaskMap.get(task.assignee) || [];
    const taskIdx = taskList.indexOf(task);
    return idx * 1 + taskIdx;
  }, [assignees, assigneeTaskMap]);

  const totalRows = React.useMemo(() => {
    let maxRow = 0;
    assignees.forEach((a) => {
      const list = assigneeTaskMap.get(a) || [];
      maxRow += Math.max(list.length, 1);
    });
    return Math.max(maxRow, assignees.length);
  }, [assignees, assigneeTaskMap]);

  const totalHeight = totalRows * ROW_HEIGHT + HEADER_HEIGHT;

  const dateToX = useCallback((dateStr: string) => {
    const diff = dayjs(dateStr).diff(timelineStart, 'day');
    return diff * dayWidth;
  }, [timelineStart, dayWidth]);

  const xToDate = useCallback((x: number) => {
    const diff = Math.round(x / dayWidth);
    return timelineStart.add(diff, 'day').format('YYYY-MM-DD');
  }, [timelineStart, dayWidth]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -3 : 3;
      setZoomLevel(zoomLevel + delta);
    }
  }, [zoomLevel, setZoomLevel]);

  const handleBarMouseDown = useCallback((
    e: React.MouseEvent,
    task: Task,
    type: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const assigneeIdx = assignees.indexOf(task.assignee);
    setDragState({
      taskId: task.id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      origStart: task.startDate,
      origEnd: task.endDate,
      origAssignee: task.assignee,
      currentOffsetDays: 0,
      currentAssigneeIdx: assigneeIdx,
    });
  }, [assignees]);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      if (dragState.type === 'move') {
        const offsetDays = Math.round(dx / dayWidth);
        const newAssigneeIdx = Math.max(0, Math.min(assignees.length - 1,
          assignees.indexOf(dragState.origAssignee) + Math.round(dy / ROW_HEIGHT)));

        const newStart = dayjs(dragState.origStart).add(offsetDays, 'day').format('YYYY-MM-DD');
        const newEnd = dayjs(dragState.origEnd).add(offsetDays, 'day').format('YYYY-MM-DD');

        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const scrollLeft = container.scrollLeft;
          const x = dateToX(newStart) - scrollLeft + SIDEBAR_WIDTH;
          setGuideLine({ x, label: `${newStart} → ${newEnd}` });
        }

        setDragState((prev) => prev ? { ...prev, currentOffsetDays: offsetDays, currentAssigneeIdx: newAssigneeIdx } : null);
      } else if (dragState.type === 'resize-left') {
        const offsetDays = Math.round(dx / dayWidth);
        const newStart = dayjs(dragState.origStart).add(offsetDays, 'day').format('YYYY-MM-DD');
        if (dayjs(newStart).isBefore(dayjs(dragState.origEnd))) {
          setDragState((prev) => prev ? { ...prev, currentOffsetDays: offsetDays } : null);
          setGuideLine({ x: dateToX(newStart), label: newStart });
        }
      } else if (dragState.type === 'resize-right') {
        const offsetDays = Math.round(dx / dayWidth);
        const newEnd = dayjs(dragState.origEnd).add(offsetDays, 'day').format('YYYY-MM-DD');
        if (dayjs(newEnd).isAfter(dayjs(dragState.origStart))) {
          setDragState((prev) => prev ? { ...prev, currentOffsetDays: offsetDays } : null);
          setGuideLine({ x: dateToX(newEnd), label: newEnd });
        }
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        const offsetDays = dragState.currentOffsetDays;
        const newAssignee = assignees[dragState.currentAssigneeIdx] ?? dragState.origAssignee;

        if (dragState.type === 'move') {
          const newStart = dayjs(dragState.origStart).add(offsetDays, 'day').format('YYYY-MM-DD');
          const newEnd = dayjs(dragState.origEnd).add(offsetDays, 'day').format('YYYY-MM-DD');
          updateTask(dragState.taskId, { startDate: newStart, endDate: newEnd, assignee: newAssignee });
        } else if (dragState.type === 'resize-left') {
          const newStart = dayjs(dragState.origStart).add(offsetDays, 'day').format('YYYY-MM-DD');
          if (dayjs(newStart).isBefore(dayjs(dragState.origEnd))) {
            updateTask(dragState.taskId, { startDate: newStart });
          }
        } else if (dragState.type === 'resize-right') {
          const newEnd = dayjs(dragState.origEnd).add(offsetDays, 'day').format('YYYY-MM-DD');
          if (dayjs(newEnd).isAfter(dayjs(dragState.origStart))) {
            updateTask(dragState.taskId, { endDate: newEnd });
          }
        }
      }
      setDragState(null);
      setGuideLine(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, dayWidth, assignees, updateTask, dateToX]);

  const renderDayHeaders = () => {
    const headers: React.ReactNode[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = timelineStart.add(i, 'day');
      const x = i * dayWidth;
      const isToday = date.isSame(dayjs(), 'day');
      const isWeekend = date.day() === 0 || date.day() === 6;
      headers.push(
        <div
          key={i}
          className={`absolute top-0 text-center gantt-text ${isToday ? 'text-kanban-accent font-bold' : isWeekend ? 'text-kanban-text-muted' : 'text-kanban-text-muted'} border-b border-kanban-border`}
          style={{ left: x, width: dayWidth, height: HEADER_HEIGHT }}
        >
          <div className="text-[10px] opacity-60 mt-1">{date.format('MM/DD')}</div>
          <div className={`text-xs ${isToday ? 'bg-kanban-accent text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''}`}>
            {date.format('DD')}
          </div>
        </div>
      );
    }
    return headers;
  };

  const renderGridLines = () => {
    const lines: React.ReactNode[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const date = timelineStart.add(i, 'day');
      const isToday = date.isSame(dayjs(), 'day');
      const x = i * dayWidth;
      lines.push(
        <div
          key={`line-${i}`}
          className={`absolute top-0 bottom-0 ${isToday ? 'border-kanban-accent/40 border-l-2' : 'border-kanban-border/30 border-l'}`}
          style={{ left: x, height: totalHeight }}
        />
      );
    }

    assignees.forEach((_, idx) => {
      const y = HEADER_HEIGHT + idx * ROW_HEIGHT;
      lines.push(
        <div
          key={`row-${idx}`}
          className="absolute left-0 right-0 border-b border-kanban-border/20"
          style={{ top: y, width: totalWidth }}
        />
      );
    });
    return lines;
  };

  const renderTaskBars = () => {
    const bars: React.ReactNode[] = [];
    let rowIdx = 0;

    assignees.forEach((assignee) => {
      const taskList = assigneeTaskMap.get(assignee) || [];
      if (taskList.length === 0) {
        rowIdx++;
        return;
      }
      taskList.forEach((task, tIdx) => {
        const x = dateToX(task.startDate);
        const endX = dateToX(task.endDate);
        const width = Math.max(endX - x, dayWidth * 0.5);
        const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT + 6;
        const barHeight = ROW_HEIGHT - 12;

        const isDragging = dragState?.taskId === task.id;
        let visualX = x;
        let visualWidth = width;

        if (isDragging && dragState) {
          if (dragState.type === 'move') {
            visualX = dateToX(dayjs(dragState.origStart).add(dragState.currentOffsetDays, 'day').format('YYYY-MM-DD'));
            const visualEndX = dateToX(dayjs(dragState.origEnd).add(dragState.currentOffsetDays, 'day').format('YYYY-MM-DD'));
            visualWidth = Math.max(visualEndX - visualX, dayWidth * 0.5);
          } else if (dragState.type === 'resize-left') {
            const newStartX = dateToX(dayjs(dragState.origStart).add(dragState.currentOffsetDays, 'day').format('YYYY-MM-DD'));
            visualX = Math.min(newStartX, endX - dayWidth * 0.5);
            visualWidth = endX - visualX;
          } else if (dragState.type === 'resize-right') {
            const newEndX = dateToX(dayjs(dragState.origEnd).add(dragState.currentOffsetDays, 'day').format('YYYY-MM-DD'));
            visualWidth = Math.max(newEndX - x, dayWidth * 0.5);
          }
        }

        if (isDragging && dragState?.type === 'move') {
          const dy = (dragState.currentAssigneeIdx - assignees.indexOf(dragState.origAssignee)) * ROW_HEIGHT;
          const adjustedY = y + dy;
          bars.push(
            <div
              key={task.id}
              className={`absolute task-bar task-bar-dragging rounded-md overflow-hidden priority-${task.priority}`}
              style={{ left: visualX, top: adjustedY, width: visualWidth, height: barHeight }}
            >
              <div className="progress-fill h-full rounded-md" style={{ width: `${task.progress}%` }} />
              <span className="task-bar-text absolute inset-0 flex items-center px-2 text-white text-xs font-medium truncate pointer-events-none">
                {task.name}
              </span>
              <div
                className="resize-handle resize-handle-left"
                onMouseDown={(e) => handleBarMouseDown(e, task, 'resize-left')}
              />
              <div
                className="resize-handle resize-handle-right"
                onMouseDown={(e) => handleBarMouseDown(e, task, 'resize-right')}
              />
            </div>
          );
        } else {
          bars.push(
            <div
              key={task.id}
              className={`absolute task-bar rounded-md overflow-hidden priority-${task.priority} bar-enter group ${isDragging ? 'task-bar-dragging' : ''}`}
              style={{ left: visualX, top: y, width: visualWidth, height: barHeight }}
              onMouseDown={(e) => handleBarMouseDown(e, task, 'move')}
              onMouseEnter={(e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setTooltip({
                  task,
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="progress-fill h-full rounded-md" style={{ width: `${task.progress}%` }} />
              <span className="task-bar-text absolute inset-0 flex items-center px-2 text-white text-xs font-medium truncate pointer-events-none">
                {task.name}
              </span>
              <div
                className="resize-handle resize-handle-left"
                onMouseDown={(e) => handleBarMouseDown(e, task, 'resize-left')}
              />
              <div
                className="resize-handle resize-handle-right"
                onMouseDown={(e) => handleBarMouseDown(e, task, 'resize-right')}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  className="w-5 h-5 rounded bg-black/40 hover:bg-black/60 flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); openModal('edit', task.id); }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button
                  className="w-5 h-5 rounded bg-black/40 hover:bg-red-500/60 flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); openDeleteConfirm(task.id); }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            </div>
          );
        }
      });
      rowIdx += taskList.length;
    });
    return bars;
  };

  const renderSidebar = () => {
    const items: React.ReactNode[] = [];
    let rowIdx = 0;
    assignees.forEach((name) => {
      const taskList = assigneeTaskMap.get(name) || [];
      if (taskList.length === 0) {
        items.push(
          <div
            key={name}
            className="absolute left-0 flex items-center px-3 text-xs text-kanban-text-muted border-b border-kanban-border/20"
            style={{ top: HEADER_HEIGHT + rowIdx * ROW_HEIGHT, width: SIDEBAR_WIDTH, height: ROW_HEIGHT }}
          >
            {name}
          </div>
        );
        rowIdx++;
        return;
      }
      taskList.forEach((task, tIdx) => {
        items.push(
          <div
            key={`${name}-${tIdx}`}
            className="absolute left-0 flex items-center px-3 text-xs text-kanban-text-muted border-b border-kanban-border/20"
            style={{ top: HEADER_HEIGHT + rowIdx * ROW_HEIGHT, width: SIDEBAR_WIDTH, height: ROW_HEIGHT }}
          >
            {tIdx === 0 ? (
              <span className="font-medium text-kanban-text">{name}</span>
            ) : (
              <span className="text-[10px] text-kanban-text-muted/60">└</span>
            )}
          </div>
        );
        rowIdx++;
      });
    });
    return items;
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-shrink-0 bg-kanban-card border-r border-kanban-border relative" style={{ width: SIDEBAR_WIDTH }}>
        <div
          className="h-12 flex items-center px-3 text-xs font-semibold text-kanban-text border-b border-kanban-border bg-kanban-bg"
          style={{ width: SIDEBAR_WIDTH }}
        >
          负责人
        </div>
        <div className="relative" style={{ height: totalHeight - HEADER_HEIGHT }}>
          {renderSidebar()}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative bg-kanban-bg"
        onWheel={handleWheel}
      >
        <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
          <div className="sticky top-0 z-20 bg-kanban-bg" style={{ height: HEADER_HEIGHT, width: totalWidth }}>
            {renderDayHeaders()}
          </div>
          <div className="relative" style={{ width: totalWidth, height: totalHeight - HEADER_HEIGHT, top: 0 }}>
            {renderGridLines()}
            {renderTaskBars()}
            {guideLine && (
              <div
                className="guide-line absolute border-l-2 border-dashed border-white/50"
                style={{ left: guideLine.x, top: 0, height: totalHeight }}
              >
                <div className="absolute -top-6 left-2 bg-kanban-card text-xs text-white px-2 py-1 rounded shadow-lg">
                  {guideLine.label}
                </div>
              </div>
            )}
            {tasks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-kanban-text-muted text-sm">
                暂无匹配的任务
              </div>
            )}
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-kanban-card border border-kanban-border rounded-lg shadow-2xl px-3 py-2 pointer-events-none animate-fade-in"
          style={{ left: Math.min(tooltip.x, window.innerWidth - 200), top: tooltip.y - 80, transform: 'translateX(-50%)' }}
        >
          <div className="text-xs font-semibold text-kanban-text mb-1">{tooltip.task.name}</div>
          <div className="text-[10px] text-kanban-text-muted space-y-0.5">
            <div>负责人：{tooltip.task.assignee}</div>
            <div>时间：{tooltip.task.startDate} → {tooltip.task.endDate}</div>
            <div>优先级：{tooltip.task.priority === 'high' ? '高' : tooltip.task.priority === 'medium' ? '中' : '低'}</div>
            <div>状态：{getStatusLabel(tooltip.task.status)}</div>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full priority-${tooltip.task.priority}`} style={{ width: `${tooltip.task.progress}%` }} />
            </div>
            <span className="text-[10px] text-white font-medium">{tooltip.task.progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default Timeline;
