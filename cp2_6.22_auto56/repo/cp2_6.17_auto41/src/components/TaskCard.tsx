import { Draggable } from 'react-beautiful-dnd';
import { useStore } from '@/stores/useStore';

interface Props {
  taskId: string;
  index: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export default function TaskCard({ taskId, index }: Props) {
  const task = useStore(s => s.tasks[taskId]);
  const member = useStore(s => s.getMemberById(task?.assigneeId || ''));
  const setSelectedTaskId = useStore(s => s.setSelectedTaskId);

  if (!task) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedTaskId(task.id);
  };

  const overdue = task.status !== 'done' && task.dueDate && isOverdue(task.dueDate);

  return (
    <Draggable draggableId={taskId} index={index}>
      {(provided, snapshot) => {
        const isDragging = snapshot.isDragging;
        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={handleClick}
            style={{
              ...provided.draggableProps.style,
              width: '280px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              padding: '16px',
              opacity: 1,
              boxShadow: isDragging
                ? 'none'
                : '0 1px 3px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: isDragging
                ? `${provided.draggableProps.style?.transform || ''} rotate(5deg) scale(1.05)`
                : provided.draggableProps.style?.transform,
              border: overdue ? '1px solid #E74C3C' : '1px solid transparent',
              position: 'relative',
              transformOrigin: 'center center',
            }}
            onMouseEnter={(e) => {
              if (!isDragging) {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
              }
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#7F8C8D',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#ECF0F1',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '160px',
                }}
              >
                {task.projectName}
              </span>
            </div>

            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#2C3E50',
                lineHeight: 1.4,
                marginBottom: '12px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '42px',
              }}
            >
              {task.title}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: member?.avatarColor || '#95A5A6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                  title={member?.name}
                >
                  {member?.name?.charAt(0) || '?'}
                </div>
                <span style={{ fontSize: '13px', color: '#7F8C8D' }}>
                  {member?.name || '未指派'}
                </span>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: overdue ? '#E74C3C' : '#7F8C8D',
                  fontWeight: overdue ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>📅</span>
                <span>{formatDate(task.dueDate)}</span>
              </div>
            </div>

            {overdue && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: '#E74C3C',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                逾期
              </div>
            )}
          </div>
        );
      }}
    </Draggable>
  );
}
