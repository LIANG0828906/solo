import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import TaskCard from './TaskCard';
import type { Task, TaskStatus } from '../../../shared/types';
import { COLUMN_CONFIG } from '../../../shared/types';

const columns: TaskStatus[] = ['todo', 'in-progress', 'done'];

const Board: React.FC = () => {
  const {
    tasks,
    draggingTaskId,
    dragOverColumn,
    setDragOverColumn,
    changeTaskStatus,
    setDraggingTask
  } = useTaskStore();

  const [isMobile, setIsMobile] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState<Set<TaskStatus>>(new Set());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleColumn = (col: TaskStatus) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const getColumnTasks = (status: TaskStatus): Task[] => {
    return tasks.filter(t => t.status === status);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && draggingTaskId) {
      changeTaskStatus(taskId, status);
    }
    setDragOverColumn(null);
    setDraggingTask(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '0',
        width: '100%'
      }}
    >
      {columns.map((status, idx) => {
        const config = COLUMN_CONFIG[status];
        const colTasks = getColumnTasks(status);
        const isCollapsed = collapsedCols.has(status);
        const isDragOver = dragOverColumn === status && draggingTaskId !== null;

        return (
          <div
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            style={{
              flex: isMobile ? 'none' : 1,
              width: isMobile ? '100%' : undefined,
              backgroundColor: config.bgColor,
              padding: '20px 16px',
              minHeight: isMobile ? (isCollapsed ? 'auto' : '200px') : '500px',
              display: 'flex',
              flexDirection: 'column',
              borderRight: !isMobile && idx < columns.length - 1 ? '1px solid #DEE2E6' : 'none',
              borderBottom: isMobile && idx < columns.length - 1 ? '1px solid #DEE2E6' : 'none',
              transition: 'background-color 0.2s ease',
              boxSizing: 'border-box',
              outline: isDragOver ? `2px dashed #6C63FF` : 'none',
              outlineOffset: '-4px',
              borderRadius: isDragOver ? '8px' : '0'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                padding: '0 4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: config.counterColor,
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                  }}
                >
                  {config.title}
                </span>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: config.counterColor,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  {colTasks.length}
                </span>
              </div>
              {isMobile && (
                <button
                  onClick={() => toggleColumn(status)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#666',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    transition: 'background 0.2s, transform 0.3s',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}
                >
                  ▼
                </button>
              )}
            </div>

            {(!isMobile || !isCollapsed) && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}

                {isDragOver && (
                  <div
                    style={{
                      height: '3px',
                      backgroundColor: '#6C63FF',
                      borderRadius: '2px',
                      margin: '4px 0',
                      opacity: 0.6,
                      border: 'none'
                    }}
                  />
                )}

                {colTasks.length === 0 && !isDragOver && (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: '13px',
                      fontStyle: 'italic',
                      minHeight: '80px'
                    }}
                  >
                    拖拽任务到此处
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Board;
