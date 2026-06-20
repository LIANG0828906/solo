import React, { useState } from 'react';
import { TeamMember, TaskPriority, priorityColors, priorityLabels } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: any) => void;
  teamMembers: TeamMember[];
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamMembers,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assigneeId || !dueDate) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      priority,
      dueDate,
      startDate: startDate || new Date().toISOString().split('T')[0],
    });

    setTitle('');
    setDescription('');
    setAssigneeId('');
    setPriority('medium');
    setDueDate('');
    setStartDate('');
    onClose();
  };

  if (!isOpen) return null;

  const isOverdue = dueDate && new Date(dueDate) < new Date();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">✨ 创建新任务</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">任务标题 *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">任务描述</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入任务描述（可选）"
            />
          </div>

          <div className="form-group">
            <label className="form-label">负责人 *</label>
            <select
              className="form-select"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">请选择负责人</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">优先级</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    padding: '6px 16px',
                    border: priority === p ? '2px solid ' + priorityColors[p] : '1px solid #ddd',
                    borderRadius: 6,
                    background: priority === p ? priorityColors[p] + '20' : 'white',
                    color: priority === p ? priorityColors[p] : '#666',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: priority === p ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {priorityLabels[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">开始日期</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              截止日期 *
              {isOverdue && (
                <span style={{ color: '#ff6b6b', marginLeft: 8, fontSize: 12 }}>
                  ⚠️ 已选择过期日期
                </span>
              )}
            </label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                borderColor: isOverdue ? '#ff6b6b' : undefined,
              }}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-submit"
              disabled={!title.trim() || !assigneeId || !dueDate}
              style={{
                opacity: !title.trim() || !assigneeId || !dueDate ? 0.5 : 1,
                cursor: !title.trim() || !assigneeId || !dueDate ? 'not-allowed' : 'pointer',
              }}
            >
              创建任务
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
