import { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { KanbanSquare, Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { useBoardStore } from '../store/boardStore';
import {
  fetchBoards,
  updateTaskCard,
  subscribeToBoardUpdates,
  createTask,
  deleteTask,
} from '../services/apiService';
import type { Task, DragItem, Column, BoardUpdateEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ColumnDropZoneProps {
  column: Column;
  boardId: string;
  onTaskClick: (task: Task, columnId: string) => void;
  onDrop: (
    task: Task,
    sourceColumnId: string,
    targetColumnId: string
  ) => void;
  onAddTask: (columnId: string) => void;
}

const ColumnDropZone = ({
  column,
  boardId,
  onTaskClick,
  onDrop,
  onAddTask,
}: ColumnDropZoneProps) => {
  const [{ isOver }, drop] = useDrop<
    DragItem,
    unknown,
    { isOver: boolean }
  >({
    accept: 'TASK',
    drop: (item) => {
      if (item.sourceColumnId !== column.id) {
        onDrop(item.task, item.sourceColumnId, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`
        flex-shrink-0 w-full md:w-1/2 lg:w-1/3 p-2
        transition-all duration-150
        ${isOver ? 'bg-blue-50/50' : ''}
      `}
    >
      <div className="bg-gray-50 rounded-xl p-3 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-700 text-sm">{column.name}</h3>
            <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-gray-500 border border-gray-200">
              {column.tasks.length}
            </span>
          </div>
          <button
            onClick={() => onAddTask(column.id)}
            className="
              p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50
              transition-all duration-150
            "
            title="添加任务"
          >
            <Plus size={16} />
          </button>
        </div>

        <div
          className={`
            flex-1 overflow-y-auto
            min-h-[200px]
            transition-all duration-150 rounded-lg
            ${isOver ? 'bg-blue-100/30 ring-2 ring-dashed ring-blue-300' : ''}
          `}
        >
          {column.tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
              暂无任务
            </div>
          )}
          {column.tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              index={index}
              boardId={boardId}
              onClick={onTaskClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const BoardViewContent = () => {
  const {
    boards,
    currentBoardId,
    setCurrentBoardId,
    getCurrentBoard,
    setLoading,
    updateTaskInColumn,
    handleBoardUpdate,
    addToast,
  } = useBoardStore();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{
    task: Task;
    columnId: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUserId = useRef(`user-${uuidv4().slice(0, 8)}`).current;
  const initialLoadDone = useRef(false);

  const currentBoard = getCurrentBoard();

  const loadBoards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBoards();
      useBoardStore.getState().setBoards(data);
    } catch (error) {
      console.error('Failed to load boards:', error);
      addToast({ message: '加载看板失败', type: 'warning' });
    } finally {
      setLoading(false);
    }
  }, [setLoading, addToast]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadBoards();
    }

    const unsubscribe = subscribeToBoardUpdates((event: BoardUpdateEvent) => {
      handleBoardUpdate(event, currentUserId);
    });

    return unsubscribe;
  }, [loadBoards, handleBoardUpdate]);

  const handleBoardSwitch = useCallback((boardId: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentBoardId(boardId);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  }, [setCurrentBoardId]);

  const handleDrop = useCallback(
    async (
      task: Task,
      sourceColumnId: string,
      targetColumnId: string
    ) => {
      if (!currentBoard) return;

      updateTaskInColumn(task, sourceColumnId, targetColumnId);

      try {
        await updateTaskCard(task.id, {
          task,
          boardId: currentBoardId,
          columnId: targetColumnId,
          sourceColumnId,
          targetColumnId,
        });
      } catch (error) {
        console.error('Failed to update task:', error);
        updateTaskInColumn(task, targetColumnId, sourceColumnId);
        addToast({ message: '更新任务失败', type: 'warning' });
      }
    },
    [currentBoard, currentBoardId, updateTaskInColumn, addToast]
  );

  const handleTaskClick = useCallback((task: Task, columnId: string) => {
    setSelectedTask({ task, columnId });
    setIsModalOpen(true);
  }, []);

  const handleAddTask = useCallback((columnId: string) => {
    const newTask: Task = {
      id: uuidv4(),
      title: '',
      description: '',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      assignee: '我',
    };
    setSelectedTask({ task: newTask, columnId });
    setIsModalOpen(true);
  }, []);

  const handleSaveTask = useCallback(
    async (task: Task, columnId: string, isNew: boolean) => {
      if (!currentBoard) return;

      if (isNew) {
        try {
          await createTask({
            task,
            boardId: currentBoardId,
            columnId,
          });
          addToast({ message: '任务创建成功', type: 'success' });
        } catch (error) {
          console.error('Failed to create task:', error);
          addToast({ message: '创建任务失败', type: 'warning' });
        }
      } else {
        try {
          await updateTaskCard(task.id, {
            task,
            boardId: currentBoardId,
            columnId,
          });
          useBoardStore.getState().updateTaskLocally(task.id, columnId, task);
          addToast({ message: '任务更新成功', type: 'success' });
        } catch (error) {
          console.error('Failed to update task:', error);
          addToast({ message: '更新任务失败', type: 'warning' });
        }
      }

      setIsModalOpen(false);
      setSelectedTask(null);
    },
    [currentBoard, currentBoardId, addToast]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string, columnId: string) => {
      if (!currentBoard) return;

      try {
        await deleteTask(taskId, { columnId, boardId: currentBoardId });
        addToast({ message: '任务已删除', type: 'success' });
      } catch (error) {
        console.error('Failed to delete task:', error);
        addToast({ message: '删除任务失败', type: 'warning' });
      }

      setIsModalOpen(false);
      setSelectedTask(null);
    },
    [currentBoard, currentBoardId, addToast]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#E8F0FE]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#4A90D9] shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center h-14 gap-6">
            <div className="flex items-center gap-2 text-white">
              <KanbanSquare size={24} className="flex-shrink-0" />
              <span className="font-bold text-lg">FlowBoard</span>
            </div>

            <nav className="flex-1 flex items-center gap-1 overflow-x-auto hide-scrollbar">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleBoardSwitch(board.id)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                    transition-all duration-150
                    ${
                      currentBoardId === board.id
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {board.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-6 px-4">
        <div className="max-w-[1600px] mx-auto">
          <div
            className={`
              transition-all duration-300 ease-out
              ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
            `}
          >
            {currentBoard && (
              <div className="flex flex-wrap md:flex-nowrap items-stretch -mx-2">
                {currentBoard.columns.map((column) => (
                  <ColumnDropZone
                    key={column.id}
                    column={column}
                    boardId={currentBoardId}
                    onTaskClick={handleTaskClick}
                    onDrop={handleDrop}
                    onAddTask={handleAddTask}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedTask && (
        <TaskDetailModal
          isOpen={isModalOpen}
          task={selectedTask.task}
          columnId={selectedTask.columnId}
          isNew={!boards.some((b) =>
            b.columns.some((c) => c.tasks.some((t) => t.id === selectedTask.task.id))
          )}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export const BoardView = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <BoardViewContent />
    </DndProvider>
  );
};
