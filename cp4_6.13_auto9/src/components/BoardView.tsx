import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Filter, Plus, User, Flag, Calendar } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { useAppStore } from '../store/useAppStore';
import { getSocket } from '../utils/socket';
import type { Board, TaskDetail, User, FilterState, Task } from '../types';

interface BoardViewProps {
  board: Board;
  users: User[];
}

export default function BoardView({ board, users }: BoardViewProps) {
  const { user, updateTaskInBoard, addTaskToBoard, removeTaskFromBoard, addToast, setCurrentTask, currentTask } = useAppStore();
  const [filters, setFilters] = useState<FilterState>({
    assigneeId: '',
    priority: '',
    dueDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join', board.id);

    const handleTaskUpdated = ({ task }: { task: TaskDetail }) => {
      updateTaskInBoard(task);
      if (selectedTask?.id === task.id) {
        setSelectedTask(task);
      }
    };

    const handleTaskCreated = ({ task }: { task: TaskDetail }) => {
      if (task.boardId === board.id) {
        addTaskToBoard(task);
      }
    };

    const handleTaskDeleted = ({ taskId, boardId }: { taskId: string; boardId: string }) => {
      if (boardId === board.id) {
        removeTaskFromBoard(taskId);
        if (selectedTask?.id === taskId) {
          setSelectedTask(null);
        }
      }
    };

    const handleTaskCommentAdded = ({ taskId, comment }: { taskId: string; comment: unknown }) => {
      if (selectedTask?.id === taskId) {
        setSelectedTask((prev) =>
          prev
            ? {
                ...prev,
                comments: [comment as never, ...prev.comments],
              }
            : null
        );
      }
    };

    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('task:comment:added', handleTaskCommentAdded);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('task:comment:added', handleTaskCommentAdded);
      socket.emit('leave', board.id);
    };
  }, [board.id, selectedTask?.id, updateTaskInBoard, addTaskToBoard, removeTaskFromBoard]);

  const filteredTasks = useMemo(() => {
    return board.tasks.filter((task) => {
      if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.dueDate) {
        const taskDate = new Date(task.dueDate).toDateString();
        const filterDate = new Date(filters.dueDate).toDateString();
        if (taskDate !== filterDate) return false;
      }
      return true;
    });
  }, [board.tasks, filters]);

  const getTasksByLane = (laneId: string) => {
    return filteredTasks.filter((t) => t.swimLaneId === laneId);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = board.tasks.find((t) => t.id === draggableId);
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swimLaneId: destination.droppableId,
          userId: user?.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        updateTaskInBoard(data.task);
      }
    } catch {
      addToast({ message: '更新失败，请重试', type: 'error' });
    }
  };

  const handleTaskClick = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedTask(data.task);
        setCurrentTask(data.task);
      }
    } catch {
      addToast({ message: '加载任务详情失败', type: 'error' });
    }
  };

  const handleAddTask = async (laneId: string) => {
    if (!newTaskTitle.trim() || !user) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: '',
          priority: 'medium',
          assigneeId: user.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          swimLaneId: laneId,
          boardId: board.id,
          userId: user.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        addTaskToBoard(data.task);
        setNewTaskTitle('');
        setIsAddingTask(null);
        addToast({ message: '任务创建成功', type: 'success' });
      }
    } catch {
      addToast({ message: '创建失败，请重试', type: 'error' });
    }
  };

  const sortedLanes = useMemo(() => {
    return [...board.swimLanes].sort((a, b) => a.order - b.order);
  }, [board.swimLanes]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{board.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {board.tasks.length} 个任务 · {board.swimLanes.length} 个泳道
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || filters.assigneeId || filters.priority || filters.dueDate
                ? 'bg-mint/20 text-primary'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <select
              value={filters.assigneeId}
              onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint/50"
            >
              <option value="">全部负责人</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-gray-400" />
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint/50"
            >
              <option value="">全部优先级</option>
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.dueDate}
              onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint/50"
            />
          </div>

          <button
            onClick={() => setFilters({ assigneeId: '', priority: '', dueDate: '' })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            清除筛选
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-board-bg">
          <div className="flex gap-5 h-full min-w-max">
            {sortedLanes.map((lane) => {
              const laneTasks = getTasksByLane(lane.id);
              return (
                <div
                  key={lane.id}
                  className="flex flex-col w-80 flex-shrink-0 h-full"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-700 text-sm">
                        {lane.name}
                      </h3>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {laneTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsAddingTask(lane.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <Droppable droppableId={lane.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`glass-effect flex-1 rounded-xl p-3 space-y-3 overflow-y-auto scrollbar-thin transition-colors ${
                          snapshot.isDraggingOver ? 'bg-mint/20' : ''
                        }`}
                      >
                        {isAddingTask === lane.id && (
                          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                            <input
                              type="text"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === 'Enter' && handleAddTask(lane.id)
                              }
                              placeholder="输入任务标题..."
                              autoFocus
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-mint/50"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleAddTask(lane.id)}
                                className="flex-1 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                              >
                                添加
                              </button>
                              <button
                                onClick={() => {
                                  setIsAddingTask(null);
                                  setNewTaskTitle('');
                                }}
                                className="flex-1 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        )}

                        {laneTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task as Task}
                            index={index}
                            users={users}
                            onClick={() => handleTaskClick(task.id)}
                          />
                        ))}
                        {provided.placeholder}

                        {laneTasks.length === 0 && !isAddingTask && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            暂无任务
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          users={users}
          onClose={() => {
            setSelectedTask(null);
            setCurrentTask(null);
          }}
        />
      )}
    </div>
  );
}
