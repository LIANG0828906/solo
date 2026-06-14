import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Task } from '@/shared/types';
import { useStore } from '@/shared/store';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  projectId: string;
  onTaskClick: (task: Task) => void;
  selectedTaskId: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const TASK_HEIGHT = 40;
const TASK_GAP = 8;
const ROW_HEIGHT = TASK_HEIGHT + TASK_GAP;
const LEFT_PADDING = 220;
const TOP_PADDING = 60;
const DAY_WIDTH = 40;
const RESIZE_HANDLE_WIDTH = 8;

const GRADIENT_COLORS = [
  ['#e94560', '#ff6b81'],
  ['#8be9fd', '#50fa7b'],
  ['#bd93f9', '#ff79c6'],
  ['#ffb86c', '#f1fa8c'],
  ['#50fa7b', '#8be9fd'],
  ['#ff79c6', '#bd93f9'],
];

interface DragState {
  type: 'move' | 'resize-left' | 'resize-right' | null;
  taskId: string | null;
  startX: number;
  startTask: Task | null;
  startDate: number;
}

interface RenderTask {
  task: Task;
  x: number;
  y: number;
  width: number;
}

export default function GanttChart({ projectId, onTaskClick, selectedTaskId }: GanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const updateTask = useStore((s) => s.updateTask);
  const [dragState, setDragState] = useState<DragState>({
    type: null,
    taskId: null,
    startX: 0,
    startTask: null,
    startDate: 0,
  });

  const projectTasks = useStore((s) =>
    s.tasks.filter((t) => t.projectId === projectId).sort((a, b) => a.order - b.order),
  );

  const project = useStore((s) => s.projects.find((p) => p.id === projectId));

  const { minDate, totalDays } = useMemo(() => {
    const allDates: number[] = [];
    if (project) {
      allDates.push(project.startDate, project.endDate);
    }
    for (const task of projectTasks) {
      allDates.push(task.startDate, task.startDate + task.durationDays * DAY_MS);
    }
    if (allDates.length === 0) {
      const now = Date.now();
      return { minDate: now, totalDays: 30 };
    }
    const min = Math.min(...allDates) - 3 * DAY_MS;
    const max = Math.max(...allDates) + 3 * DAY_MS;
    return {
      minDate: min,
      totalDays: Math.max(1, Math.ceil((max - min) / DAY_MS)),
    };
  }, [projectTasks, project]);

  const visibleStartIdx = useRef(0);
  const visibleEndIdx = useRef(projectTasks.length);
  const scrollLeft = useRef(0);
  const rafId = useRef<number>();

  const dateToX = useCallback((date: number) => {
    const days = (date - minDate) / DAY_MS;
    return LEFT_PADDING + days * DAY_WIDTH;
  }, [minDate]);

  const getTaskColor = (index: number) => {
    return GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = containerRef.current?.clientWidth || 1200;
    const height = TOP_PADDING + Math.max(projectTasks.length * ROW_HEIGHT + 40, 300);
    const virtualWidth = LEFT_PADDING + totalDays * DAY_WIDTH + 40;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const sl = scrollLeft.current;
    ctx.save();
    ctx.translate(-sl, 0);

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, LEFT_PADDING, height);
    ctx.strokeStyle = '#1a3a5c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LEFT_PADDING - 0.5, 0);
    ctx.lineTo(LEFT_PADDING - 0.5, height);
    ctx.stroke();

    for (let i = 0; i < projectTasks.length; i++) {
      const y = TOP_PADDING + i * ROW_HEIGHT;
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(22, 33, 62, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(26, 58, 92, 0.3)';
      }
      ctx.fillRect(LEFT_PADDING, y, virtualWidth - LEFT_PADDING, ROW_HEIGHT);

      const task = projectTasks[i];
      ctx.fillStyle = '#e6e6e6';
      ctx.font = '500 13px Noto Sans SC, sans-serif';
      ctx.textBaseline = 'middle';
      const title = task.title.length > 20 ? task.title.slice(0, 18) + '...' : task.title;
      ctx.fillText(title, 12, y + TASK_HEIGHT / 2);

      if (selectedTaskId === task.id) {
        ctx.fillStyle = 'rgba(233, 69, 96, 0.15)';
        ctx.fillRect(0, y, LEFT_PADDING, ROW_HEIGHT);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.strokeRect(0.5, y + 0.5, LEFT_PADDING - 1, ROW_HEIGHT - 1);
      }
    }

    const startDay = new Date(minDate);
    startDay.setHours(0, 0, 0, 0);
    for (let d = 0; d <= totalDays; d++) {
      const x = LEFT_PADDING + d * DAY_WIDTH;
      const currentDate = new Date(startDay.getTime() + d * DAY_MS);
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const isMonthStart = currentDate.getDate() === 1;

      if (isWeekend) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(x, TOP_PADDING, DAY_WIDTH, projectTasks.length * ROW_HEIGHT);
      }

      if (d % 2 === 0) {
        ctx.fillStyle = '#8892b0';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(currentDate.getDate().toString(), x + DAY_WIDTH / 2, 10);

        if (isMonthStart || d === 0) {
          const monthStr = currentDate.toLocaleDateString('zh-CN', { month: 'short' });
          ctx.fillStyle = '#e6e6e6';
          ctx.font = '600 11px Outfit, sans-serif';
          ctx.fillText(monthStr, x + DAY_WIDTH / 2, 28);
        }
      }

      ctx.strokeStyle = 'rgba(26, 58, 92, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, TOP_PADDING);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    const todayX = dateToX(Date.now());
    ctx.beginPath();
    ctx.moveTo(todayX + 0.5, TOP_PADDING);
    ctx.lineTo(todayX + 0.5, height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(233, 69, 96, 0.9)';
    ctx.beginPath();
    ctx.moveTo(todayX, TOP_PADDING - 14);
    ctx.lineTo(todayX - 5, TOP_PADDING - 6);
    ctx.lineTo(todayX + 5, TOP_PADDING - 6);
    ctx.closePath();
    ctx.fill();

    const renderTasks: RenderTask[] = projectTasks.map((task, i) => {
      const x = dateToX(task.startDate);
      const y = TOP_PADDING + i * ROW_HEIGHT + 4;
      const width = Math.max(DAY_WIDTH, task.durationDays * DAY_WIDTH);
      return { task, x, y, width };
    });

    const taskMap = new Map(renderTasks.map((rt) => [rt.task.id, rt]));

    for (const rt of renderTasks) {
      for (const depId of rt.task.dependencyIds) {
        const fromRt = taskMap.get(depId);
        if (!fromRt) continue;

        const fromX = fromRt.x + fromRt.width;
        const fromY = fromRt.y + TASK_HEIGHT / 2;
        const toX = rt.x;
        const toY = rt.y + TASK_HEIGHT / 2;

        const dx = Math.abs(toX - fromX);
        const cpOffset = Math.max(40, dx * 0.4);

        ctx.strokeStyle = 'rgba(139, 233, 253, 0.6)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.bezierCurveTo(fromX + cpOffset, fromY, toX - cpOffset, toY, toX, toY);
        ctx.stroke();

        const arrowSize = 8;
        const angle = Math.atan2(0, -10);
        const arrowX = toX - 2;
        const arrowY = toY;
        ctx.fillStyle = 'rgba(139, 233, 253, 0.8)';
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();
      }
    }

    for (let i = visibleStartIdx.current; i <= Math.min(visibleEndIdx.current, renderTasks.length - 1); i++) {
      const { task, x, y, width } = renderTasks[i];
      const colors = getTaskColor(i);

      const isDragging = dragState.taskId === task.id;
      const isSelected = selectedTaskId === task.id;

      ctx.save();
      if (isDragging) {
        ctx.globalAlpha = 0.85;
        ctx.shadowColor = 'rgba(233, 69, 96, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 4;
      }

      const grad = ctx.createLinearGradient(x, y, x + width, y + TASK_HEIGHT);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      ctx.fillStyle = grad;

      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + TASK_HEIGHT - radius);
      ctx.quadraticCurveTo(x + width, y + TASK_HEIGHT, x + width - radius, y + TASK_HEIGHT);
      ctx.lineTo(x + radius, y + TASK_HEIGHT);
      ctx.quadraticCurveTo(x, y + TASK_HEIGHT, x, y + TASK_HEIGHT - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();

      if (width > 40) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = '600 11px Noto Sans SC, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        const text = task.title.length > 12 ? task.title.slice(0, 10) + '...' : task.title;
        ctx.fillText(text, x + 8, y + TASK_HEIGHT / 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${task.durationDays}d`, x + width - 8, y + TASK_HEIGHT / 2);
      }

      if (task.status === 'completed') {
        ctx.fillStyle = 'rgba(80, 250, 123, 0.8)';
        ctx.beginPath();
        ctx.arc(x + width - 8, y + 8, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (task.status === 'in_progress') {
        ctx.fillStyle = 'rgba(139, 233, 253, 0.8)';
        ctx.beginPath();
        ctx.arc(x + width - 8, y + 8, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x, y, RESIZE_HANDLE_WIDTH, TASK_HEIGHT);
        ctx.fillRect(x + width - RESIZE_HANDLE_WIDTH, y, RESIZE_HANDLE_WIDTH, TASK_HEIGHT);
      }
    }

    ctx.restore();
  }, [projectTasks, minDate, totalDays, dateToX, dragState, selectedTaskId]);

  useEffect(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(render);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [render]);

  const hitTest = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) + scrollLeft.current;
    const y = clientY - rect.top;

    for (let i = 0; i < projectTasks.length; i++) {
      const task = projectTasks[i];
      const tx = dateToX(task.startDate);
      const ty = TOP_PADDING + i * ROW_HEIGHT + 4;
      const tw = Math.max(DAY_WIDTH, task.durationDays * DAY_WIDTH);

      if (y >= ty && y <= ty + TASK_HEIGHT) {
        if (x >= tx && x <= tx + RESIZE_HANDLE_WIDTH) {
          return { type: 'resize-left' as const, task };
        }
        if (x >= tx + tw - RESIZE_HANDLE_WIDTH && x <= tx + tw) {
          return { type: 'resize-right' as const, task };
        }
        if (x >= tx && x <= tx + tw) {
          return { type: 'move' as const, task };
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      e.preventDefault();
      if (hit.type === 'move') {
        onTaskClick(hit.task);
      }
      setDragState({
        type: hit.type,
        taskId: hit.task.id,
        startX: e.clientX,
        startTask: hit.task,
        startDate: hit.task.startDate,
      });
    } else {
      const rect = canvasRef.current?.getBoundingClientRect();
      const y = e.clientY - (rect?.top || 0);
      for (let i = 0; i < projectTasks.length; i++) {
        const ty = TOP_PADDING + i * ROW_HEIGHT + 4;
        if (y >= ty && y <= ty + TASK_HEIGHT) {
          onTaskClick(projectTasks[i]);
          break;
        }
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.type || !dragState.startTask) return;

    const dx = e.clientX - dragState.startX;
    const dayDelta = Math.round(dx / DAY_WIDTH);

    if (dragState.type === 'move') {
      const newStart = dragState.startDate + dayDelta * DAY_MS;
      updateTask(dragState.taskId!, { startDate: newStart });
    } else if (dragState.type === 'resize-right') {
      const newDuration = Math.max(1, dragState.startTask.durationDays + dayDelta);
      updateTask(dragState.taskId!, { durationDays: newDuration });
    } else if (dragState.type === 'resize-left') {
      const newStart = dragState.startDate + dayDelta * DAY_MS;
      const newDuration = Math.max(1, dragState.startTask.durationDays - dayDelta);
      const endDate = dragState.startDate + dragState.startTask.durationDays * DAY_MS;
      if (newStart + newDuration * DAY_MS >= endDate || newStart < endDate) {
        updateTask(dragState.taskId!, {
          startDate: newStart,
          durationDays: newDuration,
        });
      }
    }
  }, [dragState, updateTask]);

  const handleMouseUp = useCallback(() => {
    setDragState({ type: null, taskId: null, startX: 0, startTask: null, startDate: 0 });
  }, []);

  useEffect(() => {
    if (dragState.type) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.type, handleMouseMove, handleMouseUp]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollLeft.current = e.currentTarget.scrollLeft;
    const viewportStart = scrollLeft.current;
    const viewportEnd = scrollLeft.current + (containerRef.current?.clientWidth || 0);

    let startIdx = 0;
    let endIdx = projectTasks.length - 1;
    for (let i = 0; i < projectTasks.length; i++) {
      const y = TOP_PADDING + i * ROW_HEIGHT;
      if (y < viewportStart / 10) startIdx = Math.max(0, i - 5);
      if (y > viewportEnd / 10) {
        endIdx = Math.min(projectTasks.length - 1, i + 5);
        break;
      }
    }
    visibleStartIdx.current = startIdx;
    visibleEndIdx.current = endIdx;
    render();
  };

  return (
    <div
      ref={containerRef}
      className="w-full overflow-auto scrollbar-thin relative"
      onScroll={handleScroll}
      style={{ maxHeight: 'calc(100vh - 300px)' }}
    >
      <canvas
        ref={canvasRef}
        className={cn('gantt-canvas select-none', dragState.type ? 'dragging' : '')}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}

