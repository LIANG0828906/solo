import { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NodeShape, NODE_SHAPES } from '../modules/timeline/TimelineEngine';
import { useTimelineStore } from '../store/useTimelineStore';

function ShapeIcon({ shape, color }: { shape: NodeShape; color: string }) {
  const size = 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {shape === 'circle' && (
        <circle cx="12" cy="12" r="9" fill={color} />
      )}
      {shape === 'diamond' && (
        <polygon points="12,2 22,12 12,22 2,12" fill={color} />
      )}
      {shape === 'star' && (
        <polygon
          points="12,2 15,9 22,9.5 16.5,14.5 18.5,22 12,17.5 5.5,22 7.5,14.5 2,9.5 9,9"
          fill={color}
        />
      )}
    </svg>
  );
}

export default function NodeDetail() {
  const selectedNodeId = useTimelineStore(s => s.selectedNodeId);
  const getNodeById = useTimelineStore(s => s.getNodeById);
  const updateNode = useTimelineStore(s => s.updateNode);
  const removeNode = useTimelineStore(s => s.removeNode);
  const setSelectedNode = useTimelineStore(s => s.setSelectedNode);
  const formatDate = useTimelineStore(s => s.formatDate);

  const result = useMemo(
    () => (selectedNodeId ? getNodeById(selectedNodeId) : undefined),
    [selectedNodeId, getNodeById]
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [shape, setShape] = useState<NodeShape>('circle');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (result) {
      setTitle(result.node.title);
      setDescription(result.node.description);
      setDateStr(formatDate(result.node.date));
      setShape(result.node.shape);
      setTags([...result.node.tags]);
      setTagInput('');
    }
  }, [result, formatDate]);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => {
      const newDate = new Date(dateStr).getTime();
      if (!isNaN(newDate) && newDate !== result.node.date) {
        updateNode(result.node.id, { date: newDate });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [dateStr, result, updateNode]);

  const handleTitleBlur = useCallback(() => {
    if (result && title !== result.node.title) {
      updateNode(result.node.id, { title: title || '未命名事件' });
    }
  }, [result, title, updateNode]);

  const handleDescBlur = useCallback(() => {
    if (result && description !== result.node.description) {
      updateNode(result.node.id, { description });
    }
  }, [result, description, updateNode]);

  const handleShapeChange = useCallback((s: NodeShape) => {
    setShape(s);
    if (result) {
      updateNode(result.node.id, { shape: s });
    }
  }, [result, updateNode]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    const newTags = [...tags, trimmed];
    setTags(newTags);
    setTagInput('');
    if (result) {
      updateNode(result.node.id, { tags: newTags });
    }
  }, [tagInput, tags, result, updateNode]);

  const handleRemoveTag = useCallback((idx: number) => {
    const newTags = tags.filter((_, i) => i !== idx);
    setTags(newTags);
    if (result) {
      updateNode(result.node.id, { tags: newTags });
    }
  }, [tags, result, updateNode]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      handleRemoveTag(tags.length - 1);
    }
  }, [tagInput, tags, handleAddTag, handleRemoveTag]);

  const handleDelete = useCallback(() => {
    if (result && window.confirm(`确定删除事件 "${result.node.title}" 吗？`)) {
      removeNode(result.node.id);
      setSelectedNode(null);
    }
  }, [result, removeNode, setSelectedNode]);

  const handleClose = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNode(null);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [setSelectedNode]);

  if (!result) return null;

  const { node, timeline } = result;
  const portalRoot = document.body;

  return createPortal(
    <div className="node-detail-overlay" role="dialog" aria-modal="true">
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <span className="timeline-color-dot" style={{ background: timeline.color }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {timeline.title}
          </span>
        </div>
        <button
          className="detail-close"
          onClick={handleClose}
          aria-label="关闭"
          title="关闭 (Esc)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-field">
          <label className="detail-label" htmlFor="node-title">事件标题</label>
          <input
            id="node-title"
            className="detail-title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="输入事件标题..."
            autoFocus
          />
        </div>

        <div className="detail-field">
          <label className="detail-label">日期</label>
          <input
            type="date"
            className="detail-input"
            value={dateStr}
            onChange={e => setDateStr(e.target.value)}
          />
        </div>

        <div className="detail-field">
          <label className="detail-label">节点形状</label>
          <div className="detail-shape-selector">
            {NODE_SHAPES.map(s => (
              <button
                key={s}
                className={`shape-option ${shape === s ? 'active' : ''}`}
                onClick={() => handleShapeChange(s)}
                title={s === 'circle' ? '圆形' : s === 'diamond' ? '菱形' : '星形'}
              >
                <ShapeIcon shape={s} color={timeline.color} />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-field">
          <label className="detail-label">描述</label>
          <textarea
            className="detail-input detail-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="描述此事件的详细信息，支持多行文本..."
          />
        </div>

        <div className="detail-field">
          <label className="detail-label">标签</label>
          <div className="detail-tags-input">
            {tags.map((t, i) => (
              <span key={`${t}-${i}`} className="detail-tag-chip">
                {t}
                <button
                  className="detail-tag-remove"
                  onClick={() => handleRemoveTag(i)}
                  aria-label={`删除标签 ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              className="detail-tag-input"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={handleAddTag}
              placeholder={tags.length === 0 ? '添加标签，按回车确认...' : ''}
            />
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>
            ID: <code style={{ fontSize: 10 }}>{node.id.slice(0, 8)}...</code>
          </div>
          <button
            onClick={handleDelete}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255,107,107,0.4)',
              background: 'rgba(255,107,107,0.1)',
              color: '#FF6B6B',
              fontSize: 13,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,107,107,0.2)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,107,107,0.1)';
            }}
          >
            删除事件
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
}
