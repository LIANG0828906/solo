import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { Circle, Clock, Check } from 'lucide-react';
import TaskCard from './TaskCard';
import Modal from './Modal';
import { useTaskStore, Task, TaskStatus } from '../data/taskStore';

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  icon: React.ReactNode;
}

const columns: ColumnConfig[] = [
  { id: 'todo', title: '待办', icon: <Circle size={16} color="#333" /> },
  { id: 'in-progress', title: '进行中', icon: <Clock size={16} color="#333" /> },
  { id: 'done', title: '已完成', icon: <Check size={16} color="#333" /> },
];

const KanbanBoard: React.FC = () => {
  const { tasks, moveTask, completeTask, getStatistics } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tasksByStatus = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      todo: [],
      'in-progress': [],
      done: [],
    };
    tasks.forEach((task) => {
      result[task.status].push(task);
    });
    return result;
  }, [tasks]);

  const statistics = useMemo(() => getStatistics(), [tasks, getStatistics]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination, source } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    moveTask(
      draggableId,
      destination.droppableId as TaskStatus,
      destination.index
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F5F5FA',
          padding: '32px',
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#333',
                }}
              >
                PlanifLow
              </h1>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: '#666',
                }}
              >
                轻量级看板任务管理
              </p>
            </div>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'nowrap',
              }}
              className="kanban-columns"
            >
              {columns.map((column) => (
                <div
                  key={column.id}
                  style={{
                    flex: 1,
                    minWidth: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  className="kanban-column"
                >
                  <div
                    style={{
                      backgroundColor: '#F0F0F5',
                      borderRadius: '8px 8px 0 0',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {column.icon}
                      <span>{column.title}</span>
                    </div>
                    <span
                      style={{
                        backgroundColor: '#E0E0E8',
                        color: '#666',
                        fontSize: '12px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        padding: '4px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '24px',
                        lineHeight: 1,
                      }}
                    >
                      {tasksByStatus[column.id].length}
                    </span>
                  </div>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          flex: 1,
                          backgroundColor: '#F5F5FA',
                          padding: '8px',
                          minHeight: '100px',
                        }}
                      >
                        {tasksByStatus[column.id].map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onClick={() => setSelectedTask(task)}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  <div
                    style={{
                      padding: '8px',
                    }}
                  >
                    <button
                      onClick={() => setIsModalOpen(true)}
                      style={{
                        width: '100px',
                        height: '36px',
                        backgroundColor: '#6C63FF',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '18px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = '#5A52D5')
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = '#6C63FF')
                      }
                    >
                      汇总
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>

      <div
        className={`detail-panel-overlay ${selectedTask ? 'visible' : ''}`}
        onClick={() => setSelectedTask(null)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: selectedTask ? 'rgba(0,0,0,0.3)' : 'transparent',
          pointerEvents: selectedTask ? 'auto' : 'none',
          transition: 'background-color 0.3s ease',
          zIndex: 900,
        }}
      >
        <div
          className={`detail-panel ${selectedTask ? 'visible' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '320px',
            height: '100vh',
            backgroundColor: '#1E1E2E',
            color: '#FFFFFF',
            borderRadius: '12px 0 0 12px',
            padding: '32px 24px',
            boxSizing: 'border-box',
            transform: selectedTask ? 'translateX(0)' : 'translateX(100%)',
            transition:
              'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 901,
            overflowY: 'auto',
          }}
        >
          {selectedTask && (
            <>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '24px',
                  cursor: 'pointer',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
              >
                ×
              </button>

              <h2
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                  paddingRight: '32px',
                }}
              >
                {selectedTask.title}
              </h2>

              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '6px',
                  }}
                >
                  描述
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#DDD',
                  }}
                >
                  {selectedTask.description || '暂无描述'}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '6px',
                  }}
                >
                  创建时间
                </div>
                <div style={{ fontSize: '14px', color: '#DDD' }}>
                  {formatDate(selectedTask.createdAt)}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '6px',
                  }}
                >
                  到期时间
                </div>
                <div style={{ fontSize: '14px', color: '#DDD' }}>
                  {selectedTask.dueDate
                    ? formatDate(selectedTask.dueDate)
                    : '未设置'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginBottom: '6px',
                    }}
                  >
                    预估工时
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>
                    {selectedTask.estimatedHours}h
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginBottom: '6px',
                    }}
                  >
                    实际工时
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>
                    {selectedTask.actualHours}h
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '6px',
                  }}
                >
                  状态
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor:
                      selectedTask.status === 'done'
                        ? 'rgba(76, 175, 80, 0.2)'
                        : selectedTask.status === 'in-progress'
                        ? 'rgba(108, 99, 255, 0.2)'
                        : 'rgba(255, 140, 0, 0.2)',
                    color:
                      selectedTask.status === 'done'
                        ? '#4CAF50'
                        : selectedTask.status === 'in-progress'
                        ? '#6C63FF'
                        : '#FF8C00',
                  }}
                >
                  {selectedTask.status === 'done'
                    ? '已完成'
                    : selectedTask.status === 'in-progress'
                    ? '进行中'
                    : '待办'}
                </div>
              </div>

              {selectedTask.status !== 'done' && (
                <button
                  onClick={() => {
                    completeTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: '#6C63FF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = '#5A52D5')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = '#6C63FF')
                  }
                >
                  标记为完成
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        statistics={statistics}
      />
    </>
  );
};

export default KanbanBoard;
