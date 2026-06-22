import React, { useState, useEffect } from 'react';
import { TimelineNode } from '../types';
import { useTimelineStore } from '../store/timelineStore';

interface EditPanelProps {
  node: TimelineNode;
}

export const EditPanel: React.FC<EditPanelProps> = ({ node }) => {
  const { updateNode, deleteNode, selectNode } = useTimelineStore();

  const [title, setTitle] = useState(node.title);
  const [content, setContent] = useState(node.content);
  const [imageUrl, setImageUrl] = useState(node.imageUrl || '');
  const [date, setDate] = useState(node.date);

  useEffect(() => {
    setTitle(node.title);
    setContent(node.content);
    setImageUrl(node.imageUrl || '');
    setDate(node.date);
  }, [node.id]);

  const handleSave = () => {
    updateNode(node.id, {
      title,
      content,
      imageUrl,
      date,
    });
    selectNode(null);
  };

  const handleClose = () => {
    selectNode(null);
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个节点吗？')) {
      deleteNode(node.id);
    }
  };

  return (
    <div className="edit-panel-overlay" onClick={handleClose}>
      <div className="edit-panel" onClick={(e) => e.stopPropagation()}>
        <div className="edit-panel-header">
          <div className="edit-panel-title">
            {node.isBranch ? '编辑分支节点' : '编辑事件节点'}
          </div>
          <button className="edit-panel-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">标题</label>
          <input
            type="text"
            className="form-input"
            placeholder="输入事件标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">内容（支持 Markdown）</label>
          <textarea
            className="form-textarea"
            placeholder="输入故事内容，支持 # 标题、**加粗** 等 Markdown 语法"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
        </div>

        <div className="form-group">
          <label className="form-label">图片 URL</label>
          <input
            type="text"
            className="form-input"
            placeholder="输入图片链接（可选）"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">日期</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="edit-panel-actions">
          <button className="btn btn-secondary" onClick={handleDelete}>
            删除
          </button>
          <button className="btn btn-secondary" onClick={handleClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
