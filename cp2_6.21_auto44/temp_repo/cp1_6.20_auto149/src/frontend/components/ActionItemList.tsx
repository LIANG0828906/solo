import React, { useState } from 'react';
import type { ActionItem } from '../App';
import { TEAM_MEMBERS } from '../App';

interface ActionItemListProps {
  actions: ActionItem[];
  onUpdated: () => void;
}

export default function ActionItemList({ actions, onUpdated }: ActionItemListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const handleToggleComplete = async (action: ActionItem) => {
    try {
      const res = await fetch(`/api/actions/${action.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !action.completed }),
      });
      if (res.ok) {
        onUpdated();
      }
    } catch {}
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newDesc.trim(),
          assignee: newAssignee,
          priority: newPriority,
          dueDate: newDueDate,
          completed: false,
        }),
      });
      if (res.ok) {
        setNewDesc('');
        setNewAssignee('');
        setNewPriority('medium');
        setNewDueDate('');
        setShowAddForm(false);
        onUpdated();
      }
    } catch {}
  };

  const priorityLabel: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };

  const getMemberAvatar = (name: string) => {
    const member = TEAM_MEMBERS.find((m) => m.name === name);
    return member ? member.avatar : name.charAt(0);
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button
          className="add-action-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '取消' : '+ 手动添加行动项'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-action-form" onSubmit={handleAddAction}>
          <input
            type="text"
            placeholder="行动项描述..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <div className="add-action-row">
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
            >
              <option value="">选择负责人</option>
              {TEAM_MEMBERS.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={newPriority}
              onChange={(e) =>
                setNewPriority(e.target.value as 'high' | 'medium' | 'low')
              }
            >
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            <button type="submit" className="add-action-btn">
              添加
            </button>
          </div>
        </form>
      )}

      <div className="action-list">
        {actions.map((action) => (
          <div
            className={`action-item ${action.completed ? 'completed' : ''}`}
            key={action.id}
          >
            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={action.completed}
                onChange={() => handleToggleComplete(action)}
              />
              <span className="checkmark" />
            </label>
            <div className="action-info">
              <div className="action-description">{action.description}</div>
              <div className="action-meta">
                {action.assignee && (
                  <span className="action-assignee">
                    <span className="assignee-avatar">
                      {getMemberAvatar(action.assignee)}
                    </span>
                    {action.assignee}
                  </span>
                )}
                <span className={`priority-tag ${action.priority}`}>
                  {priorityLabel[action.priority]}
                </span>
                {action.dueDate && (
                  <span className="action-due">截止: {action.dueDate}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
