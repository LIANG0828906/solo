import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import useStore from '@/store/useStore';
import { validateTimeline, formatDateForGantt, getDaysBetween } from '@/services/GraphService';
import type { Task } from '@/store/useStore';
import { User, FileText, AlertTriangle } from 'lucide-react';

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

const DAY_WIDTH = 32;
const ROW_HEIGHT = 56;
const LABEL_WIDTH = 220;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const GanttChart: React.FC = () => {
  const { tasks, updateTask, selectedRoomId } = useStore();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, task: null, x: 0, y: 0 });
  const [animatingChecks, setAnimatingChecks] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);

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
      end.setDate(end.getDate() + 21);
      return { timelineStart: start, timelineEnd: end, totalDays: 28 };
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
    minDate.setDate(minDate.getDate() - 3);
    maxDate = new Date(maxDate);
    maxDate.setDate(maxDate.getDate() + 3);
    const days = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return { timelineStart: minDate, timelineEnd: maxDate, totalDays: days };
  }, [displayTasks]);

  const headerDays = useMemo(() => {
    const days: {
      date: Date;
      label: string;
      isFirstOfMonth: boolean;
      monthLabel: string;
      isWeekend: boolean;
      isToday: boolean;
    }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(timelineStart);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const isFirst = d.getDate() === 1 || i === 0;
      const monthLabel = `${d.getMonth() + 1}月`;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isToday = d.getTime() === today.getTime();
      days.push({ date: d, label: String(d.getDate()), isFirstOfMonth: isFirst, monthLabel, isWeekend, isToday });
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
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(task.plannedEnd);
      endDate.setHours(0, 0, 0, 0);
      const startDiff = Math.round((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
      const duration = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
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
        const endDate = new Date(dragState.currentEnd);
        const startDate = new Date(newStart);
        if (startDate < endDate) {
          setDragState((prev) => (prev ? { ...prev, currentStart: newStart } : prev));
        }
      } else if (dragState.mode === 'right') {
        const newEnd = addDays(dragState.originalEnd, dayDelta);
        const startDate = new Date(dragState.currentStart);
        const endDate = new Date(newEnd);
        if (endDate > startDate) {
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

    if (newCompleted) {
      setAnimatingChecks((prev) => {
        const next = new Set(prev);
        next.add(task.id);
        return next;
      });
      spawnParticles(e.clientX, e.clientY);
    }

    setTimeout(() => {
      setAnimatingChecks((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }, 1000);

    await updateTask(selectedRoomId, task.id, {
      completed: newCompleted,
      actualEnd: newCompleted ? today : null,
      actualStart: newCompleted && !task.actualStart ? today : task.actualStart,
    });
  };

  const spawnParticles = (x: number, y: number) => {
    if (!particleContainerRef.current) return;
    const container = particleContainerRef.current;
    const colors = ['#7CB342', '#AED581', '#8BC34A', '#FFD54F', '#FFB74D'];

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      const angle = (i / 12) * Math.PI * 2;
      const velocity = 2 + Math.random() * 3;
      const size = 3 + Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        pointer-events: none;
        z-index: 10000;
        box-shadow: 0 0 6px ${color};
      `;

      container.appendChild(particle);

      let posX = 0;
      let posY = 0;
      let velY = -velocity;
      let velX = Math.cos(angle) * velocity;
      let alpha = 1;
      let frame = 0;

      const animate = () => {
        frame++;
        posX += velX;
        posY += velY;
        velY += 0.15;
        alpha -= 0.025;

        particle.style.transform = `translate(${posX}px, ${posY}px)`;
        particle.style.opacity = String(Math.max(0, alpha));

        if (alpha > 0 && frame < 60) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      };

      requestAnimationFrame(animate);
    }
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
      <div
        className="text-center"
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px 24px',
          boxShadow: '0 4px 12px rgba(139, 105, 20, 0.08)',
          border: '1px solid #F0E4D0',
        }}
      >
        <h2 className="serif text-2xl mb-4" style={{ color: '#5A4524' }}>
          施工进度甘特图
        </h2>
        <p style={{ color: '#8B7355' }}>暂无任务数据</p>
      </div>
    );
  }

  const timelineWidth = totalDays * DAY_WIDTH;

  const completedCount = displayTasks.filter((t) => t.completed).length;
  const progress = Math.round((completedCount / displayTasks.length) * 100);

  return (
    <div
      ref={particleContainerRef}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(139, 105, 20, 0.08)',
        border: '1px solid #F0E4D0',
      }}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="serif text-2xl" style={{ color: '#5A4524' }}>
          施工进度甘特图
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: '#8B7355' }}>
            总任务：<span style={{ color: '#5A4524', fontWeight: 600 }}>{displayTasks.length}</span> 项
          </span>
          <span style={{ color: '#8B7355' }}>
            已完成：
            <span style={{ color: '#7CB342', fontWeight: 600 }}>{completedCount}</span> 项
          </span>
          <span style={{ color: '#7CB342', fontWeight: 600 }}>{progress}%</span>
          {conflicts.length > 0 && (
            <span
              className="flex items-center gap-1 px-3 py-1 rounded-full animate-fadeIn"
              style={{ background: 'rgba(255, 140, 0, 0.1)', color: '#FF8C00', fontWeight: 500 }}
            >
              <AlertTriangle size={14} />
              {conflicts.length} 个时间冲突
            </span>
          )}
        </div>
      </div>

      <div className="relative overflow-auto rounded-lg" ref={scrollRef} style={{ border: '1px solid #E8D5B8' }}>
        <div style={{ minWidth: LABEL_WIDTH + timelineWidth }}>
          <div className="sticky top-0 z-20 bg-white">
            <div style={{ display: 'flex', height: '32px', borderBottom: '1px solid #E8D5B8' }}>
              <div
                className="serif"
                style={{
                  width: LABEL_WIDTH,
                  minWidth: LABEL_WIDTH,
                  borderRight: '1px solid #E8D5B8',
                  background: '#FAF6F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#5A4524',
                }}
              >
                任务名称
              </div>
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

            <div style={{ display: 'flex', height: '28px', borderBottom: '1px solid #E8D5B8' }}>
              <div
                style={{
                  width: LABEL_WIDTH,
                  minWidth: LABEL_WIDTH,
                  borderRight: '1px solid #E8D5B8',
                  background: '#FAF6F0',
                }}
              />
              <div style={{ display: 'flex', height: '100%' }}>
                {headerDays.map((d, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: DAY_WIDTH,
                      minWidth: DAY_WIDTH,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: d.isToday ? '#8B6914' : d.isWeekend ? '#C4A070' : '#5A4524',
                      borderRight: '1px solid #F0E4D0',
                      borderBottom: '1px solid #E8D5B8',
                      background: d.isToday ? 'rgba(139, 105, 20, 0.08)' : d.isWeekend ? '#FAF6F0' : '#FFFFFF',
                      fontWeight: d.isFirstOfMonth ? 600 : d.isToday ? 700 : 400,
                    }}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {displayTasks.map((task, rowIdx) => {
              const { left, width } = getTaskPosition(task);
              const isConflict = conflictTaskIds.has(task.id);
              const isDragging = dragState?.taskId === task.id;
              const isAnimatingCheck = animatingChecks.has(task.id);
              const isTodayLine = false;

              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    height: `${ROW_HEIGHT}px`,
                    borderBottom: rowIdx < displayTasks.length - 1 ? '1px solid #F0E4D0' : 'none',
                    background: rowIdx % 2 === 0 ? '#FFFCF7' : '#FFFFFF',
                  }}
                >
                  <div
                    style={{
                      width: LABEL_WIDTH,
                      minWidth: LABEL_WIDTH,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '0 14px',
                      borderRight: '1px solid #E8D5B8',
                      background: rowIdx % 2 === 0 ? '#FFFCF7' : '#FAF6F0',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                    }}
                  >
                    <button
                      onClick={(e) => toggleComplete(task, e)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: task.completed ? 'none' : '2px solid #D4B896',
                        background: task.completed ? '#7CB342' : 'white',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        flexShrink: 0,
                        padding: 0,
                        boxShadow: task.completed ? '0 2px 8px rgba(124, 179, 66, 0.4)' : 'none',
                        transform: isAnimatingCheck ? 'scale(1.2)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!task.completed) {
                          e.currentTarget.style.borderColor = '#8B6914';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!task.completed) {
                          e.currentTarget.style.borderColor = '#D4B896';
                        }
                      }}
                    >
                      {(task.completed || isAnimatingCheck) && (
                        <svg
                          width="13"
                          height="13"
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
                            style={!isAnimatingCheck ? { strokeDasharray: 'none', strokeDashoffset: 0 } : undefined}
                          />
                        </svg>
                      )}
                    </button>
                    <span
                      className="serif"
                      style={{
                        fontSize: '14px',
                        color: task.completed ? '#9C8B70' : '#5A4524',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        fontWeight: 500,
                      }}
                    >
                      {task.name}
                    </span>
                    {isConflict && (
                      <div
                        className="animate-fadeIn"
                        title="时间冲突"
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#FF8C00',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(255, 140, 0, 0.4)',
                        }}
                      >
                        !
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      position: 'relative',
                      flex: 1,
                      minWidth: timelineWidth,
                      height: `${ROW_HEIGHT}px`,
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
                      {headerDays.map((d, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: DAY_WIDTH,
                            minWidth: DAY_WIDTH,
                            height: '100%',
                            borderRight: d.isToday ? '2px solid #8B6914' : `1px solid ${d.isWeekend ? '#F0E4D0' : '#F8F1E6'}`,
                            background: d.isWeekend ? 'rgba(250, 246, 240, 0.5)' : 'transparent',
                          }}
                        />
                      ))}
                    </div>

                    {task.actualStart && task.actualEnd && (() => {
                      const actualPos = getTaskPosition({ plannedStart: task.actualStart, plannedEnd: task.actualEnd });
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            top: `${ROW_HEIGHT - 12}px`,
                            left: `${actualPos.left}px`,
                            width: `${Math.max(actualPos.width, 4)}px`,
                            height: '6px',
                            borderRadius: '3px',
                            background: 'linear-gradient(90deg, #81C784, #4CAF50)',
                            opacity: 0.9,
                            boxShadow: '0 1px 3px rgba(76, 175, 80, 0.3)',
                          }}
                        />
                      );
                    })()}

                    <div
                      className={`gantt-task-bar ${isConflict ? 'conflict-bar' : ''}`}
                      onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                      onMouseEnter={(e) => handleTooltipEnter(task, e)}
                      onMouseMove={handleTooltipMove}
                      onMouseLeave={handleTooltipLeave}
                      style={{
                        position: 'absolute',
                        top: `${(ROW_HEIGHT - 28) / 2 - 4}px`,
                        left: `${left}px`,
                        width: `${Math.max(width, 16)}px`,
                        height: '28px',
                        borderRadius: '8px',
                        background: isConflict
                          ? 'repeating-linear-gradient(45deg, rgba(255, 140, 0, 0.2), rgba(255, 140, 0, 0.2) 6px, rgba(255, 204, 128, 0.2) 6px, rgba(255, 204, 128, 0.2) 12px)'
                          : task.completed
                            ? 'linear-gradient(135deg, #A5D6A7 0%, #66BB6A 100%)'
                            : 'linear-gradient(135deg, #D4B896 0%, #A67C00 100%)',
                        border: isConflict ? '2px solid #FF8C00' : 'none',
                        boxShadow: isConflict
                          ? '0 4px 12px rgba(255, 140, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                          : isDragging
                            ? '0 10px 24px rgba(139, 105, 20, 0.35)'
                            : '0 3px 10px rgba(139, 105, 20, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        opacity: isDragging ? 0.9 : 1,
                        transform: isDragging ? 'scale(1.04)' : undefined,
                        transition: isDragging ? 'none' : 'all 0.2s ease',
                        zIndex: isDragging ? 15 : isConflict ? 8 : 5,
                        cursor: isDragging ? 'grabbing' : 'grab',
                      }}
                    >
                      <div
                        onMouseDown={(e) => handleMouseDown(e, task, 'left')}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '8px',
                          height: '100%',
                          cursor: 'col-resize',
                          borderRadius: '8px 0 0 8px',
                          borderLeft: isConflict ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                        }}
                      />
                      <div
                        onMouseDown={(e) => handleMouseDown(e, task, 'right')}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '8px',
                          height: '100%',
                          cursor: 'col-resize',
                          borderRadius: '0 8px 8px 0',
                          borderRight: isConflict ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 'calc(100% - 20px)',
                          pointerEvents: 'none',
                          textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                        }}
                      >
                        {width > 70 ? task.name : ''}
                      </div>
                      {task.completed && width > 50 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: '8px',
                            transform: 'translateY(-50%)',
                            color: 'white',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 flex-wrap text-xs" style={{ color: '#8B7355' }}>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '16px',
              height: '10px',
              borderRadius: '3px',
              background: 'linear-gradient(135deg, #D4B896 0%, #A67C00 100%)',
            }}
          />
          <span>计划任务</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '16px',
              height: '10px',
              borderRadius: '3px',
              background: 'linear-gradient(135deg, #A5D6A7 0%, #66BB6A 100%)',
            }}
          />
          <span>已完成</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '16px',
              height: '4px',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, #81C784, #4CAF50)',
            }}
          />
          <span>实际工期</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '16px',
              height: '10px',
              borderRadius: '3px',
              background: 'repeating-linear-gradient(45deg, rgba(255, 140, 0, 0.3), rgba(255, 140, 0, 0.3) 3px, rgba(255, 204, 128, 0.3) 3px, rgba(255, 204, 128, 0.3) 6px)',
              border: '2px solid #FF8C00',
            }}
          />
          <span>时间冲突</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: '2px', height: '14px', background: '#8B6914' }} />
          <span>今日</span>
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
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 12px 32px rgba(139, 105, 20, 0.25)',
            zIndex: 9999,
            pointerEvents: 'none',
            minWidth: '220px',
            maxWidth: '300px',
            border: '1px solid #E8D5B8',
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#5A4524',
              marginBottom: '10px',
              paddingBottom: '8px',
              borderBottom: '1px solid #F0E4D0',
            }}
          >
            {tooltip.task.name}
            {tooltip.task.completed && (
              <span
                className="inline-block ml-2"
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#E8F5E9',
                  color: '#7CB342',
                  fontWeight: 500,
                  verticalAlign: 'middle',
                }}
              >
                已完成
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: '#5A4524', lineHeight: 1.9 }}>
            <div className="flex items-start gap-2">
              <User size={14} style={{ color: '#8B7355', marginTop: '4px', flexShrink: 0 }} />
              <span>负责人：{tooltip.task.assignee || '—'}</span>
            </div>
            <div className="flex items-start gap-2">
              <FileText size={14} style={{ color: '#8B7355', marginTop: '4px', flexShrink: 0 }} />
              <span>备注：{tooltip.task.note || '—'}</span>
            </div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #F0E4D0' }}>
              <div style={{ color: '#8B7355', marginBottom: '4px' }}>
                计划工期：
                <span style={{ color: '#5A4524', fontWeight: 500 }}>
                  {formatDateForGantt(tooltip.task.plannedStart)} - {formatDateForGantt(tooltip.task.plannedEnd)}
                </span>
                <span style={{ color: '#8B7355', marginLeft: '6px' }}>
                  （{getDaysBetween(tooltip.task.plannedStart, tooltip.task.plannedEnd)}天）
                </span>
              </div>
              {tooltip.task.completed && tooltip.task.actualEnd && (
                <div style={{ color: '#7CB342' }}>
                  实际完成：{formatDateForGantt(tooltip.task.actualEnd)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gantt-task-bar:hover {
          transform: scale(1.05) translateY(-1px);
          box-shadow: 0 8px 20px rgba(139, 105, 20, 0.3) !important;
          z-index: 20 !important;
        }
        .conflict-bar:hover {
          box-shadow: 0 8px 20px rgba(255, 140, 0, 0.4) !important;
        }
      `}</style>
    </div>
  );
};

export default GanttChart;
