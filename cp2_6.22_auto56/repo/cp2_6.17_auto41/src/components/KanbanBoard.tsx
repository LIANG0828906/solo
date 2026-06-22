import { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import TaskCard from './TaskCard';
import { useStore, darkenColor } from '@/stores/useStore';
import { TaskStatus } from '@/utils/db';

const COLUMN_COLORS: Record<TaskStatus, { bg: string; dot: string; header: string }> = {
  todo: { bg: '#F8F9FA', dot: '#95A5A6', header: '#2C3E50' },
  in_progress: { bg: '#EBF5FB', dot: '#3498DB', header: '#2980B9' },
  done: { bg: '#EAFAF1', dot: '#2ECC71', header: '#27AE60' },
};

const ADD_BTN_COLOR = '#3498DB';

export default function KanbanBoard() {
  const columns = useStore(s => s.columns);
  const moveTask = useStore(s => s.moveTask);
  const addTask = useStore(s => s.addTask);
  const members = useStore(s => s.members);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addColumn, setAddColumn] = useState<TaskStatus>('todo');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const source = {
      columnId: result.source.droppableId as TaskStatus,
      index: result.source.index,
    };
    const destination = {
      columnId: result.destination.droppableId as TaskStatus,
      index: result.destination.index,
    };
    moveTask(source, destination);
  };

  const openAddModal = (col: TaskStatus) => {
    setAddColumn(col);
    setNewTitle('');
    setNewDesc('');
    setNewAssignee(members[0]?.id || '');
    setNewProject('');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    setNewDueDate(defaultDate.toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const confirmAdd = () => {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: addColumn,
      assigneeId: newAssignee || members[0]?.id || '',
      projectName: newProject.trim() || '未分类项目',
      dueDate: newDueDate,
      completedAt: null,
    });
    setShowAddModal(false);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '16px',
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          {(Object.keys(columns) as TaskStatus[]).map(colId => {
            const col = columns[colId];
            const colors = COLUMN_COLORS[colId];
            return (
              <div
                key={colId}
                style={{
                  flexShrink: 0,
                  width: '320px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: colors.dot,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: colors.header,
                      }}
                    >
                      {col.title}
                    </span>
                    <span
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.header,
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 500,
                      }}
                    >
                      {col.taskIds.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openAddModal(colId)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: ADD_BTN_COLOR,
                      color: '#FFFFFF',
                      fontSize: '18px',
                      lineHeight: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s ease, transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkenColor(ADD_BTN_COLOR, 15);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = ADD_BTN_COLOR;
                    }}
                  >
                    +
                  </button>
                </div>

                <Droppable droppableId={colId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: '80px',
                        backgroundColor: snapshot.isDraggingOver ? colors.bg : 'transparent',
                        borderRadius: '8px',
                        padding: snapshot.isDraggingOver ? '8px' : '0',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {col.taskIds.map((taskId, idx) => (
                          <TaskCard key={taskId} taskId={taskId} index={idx} />
                        ))}
                      </div>
                      {provided.placeholder}
                      {col.taskIds.length === 0 && (
                        <div
                          style={{
                            textAlign: 'center',
                            padding: '32px 16px',
                            color: '#B0B8C0',
                            fontSize: '13px',
                            border: '2px dashed #E5E8EB',
                            borderRadius: '8px',
                          }}
                        >
                          暂无任务
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </div>

      {showAddModal && (
        <div
          className="overlay-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(44, 62, 80, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '420px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#2C3E50' }}>
              新建任务 - {columns[addColumn].title}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
                  任务标题 <span style={{ color: '#E74C3C' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="请输入任务标题"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D5D8DC',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3498DB')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#D5D8DC')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
                  任务描述
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="请输入任务描述（可选）"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D5D8DC',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3498DB')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#D5D8DC')}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
                    指派成员
                  </label>
                  <select
                    value={newAssignee}
                    onChange={e => setNewAssignee(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D5D8DC',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D5D8DC',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#5D6D7E', marginBottom: '6px', fontWeight: 500 }}>
                  所属项目
                </label>
                <input
                  type="text"
                  value={newProject}
                  onChange={e => setNewProject(e.target.value)}
                  placeholder="请输入项目名称"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D5D8DC',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3498DB')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#D5D8DC')}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  backgroundColor: '#ECF0F1',
                  color: '#2C3E50',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                取消
              </button>
              <button
                onClick={confirmAdd}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  backgroundColor: '#3498DB',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
