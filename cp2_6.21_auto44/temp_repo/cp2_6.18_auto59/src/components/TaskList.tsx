import { useState, useRef, useCallback } from 'react';
import { useDayBriefStore } from '../store';
import TaskItem from './TaskItem';
import { ClipboardList, ListTodo, CheckCircle2 } from 'lucide-react';
import type { Task } from '../types';
import styles from '../styles/TaskList.module.css';

type DragScope = 'pending' | 'completed';

type DropPosition = 'before' | 'after' | null;

interface DragState {
  draggingId: string | null;
  overId: string | null;
  overPosition: DropPosition;
  isOverGroup: boolean;
  scope: DragScope | null;
}

export default function TaskList() {
  const tasks = useDayBriefStore((s) => s.tasks);
  const reorderTasks = useDayBriefStore((s) => s.reorderTasks);

  const [dragState, setDragState] = useState<DragState>({
    draggingId: null,
    overId: null,
    overPosition: null,
    isOverGroup: false,
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
      setDragState({
        draggingId: id,
        overId: null,
        overPosition: null,
        isOverGroup: false,
        scope,
      });
    },
    []
  );

  const setDragOver = useCallback(
    (update: Partial<DragState>) => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setDragState((prev) => ({ ...prev, ...update }));
        rafRef.current = null;
      });
    },
    []
  );

  const handleItemDragOver = useCallback(
    (id: string, position: DropPosition, e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.stopPropagation();
      if (dragState.draggingId === id) return;
      setDragOver({ overId: id, overPosition: position, isOverGroup: false });
    },
    [dragState.draggingId, setDragOver]
  );

  const handleGroupDragOver = useCallback(
    (scope: DragScope, e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragState.scope !== scope || !dragState.draggingId) return;
      if (!dragState.overId) {
        setDragOver({ isOverGroup: true });
      }
    },
    [dragState.scope, dragState.draggingId, dragState.overId, setDragOver]
  );

  const handleGroupDragLeave = useCallback(
    (scope: DragScope, e: React.DragEvent) => {
      if (dragState.scope !== scope) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const { clientX, clientY } = e;
      const isOutside =
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom;
      if (isOutside) {
        setDragOver({ overId: null, overPosition: null, isOverGroup: false });
      }
    },
    [dragState.scope, setDragOver]
  );

  const handleDrop = useCallback(
    (toId: string | null, dropAtEnd: boolean, scope: DragScope, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const { draggingId, scope: currentScope } = dragState;
      if (!draggingId || currentScope !== scope) {
        setDragState({
          draggingId: null,
          overId: null,
          overPosition: null,
          isOverGroup: false,
          scope: null,
        });
        return;
      }

      const sourceList =
        scope === 'pending' ? pendingTasks : completedTasks;
      const sourceIds = sourceList.map((t) => t.id);
      const draggingIdx = sourceIds.indexOf(draggingId);

      let targetIdx: number;
      if (dropAtEnd || toId === null) {
        targetIdx = sourceIds.length - 1;
      } else {
        targetIdx = sourceIds.indexOf(toId);
        if (targetIdx > draggingIdx) targetIdx -= 1;
      }

      if (draggingIdx !== -1 && targetIdx !== -1 && draggingIdx !== targetIdx) {
        const reordered = [...sourceIds];
        const [removed] = reordered.splice(draggingIdx, 1);
        reordered.splice(targetIdx, 0, removed);
        reorderTasks(draggingId, reordered[targetIdx] ?? draggingId, scope);
      }

      setDragState({
        draggingId: null,
        overId: null,
        overPosition: null,
        isOverGroup: false,
        scope: null,
      });
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    },
    [dragState, pendingTasks, completedTasks, reorderTasks]
  );

  const handleDragEnd = useCallback(() => {
    setDragState({
      draggingId: null,
      overId: null,
      overPosition: null,
      isOverGroup: false,
      scope: null,
    });
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
    const isCurrentScope = dragState.scope === scope;
    const isDraggingInScope = isCurrentScope && dragState.draggingId !== null;
    const showEndPlaceholder =
      isDraggingInScope &&
      (!dragState.overId || dragState.isOverGroup);

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
        <div
          className={styles.taskGroup}
          onDragOver={(e) => handleGroupDragOver(scope, e)}
          onDragLeave={(e) => handleGroupDragLeave(scope, e)}
          onDrop={(e) => handleDrop(null, true, scope, e)}
        >
          {showEmpty ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <ClipboardList size={40} style={{ opacity: 0.5 }} />
              </div>
              <div className={styles.emptyText}>还没有待处理任务，快去添加吧！</div>
            </div>
          ) : (
            taskList.map((task, idx) => {
              const isOver =
                isDraggingInScope &&
                dragState.overId === task.id &&
                dragState.draggingId !== task.id;
              const isLast = idx === taskList.length - 1;
              return (
                <div key={`wrapper-${task.id}`}>
                  {isOver && dragState.overPosition !== 'after' && (
                    <div className={styles.dropPlaceholder} />
                  )}
                  <TaskItem
                    key={task.id}
                    task={task}
                    scope={scope}
                    isDragging={dragState.draggingId === task.id}
                    isOver={isOver}
                    onDragStart={(id, s, e) => handleDragStart(id, s, e)}
                    onDragOverId={(position, e) =>
                      handleItemDragOver(task.id, position, e)
                    }
                    onDrop={(id, e) =>
                      handleDrop(
                        id,
                        isLast && dragState.overPosition === 'after',
                        scope,
                        e
                      )
                    }
                    onDragEnd={handleDragEnd}
                  />
                  {isOver &&
                    dragState.overPosition === 'after' &&
                    !showEndPlaceholder && (
                      <div className={styles.dropPlaceholder} />
                    )}
                </div>
              );
            })
          )}
          {!showEmpty && showEndPlaceholder && (
            <div className={styles.dropPlaceholder} />
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
