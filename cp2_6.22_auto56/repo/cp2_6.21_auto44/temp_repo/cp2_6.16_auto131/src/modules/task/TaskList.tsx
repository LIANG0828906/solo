import { useMemo, useRef, useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from './taskStore';
import { useUserStore } from '../user/userStore';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { useVirtualList } from '@/hooks/useVirtualList';
import { TASK_STATUS_LABELS } from '@/utils/constants';
import type { TaskStatus } from '@/utils/types';

const CARD_WIDTH = 320;
const CARD_HEIGHT = 200;
const CARD_GAP = 24;
const CONTAINER_PADDING = 24;

export default function TaskList() {
  const navigate = useNavigate();
  const tasks = useTaskStore((state) => state.tasks);
  const createTask = useTaskStore((state) => state.createTask);
  const claimTask = useTaskStore((state) => state.claimTask);
  const currentUser = useUserStore((state) => state.currentUser);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth - CONTAINER_PADDING * 2;
        setContainerWidth(Math.max(availableWidth, CARD_WIDTH));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filterStatus !== 'all') {
      result = result.filter((t) => t.status === filterStatus);
    }
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, filterStatus]);

  const columns = Math.max(
    1,
    Math.floor((containerWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP)),
  );
  const rowHeight = CARD_HEIGHT + CARD_GAP;

  const rows = Math.ceil(filteredTasks.length / columns);

  const { containerRef: virtualContainerRef, visibleItems, offsetY, totalHeight } =
    useVirtualList({
      items: filteredTasks,
      itemHeight: rowHeight,
      containerHeight: 600,
      overscan: 3,
    });

  const handleCreateTask = async (data: {
    title: string;
    description: string;
    estimatedHours: number;
    deadline: string;
  }) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    await createTask({
      ...data,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
    });
  };

  const handleClaim = async (taskId: string) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    await claimTask(taskId, currentUser.id, currentUser.name);
  };

  const handleCardClick = (taskId: string) => {
    navigate(`/task/${taskId}`);
  };

  const visibleStartRow = Math.floor(offsetY / rowHeight);

  const renderVisibleCards = () => {
    const cards: React.ReactNode[] = [];

    for (let i = 0; i < visibleItems.length; i++) {
      const task = visibleItems[i];
      const globalIndex = visibleStartRow * columns + (i % columns);
      const rowIndex = Math.floor(i / columns);
      const colIndex = i % columns;

      if (globalIndex >= filteredTasks.length) continue;

      const left = colIndex * (CARD_WIDTH + CARD_GAP);
      const top = rowIndex * rowHeight;

      cards.push(
        <div
          key={task.id}
          style={{
            position: 'absolute',
            left,
            top,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          }}
        >
          <TaskCard
            task={task}
            onClick={() => handleCardClick(task.id)}
            onClaim={() => handleClaim(task.id)}
            currentUserId={currentUser?.id}
          />
        </div>,
      );
    }

    return cards;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">任务列表</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredTasks.length} 个任务
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="bg-transparent text-sm px-2 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="pending">{TASK_STATUS_LABELS.pending}</option>
              <option value="in_progress">{TASK_STATUS_LABELS.in_progress}</option>
              <option value="completed">{TASK_STATUS_LABELS.completed}</option>
            </select>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            发布任务
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden bg-white/50 rounded-2xl"
      >
        {filteredTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <p className="mb-4">暂无任务</p>
            {currentUser && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                发布第一个任务
              </button>
            )}
          </div>
        ) : (
          <div
            ref={virtualContainerRef}
            style={{
              height: '100%',
              overflow: 'auto',
              padding: CONTAINER_PADDING,
            }}
            className="scroll-smooth"
          >
            <div
              style={{
                position: 'relative',
                width: columns * CARD_WIDTH + (columns - 1) * CARD_GAP,
                height: totalHeight,
                margin: '0 auto',
              }}
            >
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                {renderVisibleCards()}
              </div>
            </div>
          </div>
        )}
      </div>

      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTask}
        mode="create"
      />
    </div>
  );
}
