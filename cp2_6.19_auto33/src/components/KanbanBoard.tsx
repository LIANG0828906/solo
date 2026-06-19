import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useBoardStore, Priority } from '../store/boardStore';
import TaskCard from './TaskCard';

const columnConfig = {
  todo: { title: '待办', color: '#f59e0b' },
  inProgress: { title: '进行中', color: '#3b82f6' },
  done: { title: '已完成', color: '#10b981' },
};

const AddTaskModal = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const addTask = useBoardStore((state) => state.addTask);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTask({
        title: title.trim(),
        priority,
        estimatedDuration,
      });
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-in-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'rgba(45, 62, 80, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          animation: 'bounceIn 0.4s ease-in-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600 }}>新建任务</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
              任务标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a2332',
                border: '1px solid #3d5166',
                borderRadius: '8px',
                color: '#e4e6eb',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease-in-out',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.target.style.borderColor = '#3d5166')}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
              优先级
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: priority === p ? '#3b82f6' : '#1a2332',
                    border: '1px solid #3d5166',
                    borderRadius: '6px',
                    color: '#e4e6eb',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    transform: priority === p ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
              预估时长（分钟）
            </label>
            <input
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a2332',
                border: '1px solid #3d5166',
                borderRadius: '8px',
                color: '#e4e6eb',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease-in-out',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.target.style.borderColor = '#3d5166')}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #3d5166',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function KanbanBoard() {
  const {
    getTasksByColumn,
    moveTask,
    reorderTask,
    showAddModal,
    setShowAddModal,
  } = useBoardStore();

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceColumn = source.droppableId as 'todo' | 'inProgress' | 'done';
    const destColumn = destination.droppableId as 'todo' | 'inProgress' | 'done';

    if (sourceColumn === destColumn) {
      if (source.index !== destination.index) {
        reorderTask(sourceColumn, source.index, destination.index);
      }
    } else {
      const sourceTasks = getTasksByColumn(sourceColumn);
      const taskId = sourceTasks[source.index].id;
      moveTask(taskId, destColumn, destination.index);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>任务看板</h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span style={{ fontSize: '18px' }}>+</span>
          新建任务
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div
          style={{
            display: 'flex',
            gap: '20px',
            width: '100%',
          }}
          className="kanban-columns"
        >
          {(Object.keys(columnConfig) as ('todo' | 'inProgress' | 'done')[]).map((columnId) => {
            const tasks = getTasksByColumn(columnId);
            const config = columnConfig[columnId];
            return (
              <Droppable key={columnId} droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      backgroundColor: snapshot.isDraggingOver
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'transparent',
                      borderRadius: '12px',
                      padding: '16px',
                      transition: 'background-color 0.3s ease-in-out',
                      border: snapshot.isDraggingOver
                        ? '2px dashed #3b82f6'
                        : '2px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '16px',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: config.color,
                        }}
                      />
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{config.title}</h3>
                      <span
                        style={{
                          backgroundColor: '#3d5166',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#94a3b8',
                        }}
                      >
                        {tasks.length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        minHeight: '200px',
                      }}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.7 : 1,
                                transition: snapshot.isDragging
                                  ? 'none'
                                  : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                transform: snapshot.isDragging
                                  ? provided.draggableProps.style?.transform
                                  : undefined,
                              }}
                            >
                              <TaskCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}

      <style>{`
        @media (max-width: 768px) {
          .kanban-columns {
            flex-direction: column !important;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}
