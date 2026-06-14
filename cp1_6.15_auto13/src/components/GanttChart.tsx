import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import useStore from '@/store/useStore';
import { validateTimeline, calculateTaskPosition, formatDateForGantt, getDaysBetween } from '@/services/GraphService';
import type { Task } from '@/store/useStore';

interface DragState {
  taskId: string;
  mode: 'move' | 'left' | 'right';
  startX: number;
  originalStart: string;
  originalEnd: string;
  currentStart: string;
  currentEnd: string;
}

interface TooltipState {
  visible: boolean;
  task: Task | null;
  x: number;
  y: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  angle: number;
}

const DAY_WIDTH = 28;
const ROW_HEIGHT = 48;
const LABEL_WIDTH = 200;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const GanttChart: React.FC = () => {
  const { tasks, updateTask, selectedRoomId } = useStore();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, task: null, x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animatingChecks, setAnimatingChecks] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  const displayTasks = useMemo(() => {
    if (!dragState) return tasks;
    return tasks.map((t) =>
      t.id === dragState.taskId
        ? { ...t, plannedStart: dragState.currentStart, plannedEnd: dragState.currentEnd }
        : t
    );
  }, [tasks, dragState]);

  const conflicts = useMemo(() => validateTimeline(displayTasks), [displayTasks]);

  const conflictTaskIds = useMemo(() => {
    const ids = new Set<string>();
    conflicts.forEach((c) => {
      ids.add(c.taskId1);
      ids.add(c.taskId2);
    });
    return ids;
  }, [conflicts]);

  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (displayTasks.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      const end = new Date(today);
      end.setDate(end.getDate() + 14);
      return {
        timelineStart: start,
        timelineEnd: end,
        totalDays: 21,
      };
    }
    let minDate = new Date(displayTasks[0].plannedStart);
    let maxDate = new Date(displayTasks[0].plannedEnd);
    displayTasks.forEach((t) => {
      const s = new Date(t.plannedStart);
      const e = new Date(t.plannedEnd);
      if (s < minDate) minDate = s;
      if (e > maxDate) maxDate = e;
    });
    minDate = new Date(minDate);
    minDate.setDate(minDate.getDate() - 2);
    maxDate = new Date(maxDate);
    maxDate.setDate(maxDate.getDate() + 2);
    const days = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return { timelineStart: minDate, timelineEnd: maxDate, totalDays: days };
  }, [displayTasks]);

  const headerDays = useMemo(() => {
    const days: { date: Date; label: string; isFirstOfMonth: boolean; monthLabel: string }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(timelineStart);
      d.setDate(d.getDate() + i);
      const isFirst = d.getDate() === 1 || i === 0;
      const monthLabel = `${d.getMonth() + 1}月`;
      days.push({
        date: d,
        label: String(d.getDate()),
        isFirstOfMonth: isFirst,
        monthLabel,
      });
    }
    return days;
  }, [timelineStart, totalDays]);

  const monthGroups = useMemo(() => {
    const groups: { label: string; span: number }[] = [];
    let currentMonth = -1;
    let currentSpan = 0;
    headerDays.forEach((d) => {
      const month = d.date.getMonth();
      if (month !== currentMonth) {
        if (currentMonth !== -1) {
          groups.push({ label: `${currentMonth + 1}月`, span: currentSpan });
        }
        currentMonth = month;
        currentSpan = 1;
      } else {
        currentSpan++;
      }
    });
    if (currentMonth !== -1) {
      groups.push({ label: `${currentMonth + 1}月`, span: currentSpan });
    }
    return groups;
  }, [headerDays]);

  const getTaskPosition = useCallback(
    (task: { plannedStart: string; plannedEnd: string }) => {
      const startDate = new Date(task.plannedStart);
      const endDate = new Date(task.plannedEnd);
      const startDiff = Math.ceil((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
      const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return { left: startDiff * DAY_WIDTH, width: duration * DAY_WIDTH };
    },
    [timelineStart]
  );

  const handleMouseDown = (e: React.MouseEvent, task: Task, mode: 'move' | 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      taskId: task.id,
      mode,
      startX: e.clientX,
      originalStart: task.plannedStart,
      originalEnd: task.plannedEnd,
      currentStart: task.plannedStart,
      currentEnd: task.plannedEnd,
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX;
      const dayDelta = Math.round(dx / DAY_WIDTH);

      if (dragState.mode === 'move') {
        const newStart = addDays(dragState.originalStart, dayDelta);
        const newEnd = addDays(dragState.originalEnd, dayDelta);
        setDragState((prev) => (prev ? { ...prev, currentStart: newStart, currentEnd: newEnd } : prev));
      } else if (dragState.mode === 'left') {
        const newStart = addDays(dragState.originalStart, dayDelta);
        if (new Date(newStart) < new Date(dragState.currentEnd)) {
          setDragState((prev) => (prev ? { ...prev, currentStart: newStart } : prev));
        }
      } else if (dragState.mode === 'right') {
        const newEnd = addDays(dragState.originalEnd, dayDelta);
        if (new Date(newEnd) > new Date(dragState.currentStart)) {
          setDragState((prev) => (prev ? { ...prev, currentEnd: newEnd } : prev));
        }
      }
    };

    const handleMouseUp = async () => {
      if (dragState && selectedRoomId) {
        await updateTask(selectedRoomId, dragState.taskId, {
          plannedStart: dragState.currentStart,
          plannedEnd: dragState.currentEnd,
        });
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, selectedRoomId, updateTask]);

  const toggleComplete = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedRoomId) return;

    const newCompleted = !task.completed;
    const today = new Date().toISOString().split('T')[0];

    setAnimatingChecks((prev) => {
      const next = new Set(prev);
      if (newCompleted) next.add(task.id);
      return next;
    });

    if (newCompleted) {
      spawnParticles(e.clientX, e.clientY);
    }

    setTimeout(() => {
      setAnimatingChecks((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }, 800);

    await updateTask(selectedRoomId, task.id, {
      completed: newCompleted,
      actualEnd: newCompleted ? today : task.actualEnd,
      actualStart: newCompleted && !task.actualStart ? today : task.actualStart,
    });
  };

  const spawnParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: `p-${particleIdRef.current++}`,
        x,
        y,
        angle: (i / 8) * Math.PI * 2,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 800);
  };

  const handleTooltipEnter = (task: Task, e: React.MouseEvent) => {
    setTooltip({
      visible: true,
      task,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleTooltipMove = (e: React.MouseEvent) => {
    if (tooltip.visible) {
      setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
    }
  };

  const handleTooltipLeave = () => {
    setTooltip({ visible: false, task: null, x: 0, y: 0 });
  };

  if (displayTasks.length === 0) {
    return (
      <div className="bg-white rounded-xl card-shadow p-8 text-center">
        <h2 className="serif text-2xl mb-4" style={{ color: '#5A4524' }}>施工进度甘特图</h2>
        <p style={{ color: '#8B7355' }}>暂无任务数据</p>
      </div>
    );
  }

  const timelineWidth = totalDays * DAY_WIDTH;

  return (
    <div
      className="bg-white rounded-xl card-shadow"
      style={{ padding: '24px', border: '1px solid #E8D5B8' }}
    >
      <h2 className="serif text-2xl mb-4" style={{ color: '#5A4524' }}>施工进度甘特图</h2>

      <div className="relative overflow-auto" ref={scrollRef}>
        <div style={{ minWidth: LABEL_WIDTH + timelineWidth }}>
          <div className="sticky top-0 z-20 bg-white" style={{ borderBottom: '1px solid #E8D5B8' }}>
            <div style={{ display: 'flex', height: '28px' }}>
              <div
                style={{
                  width: LABEL_WIDTH,
                  minWidth: LABEL_WIDTH,
                  borderRight: '1px solid #E8D5B8',
                  background: '#FAF6F0',
                }}
              />
              <div style={{ display: 'flex', height: '100%' }}>
                {monthGroups.map((g, idx) => (
                  <div
                    key={idx}
                    className="serif"
                    style={{
                      width: g.span * DAY_WIDTH,
                      minWidth: g.span * DAY_WIDTH,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5A4524',
                      borderRight: '1px solid #E8D5B8',
                      background: '#FAF6F0',
                    }}
                  >
                    {g.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', height: '28px' }}>
              <div
                style={{
                  width: LABEL_WIDTH,
                  minWidth: LABEL_WIDTH,
                  borderRight: '1px solid #E8D5B8',
                  borderBottom: '1px solid #E8D5B8',
                  background: '#FAF6F0',
                }}
              />
              <div style={{ display: 'flex', height: '100%' }}>
                {headerDays.map((d, idx) => {
                  const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: DAY_WIDTH,
                        minWidth: DAY_WIDTH,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: isWeekend ? '#C4A070' : '#5A4524',
                        borderRight: '1px solid #F0E4D0',
                        borderBottom: '1px solid #E8D5B8',
                        background: isWeekend ? '#FAF6F0' : '#FFFFFF',
                        fontWeight: d.isFirstOfMonth ? 600 : 400,
                      }}
                    >
                      {d.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            {displayTasks.map((task) => {
              const { left, width } = getTaskPosition(task);
              const isConflict = conflictTaskIds.has(task.id);
              const isDragging = dragState?.taskId === task.id;
              const isAnimatingCheck = animatingChecks.has(task.id);

              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    height: ROW_HEIGHT,
                    borderBottom: '1px solid #F0E4D0',
                  }}
                >
                  <div
                    style={{
                      width: LABEL_WIDTH,
                      minWidth: LABEL_WIDTH,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0 12px',
                      borderRight: '1px solid #E8D5B8',
                      background: '#FFFCF7',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                    }}
                  >
                    <button
                      onClick={(e) => toggleComplete(task, e)}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: task.completed ? 'none' : '2px solid #D4B896',
                        background: task.completed ? '#7CB342' : 'white',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                        padding: 0,
                      }}
                    >
                      {(task.completed || isAnimatingCheck) && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          className={isAnimatingCheck ? 'check-icon-svg' : ''}
                        >
                          <path
                            d="M5 13L9 17L19 7"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={
                              !isAnimatingCheck
                                ? { strokeDasharray: 'none', strokeDashoffset: 0 }
                                : undefined
                            }
                          />
                        </svg>
                      )}
                    </button>
                    <span
                      className="serif"
                      style={{
                        fontSize: '13px',
                        color: '#5A4524',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        opacity: task.completed ? 0.6 : 1,
                      }}
                    >
                      {task.name}
                    </span>
                    {isConflict && (
                      <span
                        style={{
                          background: '#FF8C00',
                          color: 'white',
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        !
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      position: 'relative',
                      flex: 1,
                      minWidth: timelineWidth,
                      height: ROW_HEIGHT,
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
                      {headerDays.map((d, idx) => {
                        const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6;
                        return (
                          <div
                            key={idx}
                            style={{
                              width: DAY_WIDTH,
                              minWidth: DAY_WIDTH,
                              height: '100%',
                              borderRight: '1px solid #F5EDE0',
                              background: isWeekend ? '#FFFCF7' : 'transparent',
                            }}
                          />
                        );
                      })}
                    </div>

                    {task.actualStart && task.actualEnd && (() => {
                      const actualPos = getTaskPosition({ plannedStart: task.actualStart, plannedEnd: task.actualEnd });
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            top: `${(ROW_HEIGHT - 24) / 2 + 18}px`,
                            left: `${actualPos.left}px`,
                            width: `${Math.max(actualPos.width, 4)}px`,
                            height: '4px',
                            borderRadius: '2px',
                            background: '#7CB342',
                            opacity: 0.8,
                          }}
                        />
                      );
                    })()}

                    <div
                      className={`gantt-task-bar ${isConflict ? 'conflict-highlight' : ''}`}
                      onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                      onMouseEnter={(e) => handleTooltipEnter(task, e)}
                      onMouseMove={handleTooltipMove}
                      onMouseLeave={handleTooltipLeave}
                      style={{
                        position: 'absolute',
                        top: `${(ROW_HEIGHT - 24) / 2}px`,
                        left: `${left}px`,
                        width: `${Math.max(width, 12)}px`,
                        height: '24px',
                        borderRadius: '6px',
                        background: isConflict
                          ? undefined
                          : task.completed
                            ? 'linear-gradient(135deg, #A5D6A7 0%, #7CB342 100%)'
                            : 'linear-gradient(135deg, #D4B896 0%, #8B6914 100%)',
                        boxShadow: isDragging
                          ? '0 8px 20px rgba(139, 105, 20, 0.3)'
                          : '0 2px 6px rgba(139, 105, 20, 0.15)',
                        opacity: isDragging ? 0.85 : 1,
                        transform: isDragging ? 'scale(1.02)' : undefined,
                        transition: isDragging ? 'none' : 'all 0.15s ease',
                        zIndex: isDragging ? 15 : 5,
                        cursor: isDragging ? 'grabbing' : 'grab',
                      }}
                    >
                      <div
                        onMouseDown={(e) => handleMouseDown(e, task, 'left')}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '6px',
                          height: '100%',
                          cursor: 'col-resize',
                          borderRadius: '6px 0 0 6px',
                        }}
                      />
                      <div
                        onMouseDown={(e) => handleMouseDown(e, task, 'right')}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '6px',
                          height: '100%',
                          cursor: 'col-resize',
                          borderRadius: '0 6px 6px 0',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 'calc(100% - 16px)',
                          pointerEvents: 'none',
                        }}
                      >
                        {width > 60 ? task.name : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {tooltip.visible && tooltip.task && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'fixed',
            top: `${tooltip.y + 16}px`,
            left: `${tooltip.x + 16}px`,
            background: 'white',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 8px 24px rgba(139, 105, 20, 0.2)',
            zIndex: 9999,
            pointerEvents: 'none',
            minWidth: '200px',
            maxWidth: '280px',
            border: '1px solid #E8D5B8',
          }}
        >
          <div className="serif" style={{ fontSize: '15px', fontWeight: 600, color: '#5A4524', marginBottom: '8px' }}>
            {tooltip.task.name}
          </div>
          <div style={{ fontSize: '12px', color: '#8B7355', lineHeight: 1.8 }}>
            <div>负责人：{tooltip.task.assignee || '-'}</div>
            <div>备注：{tooltip.task.note || '-'}</div>
            <div>
              计划：{formatDateForGantt(tooltip.task.plannedStart)} - {formatDateForGantt(tooltip.task.plannedEnd)}（
              {getDaysBetween(tooltip.task.plannedStart, tooltip.task.plannedEnd)}天）
            </div>
            {tooltip.task.completed && tooltip.task.actualEnd && (
              <div style={{ color: '#7CB342' }}>实际完成：{formatDateForGantt(tooltip.task.actualEnd)}</div>
            )}
          </div>
        </div>
      )}

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            top: `${p.y}px`,
            left: `${p.x}px`,
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#7CB342',
            pointerEvents: 'none',
            zIndex: 10000,
            animation: 'particleBurst 0.8s ease-out forwards',
            ['--angle' as any]: `${p.angle}rad`,
          }}
        />
      ))}

      <style>{`
        @keyframes particleBurst {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(
              calc(cos(var(--angle)) * 40px),
              calc(sin(var(--angle)) * 40px)
            ) scale(0.3);
          }
        }
        .gantt-task-bar:hover {
          transform: scale(1.03);
          box-shadow: 0 6px 16px rgba(139, 105, 20, 0.25) !important;
        }
      `}</style>
    </div>
  );
};

export default GanttChart;
