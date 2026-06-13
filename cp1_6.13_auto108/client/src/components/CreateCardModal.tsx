import { useState } from 'react';
import Modal from './Modal';
import { createTask } from '../api';
import type { Task, Priority, Tag } from '../types';
import { PRESET_TAGS, TAG_COLORS } from '../types';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3'];

export default function CreateCardModal({
  isOpen,
  onClose,
  onTaskCreated,
}: CreateCardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [priority, setPriority] = useState<Priority>('P2');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setTags([]);
    setPriority('P2');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleTag = (tag: Tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('请输入卡片标题');
      return;
    }
    if (trimmedTitle.length > 50) {
      setError('标题长度不能超过50字符');
      return;
    }
    setSubmitting(true);
    try {
      const task = await createTask({
        title: trimmedTitle,
        description: description.trim(),
        tags,
        priority,
      });
      onTaskCreated(task);
      reset();
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="创建新卡片">
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">
            标题<span className="required">*</span>
          </label>
          <input
            className="form-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入卡片标题（最多50字符）"
            maxLength={50}
            autoFocus
          />
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', textAlign: 'right' }}>
            {title.length}/50
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">描述</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="支持简单格式：**粗体**、- 无序列表、1. 有序列表"
          />
        </div>

        <div className="form-group">
          <label className="form-label">标签（多选）</label>
          <div className="tags-selector">
            {PRESET_TAGS.map((tag) => (
              <div
                key={tag}
                className={`tag-checkbox ${tags.includes(tag) ? 'selected' : ''}`}
                style={{ '--tag-color': TAG_COLORS[tag] } as React.CSSProperties}
                onClick={() => toggleTag(tag)}
              >
                {tags.includes(tag) ? '✓ ' : ''}
                {tag}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">优先级</label>
          <select
            className="form-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="form-error">{error}</div>}
      </div>
      <div className="modal-footer">
        <button className="secondary" onClick={handleClose}>
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? '创建中...' : '创建'}
        </button>
      </div>
    </Modal>
  );
}
