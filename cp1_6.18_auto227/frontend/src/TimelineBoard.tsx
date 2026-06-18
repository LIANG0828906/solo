import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from './store';
import { Task, Priority, UserCursor } from './types';
import { taskApi } from './api';
import { useWebSocket } from './useWebSocket';
import {
  MINUTES_15,
  HOUR,
  DAY,
  snapTo15Minutes,
  getPriorityColors,
  formatTime,
  getStartOfDay,
  getRandomCursorColor,
  timeToPixel,
  pixelToTime
} from './utils';
import { TaskEditor } from './components/TaskEditor';

const PIXELS_PER_HOUR = 120;
const TASK_HEIGHT_DESKTOP = 60;
const TASK_WIDTH_DESKTOP = 160;
const TASK_HEIGHT_MOBILE = 50;
const TASK_WIDTH_MOBILE = 120;
const TIMELINE_VERTICAL_OFFSET = 60;

interface DragState {
  isDragging: boolean;
  taskId: string | null;
  startX: number;
  startY: number;
  startLeft: number;
  originalStartTime: number;
  isNew: boolean;
}

export const TimelineBoard: React.FC = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const { sendCursorMove } = useWebSocket();
  const lastCursorSendRef = useRef<number>(0);
  const userColorRef = useRef<string>(getRandomCursorColor());

  const tasks = useAppStore((state) => state.tasks);
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const setSelectedTaskId = useAppStore((state) => state.setSelectedTaskId);
  const cursors = useAppStore((state) => state.cursors);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const setHoveredTaskId = useAppStore((state) => state.setHoveredTaskId);
  const zoom = useAppStore((state) => state.zoom);
  const setZoom = useAppStore((state) => state.setZoom);
  const panOffset = useAppStore((state) => state.panOffset);
  const setPanOffset = useAppStore((state) => state.setPanOffset);
  const addNotification = useAppStore((state) => state.addNotification);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    taskId: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    originalStartTime: 0,
    isNew: false
  });

  const [isMobile, setIsMobile] = useState(false);
  const [boardWidth, setBoardWidth] = useState(0);

  const baseTime = useMemo(() => getStartOfDay(Date.now()), []);

  const taskWidth = isMobile ? TASK_WIDTH_MOBILE : TASK_WIDTH_DESKTOP;
  const taskHeight = isMobile ? TASK_HEIGHT_MOBILE : TASK_HEIGHT_DESKTOP;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 750);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (boardRef.current) {
        setBoardWidth(boardRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(zoom + delta);
    } else {
      setPanOffset(panOffset - e.deltaY * 0.5);
    }
  }, [zoom, panOffset, setZoom, setPanOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = Date.now();
    if (now - lastCursorSendRef.current > 30) {
      sendCursorMove({
        userId: currentUserId,
        x,
        y,
        color: userColorRef.current,
        userName: '',
        timestamp: now
      });
      lastCursorSendRef.current = now;
    }

    if (dragState.isDragging && dragState.taskId) {
      const effectivePixelsPerHour = PIXELS_PER_HOUR * zoom;
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = Math.round((deltaX / effectivePixelsPerHour) * HOUR / MINUTES_15) * MINUTES_15;

      const newStartTime = snapTo15Minutes(dragState.originalStartTime + deltaTime);
      const duration = tasks.find(t => t.id === dragState.taskId)
        ? tasks.find(t => t.id === dragState.taskId)!.endTime - tasks.find(t => t.id === dragState.taskId)!.startTime
        : HOUR;
      const newEndTime = newStartTime + duration;

      if (!dragState.isNew) {
        const task = tasks.find(t => t.id === dragState.taskId);
        if (task && (task.startTime !== newStartTime || task.endTime !== newEndTime)) {
          taskApi.updateTask(dragState.taskId!, {
            startTime: newStartTime,
            endTime: newEndTime,
            updatedAt: Date.now()
          }).catch((err: any) => {
            if (err.response?.status === 409) {
              addNotification({
                id: Math.random().toString(),
                type: 'warning',
                message: '任务时间与其他任务冲突！已回滚',
                timestamp: Date.now()
              });
            }
          });
        }
      }
    }
  }, [dragState, tasks, zoom, currentUserId, sendCursorMove, addNotification]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: false, taskId: null }));
    }
  }, [dragState]);

  const handleDoubleClick = useCallback(async (e: React.MouseEvent) => {
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + panOffset;
    const effectivePixelsPerHour = PIXELS_PER_HOUR * zoom;

    const clickedTime = snapTo15Minutes(pixelToTime(x, baseTime, effectivePixelsPerHour));

    try {
      const newTask = await taskApi.createTask({
        name: '新任务',
        startTime: clickedTime,
        endTime: clickedTime + HOUR,
        priority: 'medium' as Priority
      });

      setDragState({
        isDragging: true,
        taskId: newTask.id,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: timeToPixel(clickedTime, baseTime, effectivePixelsPerHour),
        originalStartTime: clickedTime,
        isNew: true
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        addNotification({
          id: Math.random().toString(),
          type: 'warning',
          message: '该时间段与已有任务冲突！',
          timestamp: Date.now()
        });
      }
    }
  }, [baseTime, zoom, panOffset, addNotification]);

  const handleTaskMouseDown = useCallback((e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const effectivePixelsPerHour = PIXELS_PER_HOUR * zoom;

    setDragState({
      isDragging: true,
      taskId: task.id,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: timeToPixel(task.startTime, baseTime, effectivePixelsPerHour),
      originalStartTime: task.startTime,
      isNew: false
    });
  }, [baseTime, zoom]);

  const handleTaskClick = useCallback((e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!dragState.isDragging) {
      setSelectedTaskId(task.id);
    }
  }, [dragState.isDragging, setSelectedTaskId]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 24; i++) {
      arr.push(i);
    }
    return arr;
  }, []);

  const effectivePixelsPerHour = PIXELS_PER_HOUR * zoom;
  const timelineTotalWidth = 24 * effectivePixelsPerHour;
  const effectiveBoardWidth = isMobile ? boardWidth : boardWidth * 0.8;
  const timelineLeft = isMobile ? 0 : (boardWidth - effectiveBoardWidth) / 2;

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  return (
    <div
      ref={boardRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      style={{
        flex: 1,
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
        cursor: 'crosshair',
        perspective: '1000px'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '20px',
          top: TIMELINE_VERTICAL_OFFSET + 80,
          width: '80px',
          height: '80px',
          border: '2px solid rgba(124, 58, 237, 0.15)',
          borderRadius: '50%',
          boxShadow: '0 0 30px rgba(124, 58, 237, 0.1)',
          animation: 'gearRotate 20s linear infinite'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          border: '2px solid rgba(124, 58, 237, 0.2)',
          borderRadius: '50%'
        }} />
      </div>

      <div
        style={{
          position: 'absolute',
          right: '20px',
          top: TIMELINE_VERTICAL_OFFSET + 80,
          width: '80px',
          height: '80px',
          border: '2px solid rgba(78, 205, 196, 0.15)',
          borderRadius: '50%',
          boxShadow: '0 0 30px rgba(78, 205, 196, 0.1)',
          animation: 'gearRotate 25s linear infinite reverse'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          border: '2px solid rgba(78, 205, 196, 0.2)',
          borderRadius: '50%'
        }} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: timelineLeft,
          right: isMobile ? 0 : (boardWidth - effectiveBoardWidth) / 2,
          top: TIMELINE_VERTICAL_OFFSET,
          height: '200px',
          background: 'linear-gradient(180deg, rgba(30, 30, 62, 0.8), rgba(42, 42, 78, 0.8))',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: timelineTotalWidth,
            height: '100%',
            transform: `translateX(${-panOffset}px)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {hours.map((hour) => {
            const left = hour * effectivePixelsPerHour;
            const isHour = hour % 1 === 0;

            return (
              <React.Fragment key={hour}>
                <div
                  style={{
                    position: 'absolute',
                    left: left,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: isHour
                      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    height: '100%'
                  }}
                />
                {isHour && (
                  <div
                    style={{
                      position: 'absolute',
                      left: left + 8,
                      top: '12px',
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {formatTime(baseTime + hour * HOUR)}
                  </div>
                )}
                {[15, 30, 45].map((min) => (
                  <div
                    key={min}
                    style={{
                      position: 'absolute',
                      left: left + (min / 60) * effectivePixelsPerHour,
                      top: 0,
                      height: '8px',
                      width: '1px',
                      background: 'rgba(255, 255, 255, 0.06)'
                    }}
                  />
                ))}
              </React.Fragment>
            );
          })}

          {(() => {
            const nowPixel = timeToPixel(Date.now(), baseTime, effectivePixelsPerHour);
            if (nowPixel >= 0 && nowPixel <= timelineTotalWidth) {
              return (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: nowPixel,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      background: 'linear-gradient(180deg, #FF4500, #FF6347)',
                      boxShadow: '0 0 10px #FF4500'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: nowPixel - 6,
                      top: '8px',
                      fontSize: '10px',
                      color: '#FF4500',
                      fontWeight: 600,
                      background: 'rgba(255, 69, 0, 0.2)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    现在
                  </div>
                </>
              );
            }
            return null;
          })()}

          {tasks.map((task) => {
            const colors = getPriorityColors(task.priority);
            const left = timeToPixel(task.startTime, baseTime, effectivePixelsPerHour);
            const width = Math.max(
              taskWidth,
              ((task.endTime - task.startTime) / HOUR) * effectivePixelsPerHour
            );
            const isSelected = task.id === selectedTaskId;
            const isDraggingThis = dragState.isDragging && dragState.taskId === task.id;

            return (
              <div
                key={task.id}
                onMouseDown={(e) => handleTaskMouseDown(e, task)}
                onClick={(e) => handleTaskClick(e, task)}
                onMouseEnter={() => setHoveredTaskId(task.id)}
                onMouseLeave={() => setHoveredTaskId(null)}
                style={{
                  position: 'absolute',
                  left: left,
                  top: '48px',
                  width: width,
                  height: taskHeight,
                  borderRadius: '12px',
                  background: task.completed
                    ? 'linear-gradient(135deg, rgba(50, 205, 50, 0.15), rgba(34, 139, 34, 0.15))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
                  backdropFilter: 'blur(8px)',
                  border: '2px solid transparent',
                  borderImage: colors.border,
                  borderImageSlice: 1,
                  boxShadow: isSelected
                    ? `0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px ${colors.particle}66`
                    : '0 4px 16px rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  cursor: 'grab',
                  userSelect: 'none',
                  transition: isDraggingThis
                    ? 'none'
                    : 'left 0.2s ease-out, box-shadow 0.2s ease-out, transform 0.2s ease-out',
                  transform: isDraggingThis ? 'scale(1.02)' : (isSelected ? 'scale(1.01)' : 'scale(1)'),
                  zIndex: isDraggingThis ? 100 : (isSelected ? 50 : 10),
                  opacity: task.completed ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '100%', justifyContent: 'center' }}>
                  <div
                    style={{
                      fontSize: isMobile ? '12px' : '13px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textDecoration: task.completed ? 'line-through' : 'none'
                    }}
                  >
                    {task.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        color: colors.particle,
                        fontWeight: 500,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: `${colors.particle}22`
                      }}
                    >
                      {colors.label}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {formatTime(task.startTime)} - {formatTime(task.endTime)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isMobile && Object.entries(cursors).map(([userId, cursor]) => {
        if (userId === currentUserId) return null;
        return (
          <div
            key={userId}
            style={{
              position: 'absolute',
              left: timelineLeft + cursor.x - effectiveBoardWidth / 2 + panOffset,
              top: cursor.y,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: cursor.color,
              boxShadow: `0 0 12px ${cursor.color}, 0 0 24px ${cursor.color}66`,
              pointerEvents: 'none',
              zIndex: 200,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.05s linear, top 0.05s linear'
            }}
          />
        );
      })}

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.4)',
          textAlign: 'center'
        }}
      >
        双击时间轴空白处创建任务 · 拖拽任务调整时间 · 滚轮缩放/平移 · Ctrl+滚轮缩放
      </div>

      <style>{`
        @keyframes gearRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {selectedTask && (
        <TaskEditor task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
};
