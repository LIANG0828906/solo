import { useMemo } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';

interface PreviewPosition {
  top: number;
  left: number;
}

function computePosition(x: number, y: number): PreviewPosition {
  const offset = 16;
  const cardWidth = 280;
  const cardHeight = 140;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  let left = x + offset;
  if (left + cardWidth > vw - 10) {
    left = x - cardWidth - offset;
  }

  let top = y + offset;
  if (top + cardHeight > vh - 10) {
    top = y - cardHeight - offset;
  }

  return { top: Math.max(10, top), left: Math.max(10, left) };
}

export default function NodePreview() {
  const hoverInfo = useTimelineStore(s => s.hoverInfo);
  const getNodeById = useTimelineStore(s => s.getNodeById);
  const formatDate = useTimelineStore(s => s.formatDate);

  const result = useMemo(
    () => (hoverInfo.nodeId ? getNodeById(hoverInfo.nodeId) : undefined),
    [hoverInfo.nodeId, getNodeById]
  );

  if (!result || !hoverInfo.nodeId) return null;

  const { node } = result;
  const pos = computePosition(hoverInfo.screenX, hoverInfo.screenY);

  return (
    <div
      className="node-preview-card"
      style={{
        top: pos.top,
        left: pos.left,
      }}
    >
      <div className="preview-title">{node.title}</div>
      <div className="preview-date">{formatDate(node.date)}</div>
      {node.description && (
        <div className="preview-desc">{node.description}</div>
      )}
      {node.tags.length > 0 && (
        <div className="preview-tags">
          {node.tags.slice(0, 4).map((t, i) => (
            <span key={`${t}-${i}`} className="preview-tag">{t}</span>
          ))}
          {node.tags.length > 4 && (
            <span className="preview-tag">+{node.tags.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}
