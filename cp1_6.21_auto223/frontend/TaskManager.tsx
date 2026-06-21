import React, { useState, useEffect } from 'react';
import { useApp } from './context';
import { Task, TaskTag, TagColor, TAG_COLOR_MAP } from './types';

const PRESET_TAGS: { name: string; color: TagColor }[] = [
  { name: '前端', color: 'blue' },
  { name: '后端', color: 'orange' },
  { name: '设计', color: 'purple' },
  { name: '测试', color: 'red' },
  { name: '调研', color: 'green' },
  { name: '优化', color: 'blue' },
  { name: 'Bug', color: 'red' },
  { name: '文档', color: 'green' },
  { name: '紧急', color: 'red' },
  { name: 'UI', color: 'purple' },
];

const uid = () => Math.random().toString(36).slice(2, 11);

interface Props {
  task: Task;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

const TaskManager: React.FC<Props> = ({ task, onClose, onDelete }) => {
  const { updateTask, users } = useApp();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [tags, setTags] = useState<TaskTag[]>(task.tags);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || '');
  const [estimatedHours, setEstimatedHours] = useState<number>(task.estimatedHours);
  const [blockedReason, setBlockedReason] = useState(task.blockedReason || '');
  const [isBlocked, setIsBlocked] = useState(!!task.blockedReason);

  const handleTogglePresetTag = (preset: { name: string; color: TagColor }) => {
    const exists = tags.find((t) => t.name === preset.name);
    if (exists) {
      setTags(tags.filter((t) => t.name !== preset.name));
    } else {
      setTags([...tags, { id: uid(), name: preset.name, color: preset.color }]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTask(task.id, {
      title,
      description,
      tags,
      assigneeId: assigneeId || undefined,
      estimatedHours: Math.min(999, Math.max(0, estimatedHours || 0)),
      blockedReason: isBlocked ? blockedReason.slice(0, 100) : undefined,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">编辑任务</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>任务标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="任务标题"
            />
          </div>

          <div className="form-group">
            <label>任务描述</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="任务详细描述（可选）"
            />
          </div>

          <div className="form-group">
            <label>标签</label>
            <div className="tag-picker-row">
              {PRESET_TAGS.map((preset) => {
                const selected = tags.some((t) => t.name === preset.name);
                return (
                  <span
                    key={preset.name}
                    className={`tag-option ${selected ? 'selected' : ''}`}
                    style={{ background: TAG_COLOR_MAP[preset.color] }}
                    onClick={() => handleTogglePresetTag(preset)}
                  >
                    {selected ? '✓ ' : ''}
                    {preset.name}
                  </span>
                );
              })}
            </div>
            {tags.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tags.map((t) => (
                  <span
                    key={t.id}
                    className="task-tag"
                    style={{ background: TAG_COLOR_MAP[t.color] }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>负责人</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">未指派</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>预计工时（小时，最大999）</label>
            <input
              type="number"
              min={0}
              max={999}
              value={estimatedHours}
              onChange={(e) =>
                setEstimatedHours(
                  Math.min(999, Math.max(0, parseInt(e.target.value) || 0))
                )
              }
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
              />
              标记为阻塞
            </label>
            {isBlocked && (
              <textarea
                rows={2}
                maxLength={100}
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="请描述阻塞原因（最多100字）"
                style={{ marginTop: 8 }}
              />
            )}
          </div>

          <div className="form-actions" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={async () => {
                if (confirm('确定删除此任务？')) {
                  await onDelete(task.id);
                }
              }}
              style={{ background: '#EF4444' }}
            >
              删除任务
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="accent">
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskManager;
