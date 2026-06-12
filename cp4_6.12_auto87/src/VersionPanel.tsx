import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Snapshot, useAppStore } from './store';
import { rollback } from './VersionManager';

interface VersionPanelProps {
  versions: Snapshot[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCompare: () => void;
}

const ITEM_HEIGHT = 56;
const VISIBLE_COUNT = 8;

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export const VersionPanel: React.FC<VersionPanelProps> = ({
  versions,
  selectedId,
  onSelect,
  onCompare,
}) => {
  const selectVersion = useAppStore((s) => s.selectVersion);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (viewportRef.current) {
      setScrollTop(viewportRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const useVirtual = versions.length > 20;

  if (versions.length === 0) {
    return (
      <div className="history-section">
        <div className="history-header">
          <span className="history-title">版本历史</span>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">暂无保存的版本快照</div>
        </div>
      </div>
    );
  }

  const startIndex = useVirtual
    ? Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2)
    : 0;
  const endIndex = useVirtual
    ? Math.min(versions.length, startIndex + VISIBLE_COUNT + 4)
    : versions.length;

  const visibleItems = useVirtual
    ? versions.slice(startIndex, endIndex)
    : versions;

  const handleClick = (v: Snapshot) => {
    if (selectedId === v.id) {
      onSelect(null);
      selectVersion(null);
    } else {
      onSelect(v.id);
      selectVersion(v.id);
      rollback(v.id);
    }
  };

  return (
    <div className="history-section">
      <div className="history-header">
        <span className="history-title">
          版本历史 <span style={{ color: '#999', fontWeight: 400 }}>({versions.length})</span>
        </span>
        <button
          className="btn btn-outline save-btn"
          onClick={onCompare}
          disabled={!selectedId || versions.length < 2}
        >
          对比
        </button>
      </div>
      <div
        ref={viewportRef}
        className="timeline-virtual-viewport"
        style={{
          height: useVirtual ? `${VISIBLE_COUNT * ITEM_HEIGHT}px` : undefined,
          maxHeight: useVirtual ? undefined : '100%',
        }}
      >
        <div
          style={{
            height: useVirtual ? `${versions.length * ITEM_HEIGHT}px` : undefined,
            position: 'relative',
          }}
        >
          <div className="timeline-track" />
          {visibleItems.map((v, localIdx) => {
            const globalIdx = startIndex + localIdx;
            const isSelected = selectedId === v.id;
            return (
              <div
                key={v.id}
                className={`timeline-item ${isSelected ? 'selected' : ''}`}
                style={{
                  position: useVirtual ? 'absolute' : 'relative',
                  top: useVirtual ? globalIdx * ITEM_HEIGHT : undefined,
                  left: 0,
                  right: 0,
                  animationDelay: `${globalIdx * 0.15}s`,
                }}
                onClick={() => handleClick(v)}
              >
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="timeline-time">
                    {formatTime(v.timestamp)}
                    {globalIdx === 0 && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          background: '#e8f0fa',
                          color: '#4a90d9',
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        最新
                      </span>
                    )}
                  </span>
                  <span className="timeline-preview">{v.seo || v.weibo.slice(0, 40)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VersionPanel;
