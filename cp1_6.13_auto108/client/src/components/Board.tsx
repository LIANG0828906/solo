import { Droppable } from 'react-beautiful-dnd';
import Card from './Card';
import type { Task, TaskStatus } from '../types';
import { STATUS_META } from '../types';

interface BoardProps {
  tasks: Task[];
  onCardClick: (task: Task) => void;
  filteredTags: string[];
  isMobile: boolean;
  onCardStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done'];

function taskMatchesFilter(task: Task, filteredTags: string[]): 'visible' | 'dimmed' | 'hidden' {
  if (filteredTags.length === 0) return 'visible';
  const hasMatch = filteredTags.some((tag) => task.tags.includes(tag as Task['tags'][number]));
  return hasMatch ? 'visible' : 'dimmed';
}

export default function Board({
  tasks,
  onCardClick,
  filteredTags,
  isMobile,
  onCardStatusChange,
}: BoardProps) {
  const columns = STATUS_ORDER.map((status) => {
    const columnTasks = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
    return { status, tasks: columnTasks };
  });

  return (
    <div className="board">
      {columns.map(({ status, tasks: columnTasks }) => {
        const meta = STATUS_META[status];
        const droppableId = status;

        const columnContent = (
          <>
            <div className="column-header">
              <div className="column-dot" style={{ backgroundColor: meta.color }} />
              <div className="column-title">{meta.label}</div>
              <div className="column-count">{columnTasks.length}</div>
            </div>
            {columnTasks.length === 0 ? (
              <div className="empty-column">暂无卡片</div>
            ) : (
              columnTasks.map((task, index) => (
                <Card
                  key={task.id}
                  task={task}
                  onClick={onCardClick}
                  index={index}
                  isFiltered={taskMatchesFilter(task, filteredTags)}
                  isMobile={isMobile}
                  onStatusChange={onCardStatusChange}
                />
              ))
            )}
          </>
        );

        return (
          <div className="column" key={status}>
            {isMobile ? (
              <div className="column-body">{columnContent}</div>
            ) : (
              <Droppable droppableId={droppableId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`column-body ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {columnContent}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        );
      })}
    </div>
  );
}
