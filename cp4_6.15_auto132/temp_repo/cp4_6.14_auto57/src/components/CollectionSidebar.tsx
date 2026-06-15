import { useMemo, useState, useRef, useEffect } from 'react';

interface CollectedItem {
  emoji: string;
  name: string;
  addedAt: number;
}

interface CollectionSidebarProps {
  collected: CollectedItem[];
  maxLimit: number;
  onRemove: (emoji: string) => void;
  onExport: () => void;
  isOpen: boolean;
  onClose: () => void;
}

function CollectionSidebar({
  collected,
  maxLimit,
  onRemove,
  onExport,
  isOpen,
  onClose
}: CollectionSidebarProps) {
  const [removingEmoji, setRemovingEmoji] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const sortedCollected = useMemo(
    () => [...collected].sort((a, b) => b.addedAt - a.addedAt),
    [collected]
  );

  useEffect(() => {
    itemRefs.current.clear();
  }, [sortedCollected]);

  const handleRemove = (emoji: string) => {
    const el = itemRefs.current.get(emoji);
    if (el && contentRef.current) {
      const container = contentRef.current;
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (
        elRect.top < containerRect.top ||
        elRect.bottom > containerRect.bottom
      ) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
    setRemovingEmoji(emoji);
    setTimeout(() => {
      onRemove(emoji);
      setRemovingEmoji(null);
    }, 300);
  };

  const setItemRef = (emoji: string, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(emoji, el);
    } else {
      itemRefs.current.delete(emoji);
    }
  };

  const formatName = (name: string) => {
    return name
      .split(/[_\s-]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">我的收藏夹</h2>
        <p className="sidebar-count">
          已收藏 {sortedCollected.length} 个
          {maxLimit > 0 && <span> / {maxLimit}</span>}
        </p>
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="关闭收藏夹"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="sidebar-content" ref={contentRef}>
        {sortedCollected.length === 0 ? (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">💝</div>
            <div className="sidebar-empty-text">
              还没有收藏任何表情
              <br />
              点击左侧表情即可添加到收藏
            </div>
          </div>
        ) : (
          <div className="collection-list">
            {sortedCollected.map((item) => (
              <div
                key={item.emoji}
                ref={(el) => setItemRef(item.emoji, el)}
                className={`collection-item ${
                  removingEmoji === item.emoji ? 'removing' : ''
                }`}
              >
                <div className="collection-emoji-info">
                  <span className="collection-emoji">{item.emoji}</span>
                  <span className="collection-name" title={formatName(item.name)}>
                    {formatName(item.name)}
                  </span>
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemove(item.emoji)}
                  aria-label={`移除 ${item.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="export-btn"
          onClick={onExport}
          disabled={sortedCollected.length === 0}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导出收藏
        </button>
      </div>
    </aside>
  );
}

export default CollectionSidebar;
