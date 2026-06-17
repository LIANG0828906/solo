import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Task } from '../data/taskStore';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

enum DueStatus {
  Normal = 'normal',
  Warning = 'warning',
  Overdue = 'overdue',
}

const getDueStatus = (dueDate: string | null): DueStatus => {
  if (!dueDate) return DueStatus.Normal;
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diff = due - now;
  const oneHour = 60 * 60 * 1000;
  if (diff < 0) return DueStatus.Overdue;
  if (diff < oneHour) return DueStatus.Warning;
  return DueStatus.Normal;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const dueStatus = getDueStatus(task.dueDate);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            ...provided.draggableProps.style,
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: snapshot.isDragging
              ? '0 4px 16px rgba(108,99,255,0.3)'
              : '0 1px 3px rgba(0,0,0,0.12)',
            padding: '12px',
            marginBottom: '8px',
            cursor: 'pointer',
            position: 'relative',
            transform: snapshot.isDragging
              ? 'rotate(3deg) scale(1.02)'
              : 'rotate(0) scale(1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxSizing: 'border-box',
          }}
        >
          {dueStatus !== DueStatus.Normal && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor:
                  dueStatus === DueStatus.Warning ? '#FF8C00' : '#FF0000',
                animation:
                  dueStatus === DueStatus.Overdue
                    ? 'blink 1s infinite'
                    : 'none',
              }}
            />
          )}

          <h4
            style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: '#333',
              paddingLeft: dueStatus !== DueStatus.Normal ? '16px' : '0',
            }}
          >
            {task.title}
          </h4>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#666',
              marginTop: '8px',
            }}
          >
            <span>预估: {task.estimatedHours}h</span>
            <span>实际: {task.actualHours}h</span>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
