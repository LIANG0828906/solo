import { useState, useRef, useCallback } from 'react';
import { useDayBriefStore } from '../store';
import TaskItem from './TaskItem';
import { ClipboardList, ListTodo, CheckCircle2 } from 'lucide-react';
import type { Task } from '../types';
import styles from '../styles/TaskList.module.css';

type DragScope = 'pending' | 'completed';

interface DragState {
  draggingId: string | null;
  overId: string | null;
  scope: DragScope | null;
}

export default function TaskList() {
  const tasks = useDayBriefStore((s) => s.tasks);
  const reorderTasks = useDayBriefStore((s) => s.reorderTasks);

  const [dragState, setDragState] = useState<DragState>({
    draggingId: null,
    overId: null,
    scope: null,
  });
  const rafRef = useRef<number | null>(null);

  const pendingTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => a.order - b.order);

  const completedTasks = tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => a.order - b.order);

  const handleDragStart = useCallback(
    (id: string, scope: DragScope, e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      setDragState({ draggingId: id, overId: null, scope });
    },
    []
  );

  const handleDragOver = useCallback(
    (id: string, e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setDragState((prev) =>
          prev.draggingId && prev.draggingId !== id
            ? { ...prev, overId: id }
            : prev
        );
        rafRef.current = null;
      });
    },
    []
  );

  const handleDrop = useCallback(
    (toId: string, e: React.DragEvent) => {
      e.preventDefault();
      const { draggingId, scope } = dragState;
      if (draggingId && scope && draggingId !== toId) {
        reorderTasks(draggingId, toId, scope);
      }
      setDragState({ draggingId: null, overId: null, scope: null });
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    },
    [dragState, reorderTasks]
  );

  const handleDragEnd = useCallback(() => {
    setDragState({ draggingId: null, overId: null, scope: null });
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const renderTaskGroup = (
    taskList: Task[],
    scope: DragScope,
    title: string,
    IconComponent: typeof ListTodo,
    headerExtraClass?: string
  ) => {
    const showEmpty = taskList.length === 0 && scope === 'pending';

    return (
      <div>
        <div
          className={`${styles.sectionHeader} ${
            headerExtraClass && taskList.length > 0 ? headerExtraClass : ''
          }`}
        >
          <IconComponent size={14} color="#6B7280" />
          <span className={styles.sectionTitle}>{title}</span>
          <span className={styles.sectionCount}>{taskList.length}</span>
        </div>
        <div className={styles.taskGroup}>
          {showEmpty ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <ClipboardList size={40} style={{ opacity: 0.5 }} />
              </div>
              <div className={styles.emptyText}>还没有待处理任务，快去添加吧！</div>
            </div>
          ) : (
            taskList.map((task) => {
              const isOver = dragState.overId === task.id && dragState.scope === scope;
              return (
                <div key={`wrapper-${task.id}`}>
                  {isOver && dragState.draggingId && dragState.draggingId !== task.id && (
                    <div className={styles.dropPlaceholder}>放置到此处</div>
                  )}
                  <TaskItem
                    key={task.id}
                    task={task}
                    scope={scope}
                    isDragging={dragState.draggingId === task.id}
                    isOver={isOver}
                    onDragStart={(id, s, e) => handleDragStart(id, s, e)}
                    onDragOver={(id, e) => handleDragOver(id, e)}
                    onDrop={(id, e) => handleDrop(id, e)}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              );
            })
          )}
          {taskList.length > 0 &&
            dragState.scope === scope &&
            dragState.overId === null &&
            dragState.draggingId && (
              <div className={styles.dropPlaceholder}>放置到此处</div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.listContainer}>
      {renderTaskGroup(
        pendingTasks,
        'pending',
        '待完成',
        ListTodo
      )}
      {completedTasks.length > 0 &&
        renderTaskGroup(
          completedTasks,
          'completed',
          '已完成',
          CheckCircle2,
          styles.completedHeader
        )}
    </div>
  );
}
