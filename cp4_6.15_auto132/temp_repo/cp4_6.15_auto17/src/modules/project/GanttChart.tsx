import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Task } from '@/shared/types';
import { useStore, type StoreState } from '@/shared/store';
import { cn } from '@/lib/utils';

const DAY_MS = 24 * 60 * 60 * 1000;
const TASK_HEIGHT = 36;
const TASK_GAP = 8;
const ROW_HEIGHT = TASK_HEIGHT + TASK_GAP;
const LEFT_PADDING = 200;
const TOP_PADDING = 64;
const DAY_WIDTH = 36;
const RESIZE_HANDLE = 8;

const GRADIENT_COLORS: [string, string][] = [
  ['#e94560', '#ff6b81'],
  ['#8be9fd', '#50fa7b'],
  ['#bd93f9', '#ff79c6'],
  ['#ffb86c', '#f1fa8c'],
  ['#50fa7b', '#8be9fd'],
  ['#ff79c6', '#bd93f9'],
  ['#f1fa8c', '#ffb86c'],
];

interface GanttChartProps {
  projectId: string;
  onTaskClick: (task: Task) => void;
  selectedTaskId: string | null;
}

type DragType = null | 'move' | 'resize-left' | 'resize-right';

interface HitResult {
  type: 'move' | 'resize-left' | 'resize-right';
  task: Task;
}

export default function GanttChart({ projectId, onTaskClick, selectedTaskId }: GanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const updateTask = useStore((s) => s.updateTask) as StoreState['updateTask'];

  const _tasks = useStore.getState().tasks.filter((t) => t.projectId === projectId);
  _tasks.sort((a, b) => a.order - b.order);
  const tasksRef = useRef<Task[]>(_tasks);
  const selectedRef = useRef<string | null>(selectedTaskId);
  selectedRef.current = selectedTaskId;
  const [, forceRender] = useState(0);

  useEffect(() => {
    const checkUpdate = () => {
      const s = useStore.getState();
      const newTasks = s.tasks.filter((t) => t.projectId === projectId);
      newTasks.sort((a, b) => a.order - b.order);
      const prev = tasksRef.current;
      if (
        prev.length !== newTasks.length ||
        prev.some((t, i) => {
          const n = newTasks[i];
          return (
            t.id !== n.id ||
            t.startDate !== n.startDate ||
            t.durationDays !== n.durationDays ||
            t.title !== n.title ||
            t.status !== n.status ||
            t.dependencyIds.join(',') !== n.dependencyIds.join(',')
          );
        })
      ) {
        tasksRef.current = newTasks;
        forceRender((x) => x + 1);
      }
    };
    checkUpdate();
    const unsub = useStore.subscribe(checkUpdate);
    return unsub;
  }, [projectId]);

  const tasks = tasksRef.current;

  const startEndRef = useRef<{ start: number; end: number }>({
    start: useStore.getState().projects.find((x) => x.id === projectId)?.startDate ?? Date.now(),
    end: useStore.getState().projects.find((x) => x.id === projectId)?.endDate ?? Date.now() + 30 * DAY_MS,
  });
  const [, forceRender2] = useState(0);

  useEffect(() => {
    const check = () => {
      const p = useStore.getState().projects.find((x) => x.id === projectId);
      if (p) {
        if (p.startDate !== startEndRef.current.start || p.endDate !== startEndRef.current.end) {
          startEndRef.current = { start: p.startDate, end: p.endDate };
          forceRender2((x) => x + 1);
        }
      }
    };
    check();
    const unsub = useStore.subscribe(check);
    return unsub;
  }, [projectId]);

  const projectStartDate = startEndRef.current.start;
  const projectEndDate = startEndRef.current.end;

  const [drag, setDrag] = useState<{
    type: DragType;
    taskId: string | null;
    startClientX: number;
    origStartDate: number;
    origDurationDays: number;
  }>({
    type: null,
    taskId: null,
    startClientX: 0,
    origStartDate: 0,
    origDurationDays: 0,
  });

  const dragRef = useRef(drag);
  dragRef.current = drag;

  const { minDate, totalDays } = useMemo(() => {
    const allDates: number[] = [projectStartDate, projectEndDate];
    for (const task of tasks) {
      allDates.push(task.startDate, task.startDate + task.durationDays * DAY_MS);
    }
    const min = Math.min(...allDates) - 2 * DAY_MS;
    const max = Math.max(...allDates) + 2 * DAY_MS;
    return {
      minDate: new Date(min).setHours(0, 0, 0, 0),
      totalDays: Math.max(14, Math.ceil((max - min) / DAY_MS)),
    };
  }, [tasks, projectStartDate, projectEndDate]);

  const scrollLeftRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const dateToX = useCallback((date: number) => {
    const days = (date - minDate) / DAY_MS;
    return LEFT_PADDING + days * DAY_WIDTH;
  }, [minDate]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const containerW = containerRef.current?.clientWidth ?? 1200;
    const rowCount = tasksRef.current.length;
    const height = TOP_PADDING + Math.max(rowCount * ROW_HEIGHT + 40, 260);
    const virtualW = LEFT_PADDING + totalDays * DAY_WIDTH + 40;
    const width = Math.max(containerW, virtualW);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const sl = scrollLeftRef.current;
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

    const drawStart = Math.max(0, Math.floor((sl - LEFT_PADDING) / DAY_WIDTH) - 1);
    const drawEnd = Math.min(totalDays, drawStart + Math.ceil(width / DAY_WIDTH) + 2);

    const currentTasks = tasksRef.current;
    for (let i = 0; i < currentTasks.length; i++) {
      const y = TOP_PADDING + i * ROW_HEIGHT;
      const zStripe = i % 2 === 0 ? 'rgba(22, 33, 62, 0.4)' : 'rgba(26, 58, 92, 0.25)';
      ctx.fillStyle = zStripe;
      ctx.fillRect(LEFT_PADDING, y, virtualW - LEFT_PADDING, ROW_HEIGHT);

      const task = currentTasks[i];
      ctx.fillStyle = '#e6e6e6';
      ctx.font = '500 12px Noto Sans SC, sans-serif';
      ctx.textBaseline = 'middle';
      const title = task.title.length > 18 ? task.title.slice(0, 16) + '…' : task.title;
      ctx.fillText(title, 12, y + TASK_HEIGHT / 2 + 2);

      if (selectedRef.current === task.id) {
        ctx.fillStyle = 'rgba(233, 69, 96, 0.12)';
        ctx.fillRect(0, y, LEFT_PADDING, ROW_HEIGHT);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, y + 1, LEFT_PADDING - 2, ROW_HEIGHT - 2);
      }
    }

    const startDay = new Date(minDate);
    startDay.setHours(0, 0, 0, 0);
    for (let d = drawStart; d <= drawEnd; d++) {
      const x = LEFT_PADDING + d * DAY_WIDTH;
      const cur = new Date(startDay.getTime() + d * DAY_MS);
      const isWeekend = cur.getDay() === 0 || cur.getDay() === 6;

      if (isWeekend) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.fillRect(x, TOP_PADDING, DAY_WIDTH, currentTasks.length * ROW_HEIGHT);
      }

      if (d % 1 === 0) {
        ctx.fillStyle = '#8892b0';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(cur.getDate()), x + DAY_WIDTH / 2, 8);

        if (cur.getDate() === 1 || d === 0) {
          const m = cur.toLocaleDateString('zh-CN', { month: 'short' });
          ctx.fillStyle = '#e6e6e6';
          ctx.font = '600 11px Outfit, sans-serif';
          ctx.fillText(m, x + DAY_WIDTH / 2, 28);
        }
      }

      ctx.strokeStyle = 'rgba(26, 58, 92, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, TOP_PADDING);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }

    const todayX = dateToX(new Date().setHours(0, 0, 0, 0));
    if (todayX >= LEFT_PADDING && todayX <= virtualW) {
      ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(todayX + 0.5, TOP_PADDING);
      ctx.lineTo(todayX + 0.5, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(233, 69, 96, 0.9)';
      ctx.beginPath();
      ctx.moveTo(todayX, TOP_PADDING - 12);
      ctx.lineTo(todayX - 5, TOP_PADDING - 4);
      ctx.lineTo(todayX + 5, TOP_PADDING - 4);
      ctx.closePath();
      ctx.fill();
    }

    type RT = { task: Task; x: number; y: number; w: number };
    const renderTasks: RT[] = currentTasks.map((t, i) => ({
      task: t,
      x: dateToX(t.startDate),
      y: TOP_PADDING + i * ROW_HEIGHT + 4,
      w: Math.max(DAY_WIDTH, t.durationDays * DAY_WIDTH),
    }));
    const taskMap = new Map(renderTasks.map((rt) => [rt.task.id, rt]));

    for (const rt of renderTasks) {
      for (const depId of rt.task.dependencyIds) {
        const from = taskMap.get(depId);
        if (!from) continue;

        const fx = from.x + from.w;
        const fy = from.y + TASK_HEIGHT / 2;
        const tx = rt.x;
        const ty = rt.y + TASK_HEIGHT / 2;

        const dx = Math.abs(tx - fx);
        const offset = Math.max(30, dx * 0.4);
        const cx1 = fx + offset;
        const cy1 = fy;
        const cx2 = tx - offset;
        const cy2 = ty;

        ctx.strokeStyle = 'rgba(139, 233, 253, 0.7)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty);
        ctx.stroke();

        const arrowSize = 8;
        const ax = tx - 2;
        const ay = ty;
        const tipX = ax;
        const tipY = ay;
        const ang = Math.atan2(cy2 - fy, cx2 - (fx + dx / 2));
        const baseAng = ang - Math.PI;
        const lx = tipX + arrowSize * Math.cos(baseAng - Math.PI / 6);
        const ly = tipY + arrowSize * Math.sin(baseAng - Math.PI / 6);
        const rx = tipX + arrowSize * Math.cos(baseAng + Math.PI / 6);
        const ry = tipY + arrowSize * Math.sin(baseAng + Math.PI / 6);

        ctx.fillStyle = 'rgba(139, 233, 253, 0.9)';
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(lx, ly);
        ctx.lineTo(rx, ry);
        ctx.closePath();
        ctx.fill();
      }
    }

    const draggingTaskId = dragRef.current.taskId;
    for (let i = 0; i < renderTasks.length; i++) {
      const { task, x, y, w } = renderTasks[i];
      const colors = GRADIENT_COLORS[i % GRADIENT_COLORS.length];
      const isDragging = draggingTaskId === task.id;
      const isSelected = selectedRef.current === task.id;

      ctx.save();
      if (isDragging) {
        ctx.globalAlpha = 0.85;
        ctx.shadowColor = 'rgba(233, 69, 96, 0.55)';
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 5;
      }

      const grad = ctx.createLinearGradient(x, y, x + w, y + TASK_HEIGHT);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      ctx.fillStyle = grad;

      const r = 6;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + TASK_HEIGHT - r);
      ctx.quadraticCurveTo(x + w, y + TASK_HEIGHT, x + w - r, y + TASK_HEIGHT);
      ctx.lineTo(x + r, y + TASK_HEIGHT);
      ctx.quadraticCurveTo(x, y + TASK_HEIGHT, x, y + TASK_HEIGHT - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();

      if (w > 32) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = '600 11px Noto Sans SC, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        const text = task.title.length > 10 ? task.title.slice(0, 8) + '…' : task.title;
        ctx.fillText(text, x + 8, y + TASK_HEIGHT / 2);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${task.durationDays}d`, x + w - 8, y + TASK_HEIGHT / 2);
      }

      if (task.status === 'completed') {
        ctx.fillStyle = 'rgba(80, 250, 123, 0.9)';
        ctx.beginPath();
        ctx.arc(x + w - 10, y + 10, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (task.status === 'in_progress') {
        ctx.fillStyle = 'rgba(139, 233, 253, 0.9)';
        ctx.beginPath();
        ctx.arc(x + w - 10, y + 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(x, y, RESIZE_HANDLE, TASK_HEIGHT);
        ctx.fillRect(x + w - RESIZE_HANDLE, y, RESIZE_HANDLE, TASK_HEIGHT);
      }
    }

    ctx.restore();
  }, [minDate, totalDays, dateToX]);

  const scheduleRender = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      render();
    });
  }, [render]);

  useEffect(() => {
    scheduleRender();
  });

  useEffect(() => {
    const onResize = () => scheduleRender();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [scheduleRender]);

  const hitTest = (clientX: number, clientY: number): HitResult | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left + scrollLeftRef.current;
    const y = clientY - rect.top;

    const currentTasks = tasksRef.current;
    for (let i = 0; i < currentTasks.length; i++) {
      const task = currentTasks[i];
      const tx = dateToX(task.startDate);
      const ty = TOP_PADDING + i * ROW_HEIGHT + 4;
      const tw = Math.max(DAY_WIDTH, task.durationDays * DAY_WIDTH);

      if (y >= ty && y <= ty + TASK_HEIGHT) {
        if (x >= tx && x <= tx + RESIZE_HANDLE) {
          return { type: 'resize-left', task };
        }
        if (x >= tx + tw - RESIZE_HANDLE && x <= tx + tw) {
          return { type: 'resize-right', task };
        }
        if (x >= tx && x <= tx + tw) {
          return { type: 'move', task };
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const hit = hitTest(e.clientX, e.clientY);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (hit) {
      e.preventDefault();
      onTaskClick(hit.task);
      setDrag({
        type: hit.type,
        taskId: hit.task.id,
        startClientX: e.clientX,
        origStartDate: hit.task.startDate,
        origDurationDays: hit.task.durationDays,
      });
    } else {
      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const currentTasks = tasksRef.current;
      for (let i = 0; i < currentTasks.length; i++) {
        const ty = TOP_PADDING + i * ROW_HEIGHT + 4;
        if (y >= ty && y <= ty + TASK_HEIGHT) {
          onTaskClick(currentTasks[i]);
          break;
        }
      }
    }
  };

  useEffect(() => {
    if (!drag.type) return;

    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d.type || !d.taskId) return;

      const deltaPx = e.clientX - d.startClientX;
      const daysDelta = Math.round(deltaPx / DAY_WIDTH);

      if (d.type === 'move') {
        const newStart = d.origStartDate + daysDelta * DAY_MS;
        updateTask(d.taskId, { startDate: newStart });
      } else if (d.type === 'resize-right') {
        const newDur = Math.max(1, d.origDurationDays + daysDelta);
        updateTask(d.taskId, { durationDays: newDur });
      } else if (d.type === 'resize-left') {
        const newStart = d.origStartDate + daysDelta * DAY_MS;
        const newDur = Math.max(1, d.origDurationDays - daysDelta);
        const originalEnd = d.origStartDate + d.origDurationDays * DAY_MS;
        const newEnd = newStart + newDur * DAY_MS;
        if (Math.abs(newEnd - originalEnd) <= DAY_MS * 0.5 || newStart < originalEnd) {
          updateTask(d.taskId, {
            startDate: newStart,
            durationDays: newDur,
          });
        }
      }
    };

    const onUp = () => {
      setDrag({
        type: null,
        taskId: null,
        startClientX: 0,
        origStartDate: 0,
        origDurationDays: 0,
      });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag.type, updateTask]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollLeftRef.current = e.currentTarget.scrollLeft;
    scheduleRender();
  };

  return (
    <div
      ref={containerRef}
      className="w-full overflow-auto scrollbar-thin"
      style={{ maxHeight: 'calc(100vh - 300px)' }}
      onScroll={onScroll}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          'gantt-canvas select-none',
          drag.type ? 'dragging' : '',
        )}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
