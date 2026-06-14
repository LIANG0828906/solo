import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, Trash2, Tag } from 'lucide-react';
import { GraphNode, NODE_COLORS, dataManager } from '../data/DataManager';

interface NodeEditorProps {
  nodeId: string | null;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ nodeId, onClose, onDelete }) => {
  const [node, setNode] = useState<GraphNode | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(NODE_COLORS[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nodeId) {
      const nodeData = dataManager.getNode(nodeId);
      if (nodeData) {
        setNode(nodeData);
        setTitle(nodeData.title);
        setContent(nodeData.content);
        setColor(nodeData.color);
        setTags(nodeData.tags || []);
        setIsExpanded(true);
      }
    } else {
      setNode(null);
      setIsExpanded(false);
    }
  }, [nodeId]);

  const handleSave = useCallback(() => {
    if (!nodeId || !title.trim()) return;

    setIsSaving(true);
    dataManager.updateNode(nodeId, {
      title: title.trim(),
      content,
      color,
      tags,
    });

    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 200);
  }, [nodeId, title, content, color, tags, onClose]);

  const handleDelete = useCallback(() => {
    if (!nodeId) return;
    if (confirm('确定要删除此节点吗？相关的连线也会被删除。')) {
      onDelete(nodeId);
      onClose();
    }
  }, [nodeId, onDelete, onClose]);

  const handleAddTag = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const renderMarkdown = (text: string) => {
    if (!text) return <p style={{ color: 'var(--text-secondary)' }}>暂无内容</p>;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={index}>
              <code>{codeContent}</code>
            </pre>
          );
          codeContent = '';
        }
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      let processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>');

      if (!processedLine.startsWith('<h') && !processedLine.startsWith('<blockquote') && !processedLine.startsWith('<pre')) {
        if (processedLine.startsWith('- ') || processedLine.startsWith('* ')) {
          processedLine = `<li>${processedLine.slice(2)}</li>`;
        } else if (/^\d+\. /.test(processedLine)) {
          processedLine = `<li>${processedLine.replace(/^\d+\. /, '')}</li>`;
        } else if (processedLine.trim()) {
          processedLine = `<p>${processedLine}</p>`;
        }
      }

      if (processedLine.trim()) {
        elements.push(
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: processedLine }}
          />
        );
      }
    });

    return elements;
  };

  if (!nodeId || !node) return null;

  return (
    <div className="node-editor-overlay" onClick={handleOverlayClick}>
      <div className="node-editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="node-editor-header">
          <div className="node-editor-title">编辑节点</div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div
          className="node-editor-content"
          ref={contentRef}
          style={{
            maxHeight: isExpanded ? 'calc(80vh - 140px)' : '0',
            overflow: isExpanded ? 'auto' : 'hidden',
            transition: 'max-height 0.3s ease, padding 0.3s ease',
            padding: isExpanded ? '24px' : '0 24px',
          }}
        >
          <div className="editor-section">
            <label className="editor-label">标题</label>
            <input
              type="text"
              className="editor-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入节点标题..."
              autoFocus
            />
          </div>

          <div className="editor-section">
            <label className="editor-label">内容 (支持 Markdown)</label>
            <textarea
              className="editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在这里输入详细内容，支持 Markdown 格式..."
            />
            {content && (
              <div className="content-preview">
                <label className="editor-label">预览</label>
                {renderMarkdown(content)}
              </div>
            )}
          </div>

          <div className="editor-section">
            <label className="editor-label">颜色</label>
            <div className="color-picker-group">
              {NODE_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-option ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="editor-section">
            <label className="editor-label">
              <Tag size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              标签
            </label>
            <div className="tags-input-container">
              {tags.map((tag) => (
                <span key={tag} className="tag-item">
                  {tag}
                  <span className="tag-remove" onClick={() => handleRemoveTag(tag)}>
                    <X size={12} />
                  </span>
                </span>
              ))}
              <input
                type="text"
                className="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="输入标签后按回车..."
              />
            </div>
          </div>
        </div>

        <div
          className="node-editor-footer"
          style={{
            opacity: isExpanded ? 1 : 0,
            pointerEvents: isExpanded ? 'auto' : 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={16} />
            <span className="btn-text">删除</span>
          </button>
          <button className="btn" onClick={handleSave} disabled={!title.trim() || isSaving}>
            <Save size={16} />
            <span className="btn-text">保存</span>
          </button>
        </div>
      </div>
    </div>
  );
};
