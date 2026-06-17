import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { ideaService } from '@/services/ideaService';
import { screenToWorld } from '@/shared/utils';

export const NodePanel: React.FC = () => {
  const {
    showNodePanel,
    panelNodeId,
    panelPosition,
    nodes,
    zoom,
    pan,
    setShowNodePanel,
    setPanelNodeId,
  } = useBoardStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  const isEditing = panelNodeId !== null;
  const editingNode = isEditing
    ? nodes.find((n) => n.id === panelNodeId)
    : null;

  useEffect(() => {
    if (showNodePanel) {
      if (editingNode) {
        setTitle(editingNode.title);
        setContent(editingNode.content);
      } else {
        setTitle('');
        setContent('');
      }
      setTimeout(() => {
        titleRef.current?.focus();
      }, 100);
    }
  }, [showNodePanel, editingNode]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      if (isEditing && panelNodeId) {
        await ideaService.updateNode({
          id: panelNodeId,
          title: title.trim(),
          content: content.trim(),
        });
      } else {
        const worldPos = screenToWorld(
          panelPosition.x,
          panelPosition.y,
          pan,
          zoom
        );
        await ideaService.createNode({
          title: title.trim(),
          content: content.trim(),
          x: worldPos.x - 120,
          y: worldPos.y - 50,
        });
      }

      setShowNodePanel(false);
      setPanelNodeId(null);
    },
    [
      title,
      content,
      isEditing,
      panelNodeId,
      panelPosition,
      pan,
      zoom,
      setShowNodePanel,
      setPanelNodeId,
    ]
  );

  const handleCancel = useCallback(() => {
    setShowNodePanel(false);
    setPanelNodeId(null);
  }, [setShowNodePanel, setPanelNodeId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleCancel]
  );

  if (!showNodePanel) return null;

  const panelX = Math.min(
    panelPosition.x,
    window.innerWidth - 340
  );
  const panelY = Math.min(
    panelPosition.y,
    window.innerHeight - 300
  );

  return (
    <div
      className="node-panel-overlay"
      onClick={handleCancel}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        className="node-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: panelX,
          top: panelY,
          width: 320,
          backgroundColor: '#1E1E3A',
          borderRadius: 16,
          border: '1px solid #3A3A5C',
          padding: 20,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease',
        }}
      >
        <h3 className="panel-title">
          {isEditing ? '编辑想法' : '创建新想法'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              ref={titleRef}
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 30))}
              placeholder="输入想法标题..."
              maxLength={30}
            />
            <span className="char-count">{title.length}/30</span>
          </div>
          <div className="form-group">
            <label className="form-label">内容描述</label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 200))}
              placeholder="详细描述你的想法..."
              maxLength={200}
              rows={3}
            />
            <span className="char-count">{content.length}/200</span>
          </div>
          <div className="panel-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title.trim()}
            >
              {isEditing ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
