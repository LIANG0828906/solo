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
  onMobileMoveCard?: (task: Task) => void;
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
  onMobileMoveCard,
}: BoardProps) {
  const columns = STATUS_ORDER.map((status) => {
    const columnTasks = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
    return { status, tasks: columnTasks };
  });

  const renderCards = (columnTasks: Task[]) => {
    if (columnTasks.length === 0) {
      return <div className="empty-column">暂无卡片</div>;
    }
    return columnTasks.map((task, index) => (
      <Card
        key={task.id}
        task={task}
        onClick={(t) => {
          if (isMobile && onMobileMoveCard) {
            onMobileMoveCard(t);
          } else {
            onCardClick(t);
          }
        }}
        index={index}
        isFiltered={taskMatchesFilter(task, filteredTags)}
        isMobile={isMobile}
        onStatusChange={onCardStatusChange}
      />
    ));
  };

  return (
    <div className="board">
      {columns.map(({ status, tasks: columnTasks }) => {
        const meta = STATUS_META[status];

        if (isMobile) {
          return (
            <div className="column" key={status}>
              <div className="column-header">
                <div className="column-dot" style={{ backgroundColor: meta.color }} />
                <div className="column-title">{meta.label}</div>
                <div className="column-count">{columnTasks.length}</div>
              </div>
              <div className="column-body">
                {renderCards(columnTasks)}
              </div>
            </div>
          );
        }

        return (
          <div className="column" key={status}>
            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`column-body ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                >
                  <div className="column-header">
                    <div className="column-dot" style={{ backgroundColor: meta.color }} />
                    <div className="column-title">{meta.label}</div>
                    <div className="column-count">{columnTasks.length}</div>
                  </div>
                  {renderCards(columnTasks)}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        );
      })}
    </div>
  );
}
