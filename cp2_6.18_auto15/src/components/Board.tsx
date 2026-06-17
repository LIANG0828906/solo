import { useState } from 'react';
import type { DragEvent } from 'react';
import type { Task, TaskStatus } from '@/types';
import { useTaskStore } from '@/store/taskStore';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import StatsPanel from './StatsPanel';

interface BoardProps {
  projectId: string;
}

interface ColumnConfig {
  status: TaskStatus;
  title: string;
  bgColor: string;
}

const columns: ColumnConfig[] = [
  { status: 'todo', title: '待办', bgColor: '#F7F7FC' },
  { status: 'in-progress', title: '进行中', bgColor: '#FFF8E1' },
  { status: 'done', title: '已完成', bgColor: '#E8F5E9' },
];

export default function Board({ projectId }: BoardProps) {
  const allTasks = useTaskStore((state) => state.tasks);
  const tasks = allTasks.filter((t) => t.projectId === projectId);
  const moveTask = useTaskStore((state) => state.moveTask);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const users = useTaskStore((state) => state.users);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<TaskStatus, string>>({
    todo: '',
    'in-progress': '',
    done: '',
  });
  const [showInput, setShowInput] = useState<Record<TaskStatus, boolean>>({
    todo: false,
    'in-progress': false,
    done: false,
  });

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTask(taskId, status);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleSave = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
  };

  const handleAddTask = (status: TaskStatus) => {
    const title = newTaskInputs[status].trim();
    if (!title) return;

    const defaultAssignee = users[0]?.id || '';
    addTask({
      title,
      description: '',
      status,
      projectId,
      assignee: defaultAssignee,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    setNewTaskInputs((prev) => ({ ...prev, [status]: '' }));
    setShowInput((prev) => ({ ...prev, [status]: false }));
  };

  const handleNewTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, status: TaskStatus) => {
    if (e.key === 'Enter') {
      handleAddTask(status);
    } else if (e.key === 'Escape') {
      setNewTaskInputs((prev) => ({ ...prev, [status]: '' }));
      setShowInput((prev) => ({ ...prev, [status]: false }));
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: '100%' }}>
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 16,
          flexDirection: 'row',
          flexWrap: 'nowrap',
        }}
        className="board-columns"
      >
        {columns.map((col) => {
          const columnTasks = tasks
            .filter((t) => t.status === col.status)
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
              style={{
                minWidth: 300,
                width: 300,
                backgroundColor: col.bgColor,
                borderRadius: 12,
                padding: 16,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">
                  {col.title}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({columnTasks.length})
                  </span>
                </h3>
                {!showInput[col.status] && (
                  <button
                    onClick={() => setShowInput((prev) => ({ ...prev, [col.status]: true }))}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/60 text-gray-500 hover:text-gray-700 transition-colors text-xl font-light"
                  >
                    +
                  </button>
                )}
              </div>

              {showInput[col.status] && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={newTaskInputs[col.status]}
                    onChange={(e) =>
                      setNewTaskInputs((prev) => ({ ...prev, [col.status]: e.target.value }))
                    }
                    onKeyDown={(e) => handleNewTaskKeyDown(e, col.status)}
                    onBlur={() => {
                      if (newTaskInputs[col.status].trim()) {
                        handleAddTask(col.status);
                      } else {
                        setShowInput((prev) => ({ ...prev, [col.status]: false }));
                      }
                    }}
                    placeholder="输入任务标题..."
                    autoFocus
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 flex-grow">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <StatsPanel projectId={projectId} />
      </div>

      <TaskModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={(updates) => {
          if (selectedTask) {
            handleSave(selectedTask.id, updates);
          }
        }}
      />
    </div>
  );
}
