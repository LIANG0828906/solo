import React from 'react';
import TaskCard from './TaskCard';

interface Task {
  id: string;
  name: string;
  description: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  subtasks: { id: string; name: string; completed: boolean }[];
}

interface BoardProps {
  boardData: {
    id: string;
    name: string;
    lists: {
      todo: Task[];
      inProgress: Task[];
      done: Task[];
    };
  } | null;
  onUpdateBoard: (data: any) => void;
  onOpenDetail: (taskId: string, listId: string) => void;
  teamMembers: string[];
}

const LIST_CONFIG: { key: 'todo' | 'inProgress' | 'done'; label: string; accent: string }[] = [
  { key: 'todo', label: '待办', accent: '#4a90d9' },
  { key: 'inProgress', label: '进行中', accent: '#f5a623' },
  { key: 'done', label: '已完成', accent: '#27ae60' },
];

let dragTaskId: string | null = null;
let dragSourceListId: string | null = null;

function Board({ boardData, onUpdateBoard, onOpenDetail }: BoardProps) {
  const [dragOverListId, setDragOverListId] = React.useState<string | null>(null);

  const handleAddTask = React.useCallback(
    (listId: 'todo' | 'inProgress' | 'done') => {
      if (!boardData) return;
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: '新任务',
        description: '',
        assignee: '',
        priority: 'medium',
        dueDate: '',
        subtasks: [],
      };
      const updatedLists = { ...boardData.lists };
      updatedLists[listId] = [...updatedLists[listId], newTask];
      onUpdateBoard({ ...boardData, lists: updatedLists });
    },
    [boardData, onUpdateBoard],
  );

  const handleDragStart = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>, taskId: string, listId: string) => {
      dragTaskId = taskId;
      dragSourceListId = listId;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, listId }));
      requestAnimationFrame(() => {
        const el = e.currentTarget;
        if (el) el.style.opacity = '0.5';
      });
    },
    [],
  );

  const handleDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>, listId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverListId !== listId) {
        requestAnimationFrame(() => {
          setDragOverListId(listId);
        });
      }
    },
    [dragOverListId],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetListId: string) => {
      e.preventDefault();
      setDragOverListId(null);
      if (!boardData || !dragTaskId || !dragSourceListId) return;
      if (dragSourceListId === targetListId) return;
      const sourceList = [...boardData.lists[dragSourceListId as keyof boardData.lists]];
      const targetList = [...boardData.lists[targetListId as keyof boardData.lists]];
      const taskIndex = sourceList.findIndex((t) => t.id === dragTaskId);
      if (taskIndex === -1) return;
      const [movedTask] = sourceList.splice(taskIndex, 1);
      targetList.push(movedTask);
      const updatedLists = { ...boardData.lists, [dragSourceListId]: sourceList, [targetListId]: targetList };
      onUpdateBoard({ ...boardData, lists: updatedLists });
      dragTaskId = null;
      dragSourceListId = null;
    },
    [boardData, onUpdateBoard],
  );

  const handleDragEnd = React.useCallback(() => {
    setDragOverListId(null);
    dragTaskId = null;
    dragSourceListId = null;
    const cards = document.querySelectorAll('[data-task-card]');
    cards.forEach((card) => {
      (card as HTMLElement).style.opacity = '1';
    });
  }, []);

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>, listId: string) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        if (dragOverListId === listId) {
          setDragOverListId(null);
        }
      }
    },
    [dragOverListId],
  );

  if (!boardData) return null;

  return (
    <div className="board">
      {LIST_CONFIG.map(({ key, label, accent }) => {
        const tasks = boardData.lists[key];
        const isDragOver = dragOverListId === key;

        return (
          <div
            key={key}
            className={`column ${isDragOver ? 'column-drop-active' : ''}`}
            onDragOver={(e) => handleDragOver(e, key)}
            onDrop={(e) => handleDrop(e, key)}
            onDragLeave={(e) => handleDragLeave(e, key)}
          >
            <div className="column-header">
              <div className="column-header-dot" style={{ background: accent }} />
              <span>{label}</span>
              <span className="column-header-count" style={{ background: accent }}>
                {tasks.length}
              </span>
            </div>

            <div className="column-tasks">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  data-task-card
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id, key)}
                  onDragEnd={handleDragEnd}
                >
                  <TaskCard task={task} listId={key} onOpenDetail={onOpenDetail} />
                </div>
              ))}
            </div>

            <button className="add-task-btn" onClick={() => handleAddTask(key)}>
              + 添加任务
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default Board;
