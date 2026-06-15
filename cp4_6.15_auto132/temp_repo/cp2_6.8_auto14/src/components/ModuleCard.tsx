import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getModuleDef } from '../data/moduleDefs';
import type { ModuleStyle } from '../data/moduleDefs';
import type { Theme } from '../styles/themes';

export interface CanvasModule {
  id: string;
  type: string;
  style: ModuleStyle;
}

interface ModuleCardProps {
  module: CanvasModule;
  onDelete: (id: string) => void;
  onEdit: (id: string, style: ModuleStyle) => void;
  theme: Theme;
}

interface EditModalProps {
  module: CanvasModule;
  theme: Theme;
  onClose: () => void;
  onSave: (style: ModuleStyle) => void;
}

const EditModal: React.FC<EditModalProps> = ({ module, theme, onClose, onSave }) => {
  const [style, setStyle] = useState<ModuleStyle>(module.style);

  const handleChange = (key: keyof ModuleStyle, value: string | number) => {
    setStyle((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">编辑模块样式</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">背景颜色</label>
          <div className="color-input-wrapper">
            <input
              type="color"
              className="color-input"
              value={style.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
            />
            <div className="color-preview" style={{ backgroundColor: style.backgroundColor }}>
              {style.backgroundColor}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            字体大小: {style.fontSize}px
          </label>
          <input
            type="range"
            className="form-control"
            min="10"
            max="24"
            value={style.fontSize}
            onChange={(e) => handleChange('fontSize', Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            圆角半径: {style.borderRadius}px
          </label>
          <input
            type="range"
            className="form-control"
            min="0"
            max="32"
            value={style.borderRadius}
            onChange={(e) => handleChange('borderRadius', Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            内边距: {style.padding}px
          </label>
          <input
            type="range"
            className="form-control"
            min="4"
            max="48"
            value={style.padding}
            onChange={(e) => handleChange('padding', Number(e.target.value))}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={() => onSave(style)}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

const renderModuleContent = (type: string) => {
  switch (type) {
    case 'article-list':
      return (
        <div className="article-list-demo">
          <div className="article-item">
            <div className="article-title">如何构建高效的前端开发工作流</div>
            <div className="article-meta">2024-01-15 · 前端工程</div>
          </div>
          <div className="article-item">
            <div className="article-title">深入理解React Hooks的设计原理</div>
            <div className="article-meta">2024-01-10 · React</div>
          </div>
          <div className="article-item">
            <div className="article-title">CSS Grid布局完全指南</div>
            <div className="article-meta">2024-01-05 · CSS</div>
          </div>
        </div>
      );
    case 'profile':
      return (
        <div className="profile-demo">
          <div className="profile-avatar">👨‍💻</div>
          <div className="profile-name">张三</div>
          <div className="profile-bio">
            一名热爱技术的前端工程师，专注于Web开发和用户体验设计。
          </div>
        </div>
      );
    case 'tag-cloud':
      return (
        <div className="tag-cloud-demo">
          {['React', 'Vue', 'TypeScript', 'JavaScript', 'CSS', 'Node.js', 'Webpack', 'Vite', '算法', '设计模式'].map(
            (tag, i) => (
              <span key={i} className="tag-item">
                {tag}
              </span>
            )
          )}
        </div>
      );
    case 'archive-calendar':
      return (
        <div className="archive-demo">
          <div className="archive-item">
            <span>2024年1月</span>
            <span className="archive-count">(12)</span>
          </div>
          <div className="archive-item">
            <span>2023年12月</span>
            <span className="archive-count">(8)</span>
          </div>
          <div className="archive-item">
            <span>2023年11月</span>
            <span className="archive-count">(15)</span>
          </div>
          <div className="archive-item">
            <span>2023年10月</span>
            <span className="archive-count">(6)</span>
          </div>
        </div>
      );
    case 'social-links':
      return (
        <div className="social-links-demo">
          <div className="social-icon">🐙</div>
          <div className="social-icon">🐦</div>
          <div className="social-icon">📧</div>
          <div className="social-icon">💼</div>
          <div className="social-icon">📺</div>
        </div>
      );
    case 'recent-comments':
      return (
        <div className="comments-demo">
          <div className="comment-item">
            <div className="comment-avatar">李</div>
            <div className="comment-content">
              <div className="comment-author">李四</div>
              <div className="comment-text">这篇文章写得很棒，学到了很多！</div>
            </div>
          </div>
          <div className="comment-item">
            <div className="comment-avatar" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              王
            </div>
            <div className="comment-content">
              <div className="comment-author">王五</div>
              <div className="comment-text">请问有相关的源码示例吗？</div>
            </div>
          </div>
          <div className="comment-item">
            <div className="comment-avatar" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>
              赵
            </div>
            <div className="comment-content">
              <div className="comment-author">赵六</div>
              <div className="comment-text">期待更多类似的干货分享~</div>
            </div>
          </div>
        </div>
      );
    default:
      return <div>模块内容</div>;
  }
};

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onDelete, onEdit, theme }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const def = getModuleDef(module.type);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
    data: {
      type: 'canvas-item',
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: module.style.backgroundColor || theme.moduleBg,
    color: theme.moduleText,
    borderColor: theme.moduleBorder,
    borderRadius: `${module.style.borderRadius}px`,
    fontSize: `${module.style.fontSize}px`,
  };

  const handleSaveStyle = (newStyle: ModuleStyle) => {
    onEdit(module.id, newStyle);
    setShowEditModal(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`module-card ${isDragging ? 'dragging' : ''}`}
      >
        <div className="module-card-actions">
          <button
            className="action-btn edit"
            onClick={() => setShowEditModal(true)}
            title="编辑"
          >
            ✏️
          </button>
          <button
            className="action-btn delete"
            onClick={() => onDelete(module.id)}
            title="删除"
          >
            ×
          </button>
        </div>
        <div className="module-card-header" {...attributes} {...listeners}>
          <span>{def?.icon}</span>
          <span>{def?.name || module.type}</span>
        </div>
        <div
          className="module-card-body"
          style={{ padding: `${module.style.padding}px` }}
        >
          {renderModuleContent(module.type)}
        </div>
      </div>
      {showEditModal && (
        <EditModal
          module={module}
          theme={theme}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveStyle}
        />
      )}
    </>
  );
};

export default ModuleCard;
