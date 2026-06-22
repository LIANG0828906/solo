import { useState, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Plus, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TaskCard } from './TaskCard';
import { EmotionChart } from './EmotionChart';
import { useStore } from '@/store';
import { STATUS_MAP } from '@/types';
import type { TaskStatus, Task } from '@/types';

interface BoardProps {
  boardId: string;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: '待办' },
  { id: 'in-progress', title: '进行中' },
  { id: 'review', title: '审核' },
  { id: 'done', title: '已完成' },
];

export function Board({ boardId }: BoardProps) {
  const navigate = useNavigate();
  const { tasks, fetchTasks, addTask, updateTaskState, currentBoard, user } = useStore();
  const [showAddForm, setShowAddForm] = useState<TaskStatus | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee: '', dueDate: '' });

  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tasks]);

  const columns = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      tasks: getTasksByStatus(col.id),
    }));
  }, [getTasksByStatus]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    updateTaskState(
      draggableId,
      destination.droppableId as TaskStatus,
      destination.index
    );
  };

  const handleAddTask = async (status: TaskStatus) => {
    if (!newTask.title.trim() || !user) return;

    await addTask({
      boardId,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      assignee: newTask.assignee.trim(),
      dueDate: newTask.dueDate,
      status,
      emotion: null,
    });

    setNewTask({ title: '', description: '', assignee: '', dueDate: '' });
    setShowAddForm(null);
    await fetchTasks(boardId);
  };

  const handleOpenRetro = () => {
    navigate(`/board/${boardId}/retro`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            {currentBoard?.name || '看板'}
          </h1>
          {currentBoard?.description && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              {currentBoard.description}
            </p>
          )}
        </div>
        <button onClick={handleOpenRetro} className="btn btn-primary">
          <BarChart3 size={18} />
          生成回顾报告
        </button>
      </div>

      <EmotionChart tasks={tasks} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board-container" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {columns.map((column) => {
            const statusConfig = STATUS_MAP[column.id];
            return (
              <div key={column.id} className="board-column">
                <div className="board-column-header">
                  <div className="board-column-title">
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: statusConfig.color,
                    }} />
                    {column.title}
                    <span className="board-column-count">{column.tasks.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(showAddForm === column.id ? null : column.id)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {showAddForm === column.id && (
                  <div className="animate-fade-in" style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: 'var(--shadow-card)',
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="任务标题 *"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                    <textarea
                      className="textarea"
                      placeholder="任务描述"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      style={{ fontSize: '13px', padding: '8px 12px', minHeight: '60px' }}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="负责人"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                    <input
                      type="date"
                      className="input"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ flex: 1, padding: '8px', minHeight: 'auto', fontSize: '12px' }}
                        onClick={() => {
                          setShowAddForm(null);
                          setNewTask({ title: '', description: '', assignee: '', dueDate: '' });
                        }}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '8px', minHeight: 'auto', fontSize: '12px' }}
                        onClick={() => handleAddTask(column.id)}
                        disabled={!newTask.title.trim()}
                      >
                        添加
                      </button>
                    </div>
                  </div>
                )}

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        minHeight: '100px',
                        borderRadius: '8px',
                        transition: 'background 0.2s ease',
                        background: snapshot.isDraggingOver ? 'rgba(0,0,0,0.05)' : 'transparent',
                      }}
                    >
                      {column.tasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
