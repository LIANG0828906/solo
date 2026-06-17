import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useBoardStore } from '@/stores/boardStore';
import { BoardNode, NodeTypeColors, NodeTypeLabels } from '@/types';
import { truncateText } from '@/utils';
import { X, Tag, Link2, Save, Plus, XCircle } from 'lucide-react';

interface Props {
  nodeId: string;
  onClose: () => void;
}

const NodeDetailModal: React.FC<Props> = ({ nodeId, onClose }) => {
  const node = useBoardStore((state) => state.nodes.find((n) => n.id === nodeId));
  const updateNode = useBoardStore((state) => state.updateNode);
  const nodes = useBoardStore((state) => state.nodes);
  const connections = useBoardStore((state) => state.connections);
  const selectNode = useBoardStore((state) => state.selectNode);

  const [title, setTitle] = useState<string>(node?.title || '');
  const [content, setContent] = useState<string>(node?.content || '');
  const [tagInput, setTagInput] = useState<string>('');
  const [localTags, setLocalTags] = useState<string[]>(node?.tags || []);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!node) return null;

  const relatedNodeIds = new Set<string>();
  connections.forEach((conn) => {
    if (conn.fromNodeId === nodeId) {
      relatedNodeIds.add(conn.toNodeId);
    } else if (conn.toNodeId === nodeId) {
      relatedNodeIds.add(conn.fromNodeId);
    }
  });
  const relatedNodes = nodes.filter((n) => relatedNodeIds.has(n.id));

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !localTags.includes(trimmed)) {
      setLocalTags([...localTags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setLocalTags(localTags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    updateNode(nodeId, {
      title: title.trim(),
      content,
      tags: localTags,
      updatedAt: new Date().toISOString(),
    });

    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeElement) {
      nodeElement.classList.add('flash');
      setTimeout(() => {
        nodeElement.classList.remove('flash');
      }, 300);
    }

    onClose();
  };

  const handleRelatedNodeClick = (relatedNode: BoardNode) => {
    selectNode(relatedNode.id);
    const element = document.querySelector(`[data-node-id="${relatedNode.id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              className="card-type-tag"
              style={{ backgroundColor: NodeTypeColors[node.type], marginBottom: 0 }}
            >
              {NodeTypeLabels[node.type]}
            </span>
            <h2 className="modal-title">编辑节点</h2>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              type="text"
              className="form-input title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">详细内容</label>
            <textarea
              className="form-textarea"
              placeholder="输入详细内容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} />
              标签
            </label>
            <div className="tag-input-wrapper">
              <input
                type="text"
                className="tag-input"
                placeholder="输入标签..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <button className="btn btn-primary" onClick={handleAddTag} style={{ padding: '6px 12px' }}>
                <Plus size={16} />
                添加
              </button>
            </div>
            <div className="tag-list">
              {localTags.map((tag) => (
                <span key={tag} className="tag-item">
                  {tag}
                  <XCircle
                    size={14}
                    className="tag-remove"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </span>
              ))}
            </div>
          </div>
          {relatedNodes.length > 0 && (
            <div className="related-nodes">
              <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link2 size={14} />
                关联节点
              </div>
              {relatedNodes.map((relatedNode) => (
                <div
                  key={relatedNode.id}
                  className="related-node-item"
                  onClick={() => handleRelatedNodeClick(relatedNode)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="related-node-title">
                    {truncateText(relatedNode.title, 30)}
                  </span>
                  <span
                    className="related-node-type"
                    style={{ backgroundColor: NodeTypeColors[relatedNode.type] }}
                  >
                    {NodeTypeLabels[relatedNode.type]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!title.trim()}
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailModal;
