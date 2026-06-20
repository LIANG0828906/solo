import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task, TeamMember, TaskStatus, statusColors, statusLabels } from '../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  teamMembers: TeamMember[];
  isLoading: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  teamMembers,
  isLoading,
}) => {
  const getAssignee = (assigneeId: string) =>
    teamMembers.find((m) => m.id === assigneeId);

  const SkeletonCard = () => (
    <div className="skeleton-card">
      <div className="skeleton-line" style={{ width: '80%' }} />
      <div className="skeleton-line" style={{ width: '60%' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <div className="skeleton-avatar" />
        <div>
          <div className="skeleton-line" style={{ width: 60, height: 10, marginBottom: 4 }} />
          <div className="skeleton-line" style={{ width: 40, height: 8 }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="kanban-column">
      <div className="column-header">
        <div className="column-title">
          <span
            className="column-dot"
            style={{ background: statusColors[status] }}
          />
          {statusLabels[status]}
        </div>
        <span className="task-count">{tasks.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`task-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
          >
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">暂无任务</div>
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  assignee={getAssignee(task.assigneeId)}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
