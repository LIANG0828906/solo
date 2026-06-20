import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ColumnData, TaskData } from '../../types';
import Card from './Card';

interface ColumnProps {
  column: ColumnData;
  tasks: TaskData[];
  onAddCard: () => void;
  onEditCard: (task: TaskData) => void;
}

function Column({ column, tasks, onAddCard, onEditCard }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="column">
      <div className="column-header">
        <div className="column-title">
          <span>{column.title}</span>
          <span className="column-count">{tasks.length}</span>
        </div>
        <button className="add-card-btn" onClick={onAddCard} title="添加任务">
          +
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`column-content ${isOver ? 'drag-over' : ''}`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <Card
              key={task.id}
              task={task}
              onEdit={() => onEditCard(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            暂无任务
          </div>
        )}
      </div>
    </div>
  );
}

export default Column;
