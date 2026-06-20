import React, { useState } from 'react';
import { useMindmapStore } from '../store/mindmapStore';
import { Task } from '../types';

const priorityColors: Record<string, string> = {
  high: '#ff4d4f',
  medium: '#faad14',
  low: '#52c41a',
};

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const assignees = ['Alice', 'Bob', 'Carol', 'Dave'];

interface NodeDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  addingTaskForNodeId: string | null;
  setAddingTaskForNodeId: (id: string | null) => void;
  isMobile: boolean;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  isOpen,
  onClose,
  addingTaskForNodeId,
  setAddingTaskForNodeId,
  isMobile,
}) => {
  const {
    selectedNodeId,
    nodes,
    getTasksForNode,
    toggleTask,
    deleteTask,
    addTask,
    updateNode,
  } = useMindmapStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const tasks = selectedNodeId ? getTasksForNode(selectedNodeId) : [];

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const [editingNode, setEditingNode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const showTaskForm = addingTaskForNodeId !== null;

  const startEditNode = () => {
    if (selectedNode) {
      setEditTitle(selectedNode.title);
      setEditDescription(selectedNode.description);
      setEditingNode(true);
    }
  };

  const saveNodeEdit = () => {
    if (selectedNodeId && editTitle.trim()) {
      updateNode(selectedNodeId, {
        title: editTitle.trim(),
        description: editDescription,
      });
    }
    setEditingNode(false);
  };

  const handleAddTask = () => {
    if (!addingTaskForNodeId || !newTaskTitle.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: '',
      due_date: newTaskDueDate || null,
      assignee: newTaskAssignee || null,
      priority: newTaskPriority,
      completed: false,
      node_id: addingTaskForNodeId,
    };
    addTask(task);

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskAssignee('');
    setNewTaskPriority('medium');
    setAddingTaskForNodeId(null);
  };

  const cancelAddTask = () => {
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskAssignee('');
    setNewTaskPriority('medium');
    setAddingTaskForNodeId(null);
  };

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60vh',
        backgroundColor: 'rgba(30, 30, 46, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        borderLeft: 'none',
        borderRight: 'none',
        color: '#fff',
        padding: '20px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-out',
        zIndex: 100,
        borderRadius: '16px 16px 0 0',
      }
    : {
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        height: '100vh',
        backgroundColor: 'rgba(30, 30, 46, 0.9)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid rgba(255,255,255,0.2)',
        color: '#fff',
        padding: '20px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-out',
        zIndex: 100,
      };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>节点详情</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            opacity: 0.7,
          }}
        >
          ×
        </button>
      </div>

      {!selectedNode && !showTaskForm && (
        <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '40px' }}>
          请选择一个节点查看详情
        </div>
      )}

      {selectedNode && !showTaskForm && (
        <div>
          {editingNode ? (
            <div>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '16px',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="节点描述"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '14px',
                  resize: 'vertical',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={saveNodeEdit}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingNode(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div onClick={startEditNode} style={{ cursor: 'pointer' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{selectedNode.title}</h2>
              {selectedNode.description ? (
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{selectedNode.description}</p>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontStyle: 'italic' }}>
                  点击编辑标题和描述
                </p>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: '24px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '16px' }}>关联任务 ({tasks.length})</h4>
            <button
              onClick={() => setAddingTaskForNodeId(selectedNodeId)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#3b82f6',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              + 添加任务
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                暂无任务
              </div>
            )}
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  style={{ marginTop: '2px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      opacity: task.completed ? 0.5 : 1,
                    }}
                  >
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: priorityColors[task.priority],
                        color: '#fff',
                      }}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                    {task.due_date && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        📅 {task.due_date}
                      </span>
                    )}
                    {task.assignee && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        👤 {task.assignee}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTaskForm && (
        <div
          style={{
            animation: 'bounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>添加任务</h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
              任务标题
            </label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="输入任务标题"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
              截止日期
            </label>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="light-date-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d0d0d0',
                backgroundColor: '#f0f0f0',
                color: '#333',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
              负责人
            </label>
            <select
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d0d0d0',
                backgroundColor: '#f0f0f0',
                color: '#333',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            >
              <option value="">选择负责人</option>
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
              优先级
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewTaskPriority(p)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: newTaskPriority === p ? '2px solid #fff' : '1px solid transparent',
                    backgroundColor: priorityColors[p],
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    opacity: newTaskPriority === p ? 1 : 0.7,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {priorityLabels[p]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#3b82f6',
                color: '#fff',
                cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 500,
                opacity: newTaskTitle.trim() ? 1 : 0.5,
              }}
            >
              添加
            </button>
            <button
              onClick={cancelAddTask}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounceIn {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .light-date-input::-webkit-calendar-picker-indicator {
          filter: invert(0.3);
          cursor: pointer;
        }

        .light-date-input::-webkit-datetime-edit {
          color: #333;
        }

        select option {
          background-color: #f0f0f0;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default NodeDetailPanel;
