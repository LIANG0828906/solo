import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, type DropResult } from 'react-beautiful-dnd';
import Board from './components/Board';
import CardDetailModal from './components/CardDetailModal';
import CreateCardModal from './components/CreateCardModal';
import TagFilter from './components/TagFilter';
import StatsPanel from './components/StatsPanel';
import { fetchTasks, reorderTasks, updateTask } from './api';
import type { Task, TaskStatus, Tag } from './types';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMovingTask, setMobileMovingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('加载数据失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    const sourceList = tasks
      .filter((t) => t.status === sourceStatus)
      .sort((a, b) => a.order - b.order);
    const movingTask = sourceList[source.index];

    const optimisticTasks = tasks.map((t) => {
      if (t.status === sourceStatus && t.id !== movingTask.id) {
        const oldIdx = sourceList.findIndex((s) => s.id === t.id);
        const newIdx = oldIdx > source.index ? oldIdx - 1 : oldIdx;
        return { ...t, order: newIdx };
      }
      if (t.id === movingTask.id) {
        return {
          ...t,
          status: destStatus,
          statusChangedAt: sourceStatus !== destStatus ? Date.now() : t.statusChangedAt,
        };
      }
      return t;
    });

    const destList = optimisticTasks
      .filter((t) => t.status === destStatus)
      .sort((a, b) => a.order - b.order);
    destList.splice(destination.index, 0, optimisticTasks.find((t) => t.id === movingTask.id)!);
    const finalTasks = optimisticTasks.map((t) => {
      if (t.status !== destStatus) return t;
      const idx = destList.findIndex((d) => d.id === t.id);
      return { ...t, order: idx };
    });

    setTasks(finalTasks);

    try {
      const serverTasks = await reorderTasks({
        sourceStatus,
        sourceIndex: source.index,
        destinationStatus: destStatus,
        destinationIndex: destination.index,
      });
      setTasks(serverTasks);
    } catch (err) {
      console.error('Failed to reorder tasks:', err);
      setTasks(tasks);
      setError('拖拽更新失败，已回滚');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleTaskUpdated = (task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    setSelectedTask((prev) => (prev && prev.id === task.id ? task : prev));
  };

  const handleCardStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const originalTasks = tasks;
    const oldStatus = task.status;
    const oldDestList = tasks
      .filter((t) => t.status === newStatus)
      .sort((a, b) => a.order - b.order);

    const optimisticTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: newStatus, order: oldDestList.length, statusChangedAt: Date.now() };
      }
      if (t.status === oldStatus && t.id !== taskId && t.order > task.order) {
        return { ...t, order: t.order - 1 };
      }
      return t;
    });
    setTasks(optimisticTasks);

    try {
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Failed to update task status:', err);
      setTasks(originalTasks);
      setError('状态更新失败');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleMobileMoveCard = (task: Task) => {
    setMobileMovingTask(task);
  };

  const handleMobileSelectTarget = async (targetStatus: TaskStatus) => {
    if (!mobileMovingTask) return;
    await handleCardStatusChange(mobileMovingTask.id, targetStatus);
    setMobileMovingTask(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">🗂️ KanbanLight</div>
        <div className="header-actions">
          <TagFilter selectedTags={filteredTags} onChange={setFilteredTags} />
          <button onClick={() => setIsCreateModalOpen(true)}>+ 新建卡片</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <main className="board-container">
          {isMobile ? (
            <Board
              tasks={tasks}
              onCardClick={setSelectedTask}
              filteredTags={filteredTags as string[]}
              isMobile={true}
              onCardStatusChange={handleCardStatusChange}
              onMobileMoveCard={handleMobileMoveCard}
            />
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Board
                tasks={tasks}
                onCardClick={setSelectedTask}
                filteredTags={filteredTags as string[]}
                isMobile={false}
              />
            </DragDropContext>
          )}
        </main>
      )}

      {mobileMovingTask && (
        <Modal
          isOpen={!!mobileMovingTask}
          onClose={() => setMobileMovingTask(null)}
          title="移动卡片到"
        >
          <div className="modal-body">
            <div className="mobile-move-card">
              <div className="mobile-move-card-title">{mobileMovingTask.title}</div>
              <span className="mobile-move-card-arrow">→</span>
            </div>
            {(['todo', 'in-progress', 'done'] as TaskStatus[]).map((status) => {
              const meta = { todo: { label: '待办', color: '#2196F3' }, 'in-progress': { label: '进行中', color: '#FF9800' }, done: { label: '已完成', color: '#4CAF50' } }[status];
              const isCurrent = mobileMovingTask.status === status;
              return (
                <button
                  key={status}
                  className={`mobile-move-btn ${isCurrent ? 'active-status' : ''}`}
                  onClick={() => !isCurrent && handleMobileSelectTarget(status)}
                  disabled={isCurrent}
                  style={{
                    opacity: isCurrent ? 0.5 : 1,
                    borderLeft: `4px solid ${meta.color}`,
                    cursor: isCurrent ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span style={{ color: meta.color, marginRight: '8px' }}>●</span>
                  {meta.label}
                  {isCurrent && ' （当前）'}
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      <CardDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={handleTaskUpdated}
      />

      <CreateCardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      <StatsPanel tasks={tasks} />
    </div>
  );
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        {title && (
          <div className="modal-header">
            <div className="modal-title">{title}</div>
            <button className="modal-close" onClick={onClose}>
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
