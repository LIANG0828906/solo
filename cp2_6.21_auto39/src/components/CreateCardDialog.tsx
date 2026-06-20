import { useState } from 'react';
import type { CardType, CardCreate } from '../types';

interface CreateCardDialogProps {
  onClose: () => void;
  onCreate: (card: Omit<CardCreate, 'x' | 'y' | 'z_index'>) => void;
}

const PRESET_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#a29bfe',
  '#fd79a8',
];

const TYPE_ICONS: Record<CardType, string> = {
  text: '📝',
  image: '🖼️',
  todo: '✅',
};

const TYPE_NAMES: Record<CardType, string> = {
  text: '文本',
  image: '图片',
  todo: '待办清单',
};

function CreateCardDialog({ onClose, onCreate }: CreateCardDialogProps) {
  const [type, setType] = useState<CardType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<string | null>(PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      type,
      title: title.trim(),
      content: content.trim(),
      color,
    });

    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">创建新卡片</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">选择类型</label>
            <div className="type-selector">
              {(['text', 'image', 'todo'] as CardType[]).map((t) => (
                <div
                  key={t}
                  className={`type-option ${type === t ? 'selected' : ''}`}
                  onClick={() => setType(t)}
                >
                  <div className="type-icon">{TYPE_ICONS[t]}</div>
                  <div className="type-name">{TYPE_NAMES[t]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入卡片标题..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {type === 'text' ? '内容' : type === 'image' ? '图片URL' : '待办事项（每行一个）'}
            </label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === 'text'
                  ? '输入卡片内容...'
                  : type === 'image'
                  ? '输入图片URL...'
                  : '每行输入一个待办事项...'
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">选择颜色</label>
            <div className="color-picker">
              {PRESET_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-option ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <div
                className={`color-option ${color === null ? 'selected' : ''}`}
                style={{ backgroundColor: '#ffffff', border: '2px dashed #ccc' }}
                onClick={() => setColor(null)}
                title="无颜色"
              />
            </div>
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCardDialog;
