import React, { useEffect, useRef, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DraggableProvided,
  type DroppableProvided,
  type DraggableStateSnapshot,
} from 'react-beautiful-dnd';
import type { Task, TaskStatus } from './types';
import { STATUS_COLUMNS } from './types';
import { getInitials, hashNameToColor, timeAgo } from './utils';
import { updateTaskStatus } from './moduleA';
import { useBoardStore } from './store';

interface BoardProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

function reorder(list: Task[], startIndex: number, endIndex: number): Task[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

const TaskCard: React.FC<{
  task: Task;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}> = ({ task, provided, snapshot }) => {
  const [highlight, setHighlight] = useState(false);
  const prevStatusRef = useRef(task.status);

  useEffect(() => {
    if (prevStatusRef.current !== task.status) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 300);
      prevStatusRef.current = task.status;
      return () => clearTimeout(t);
    }
  }, [task.status]);

  const reviewer = task.reviewer;
  const avatarName = reviewer?.name || task.submitter?.name || 'U';
  const avatarColor = reviewer?.avatarColor || hashNameToColor(avatarName);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`task-card ${highlight ? 'card-highlight' : ''}`}
      style={{
        ...provided.draggableProps.style,
        transform: snapshot.isDragging
          ? `${provided.draggableProps.style?.transform || ''} scale(0.96)`
          : provided.draggableProps.style?.transform,
        transition: snapshot.isDragging ? 'transform 0.15s ease' : 'none',
        zIndex: snapshot.isDragging ? 1000 : 1,
      }}
    >
      <div className="task-title">{task.title}</div>
      {task.description && (
        <div className="task-desc" dangerouslySetInnerHTML={{ __html: renderMarkdown(task.description) }} />
      )}
      <div className="task-footer">
        <div className="task-avatar" style={{ background: avatarColor }} title={avatarName}>
          {getInitials(avatarName)}
        </div>
        <div className="task-meta">
          <div className="task-reviewer">{reviewer?.name || '未分配'}</div>
          <div className="task-time">{timeAgo(task.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
};

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

const Column: React.FC<{
  column: { id: TaskStatus; title: string; bgColor: string };
  tasks: Task[];
}> = ({ column, tasks }) => (
  <div className="board-column" style={{ background: column.bgColor }}>
    <div className="column-header">
      <h3 className="column-title">{column.title}</h3>
      <span className="column-count">{tasks.length}</span>
    </div>
    <Droppable droppableId={column.id}>
      {(provided: DroppableProvided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={`column-tasks ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
        >
          {tasks.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(p: DraggableProvided, s: DraggableStateSnapshot) => (
                <TaskCard task={task} provided={p} snapshot={s} />
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

const BoardView: React.FC<BoardProps> = ({ tasks, onStatusChange }) => {
  const { addToast } = useBoardStore();

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;

    try {
      await updateTaskStatus(draggableId, newStatus);
      onStatusChange?.(draggableId, newStatus);
    } catch {
      addToast({ message: '状态更新失败，请重试', type: 'error' });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board-container">
        {STATUS_COLUMNS.map((col) => {
          const colTasks = tasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          return <Column key={col.id} column={col} tasks={colTasks} />;
        })}
      </div>
    </DragDropContext>
  );
};

export default BoardView;
