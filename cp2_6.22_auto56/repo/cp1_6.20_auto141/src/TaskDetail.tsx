import React from 'react';
import { v4 as uuidv4 } from 'uuid';

interface TaskDetailProps {
  task: {
    id: string;
    name: string;
    description: string;
    assignee: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    subtasks: { id: string; name: string; completed: boolean }[];
  };
  listId: string;
  boardId: string;
  onClose: () => void;
  onUpdateTask: (listId: string, task: any) => void;
  teamMembers: string[];
}

const PRIORITY_OPTIONS: { value: 'high' | 'medium' | 'low'; label: string; color: string }[] = [
  { value: 'high', label: '高', color: '#e74c3c' },
  { value: 'medium', label: '中', color: '#f39c12' },
  { value: 'low', label: '低', color: '#27ae60' },
];

function TaskDetail({ task, listId, boardId, onClose, onUpdateTask, teamMembers }: TaskDetailProps) {
  const [visible, setVisible] = React.useState(false);
  const [name, setName] = React.useState(task.name);
  const [description, setDescription] = React.useState(task.description);
  const [assignee, setAssignee] = React.useState(task.assignee);
  const [priority, setPriority] = React.useState(task.priority);
  const [dueDate, setDueDate] = React.useState(task.dueDate);
  const [subtasks, setSubtasks] = React.useState(task.subtasks);
  const [addingSubtask, setAddingSubtask] = React.useState(false);
  const [newSubtaskName, setNewSubtaskName] = React.useState('');

  React.useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true);
    });
  }, []);

  React.useEffect(() => {
    setName(task.name);
    setDescription(task.description);
    setAssignee(task.assignee);
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setSubtasks(task.subtasks);
  }, [task]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const updatedTask = {
        ...task,
        name,
        description,
        assignee,
        priority,
        dueDate,
        subtasks,
      };
      onUpdateTask(listId, updatedTask);
    }, 2000);
    return () => clearTimeout(timer);
  }, [name, description, assignee, priority, dueDate, subtasks]);

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskName.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: uuidv4(), name: newSubtaskName.trim(), completed: false },
    ]);
    setNewSubtaskName('');
    setAddingSubtask(false);
  };

  const handleNewSubtaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setAddingSubtask(false);
      setNewSubtaskName('');
    }
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#7f8c8d',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .task-detail-panel {
            width: 100% !important;
          }
        }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
        }}
      />

      <div
        className="task-detail-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 400,
          height: '100vh',
          background: '#fff',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e0e0e0',
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              flex: 1,
              fontSize: 18,
              fontWeight: 'bold',
              border: 'none',
              outline: 'none',
              color: '#2c3e50',
              background: 'transparent',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: '#999',
              padding: '4px 8px',
              marginLeft: 12,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div>
            <div style={sectionLabel}>描述</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                minHeight: 80,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                color: '#2c3e50',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={sectionLabel}>负责人</div>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                color: '#2c3e50',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="">-- 选择负责人 --</option>
              {teamMembers.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={sectionLabel}>优先级</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      border: isSelected ? `2px solid ${opt.color}` : '2px solid #e0e0e0',
                      borderRadius: 8,
                      background: isSelected ? `${opt.color}10` : '#fff',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? opt.color : '#999',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isSelected ? opt.color : 'transparent',
                        border: isSelected ? 'none' : `2px solid #ccc`,
                        flexShrink: 0,
                      }}
                    />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={sectionLabel}>截止日期</div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                color: '#2c3e50',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={sectionLabel}>子任务</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      style={{ display: 'none' }}
                    />
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: subtask.completed
                          ? '2px solid #27ae60'
                          : '2px solid #ccc',
                        background: subtask.completed ? '#27ae60' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {subtask.completed && (
                        <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>
                      )}
                    </span>
                  </label>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: subtask.completed ? '#999' : '#2c3e50',
                      textDecoration: subtask.completed ? 'line-through' : 'none',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {subtask.name}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#bbb',
                      cursor: 'pointer',
                      fontSize: 14,
                      padding: '2px 4px',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {addingSubtask && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    type="text"
                    value={newSubtaskName}
                    onChange={(e) => setNewSubtaskName(e.target.value)}
                    onKeyDown={handleNewSubtaskKeyDown}
                    onBlur={() => {
                      if (newSubtaskName.trim()) {
                        handleAddSubtask();
                      } else {
                        setAddingSubtask(false);
                        setNewSubtaskName('');
                      }
                    }}
                    placeholder="子任务名称"
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: 6,
                      fontSize: 14,
                      outline: 'none',
                      color: '#2c3e50',
                    }}
                  />
                </div>
              )}

              {!addingSubtask && (
                <button
                  onClick={() => setAddingSubtask(true)}
                  style={{
                    background: 'none',
                    border: '1px dashed #c0c8d4',
                    borderRadius: 6,
                    padding: '6px 12px',
                    color: '#7f8c8d',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: 4,
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f7fa';
                    e.currentTarget.style.color = '#2c3e50';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = '#7f8c8d';
                  }}
                >
                  + 添加子任务
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TaskDetail;
