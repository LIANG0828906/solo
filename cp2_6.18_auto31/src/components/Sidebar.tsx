import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useMoodStore } from '../store';
import { MoodEntry, MOOD_THEME } from '../types';

interface SidebarProps {
  entries: MoodEntry[];
  selectedId: string | null;
  open: boolean;
  currentColor: string;
}

const ITEM_HEIGHT = 92;
const BUFFER_ITEMS = 3;

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

function truncateText(text: string, maxLines: number = 2): string {
  const charsPerLine = 18;
  const maxChars = charsPerLine * maxLines;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + '...';
}

export default function Sidebar({ entries, selectedId, open, currentColor }: SidebarProps) {
  const toggleSidebar = useMoodStore((s) => s.toggleSidebar);
  const selectEntry = useMoodStore((s) => s.selectEntry);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [open]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const virtualItems = useMemo(() => {
    const totalHeight = entries.length * ITEM_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS);
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_ITEMS * 2;
    const endIndex = Math.min(entries.length, startIndex + visibleCount);

    const items: { entry: MoodEntry; index: number; offsetY: number }[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push({
        entry: entries[i],
        index: i,
        offsetY: i * ITEM_HEIGHT,
      });
    }

    return { items, totalHeight, topPadding: startIndex * ITEM_HEIGHT };
  }, [entries, scrollTop, containerHeight]);

  const scrollbarStyle = useMemo(
    () => ({
      scrollbarColor: `${currentColor} transparent`,
    }),
    [currentColor]
  );

  return (
    <div
      style={{
        width: open ? '280px' : '12px',
        height: '100%',
        background: open ? '#FAFAFA' : currentColor,
        borderLeft: open ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
        transition: 'width 0.3s ease, background 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <style>{`
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background-color: ${currentColor};
          border-radius: 3px;
        }
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${currentColor} transparent;
        }
      `}</style>

      <button
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          top: '16px',
          left: open ? 'auto' : '-6px',
          right: open ? '16px' : 'auto',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: open ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.9)',
          color: open ? '#666' : currentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          zIndex: 10,
          transition: 'all 0.2s ease',
          boxShadow: open ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          if (open) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          if (open) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
          }
        }}
        title={open ? '收起侧边栏' : '展开侧边栏'}
      >
        {open ? '›' : '‹'}
      </button>

      {open && (
        <>
          <div
            style={{
              padding: '20px 20px 16px 20px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#333',
                marginBottom: '4px',
              }}
            >
              MoodFeed
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#999',
              }}
            >
              共 {entries.length} 条心情记录
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="sidebar-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              ...scrollbarStyle,
            }}
          >
            {entries.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📝</div>
                <div>还没有心情记录</div>
                <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.8 }}>
                  点击左侧画布开始记录吧
                </div>
              </div>
            ) : (
              <div style={{ height: virtualItems.totalHeight, position: 'relative' }}>
                {virtualItems.items.map(({ entry, index, offsetY }) => {
                  const theme = MOOD_THEME[entry.mood];
                  const isSelected = selectedId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      onClick={() => selectEntry(entry.id)}
                      style={{
                        position: 'absolute',
                        top: offsetY,
                        left: 0,
                        right: 0,
                        height: ITEM_HEIGHT,
                        padding: '12px 16px 12px 20px',
                        cursor: 'pointer',
                        background: isSelected ? `${entry.color}10` : 'transparent',
                        borderLeft: isSelected ? `4px solid ${entry.color}` : '4px solid transparent',
                        transition: 'background 0.2s ease',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          height: '100%',
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: `${theme.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            flexShrink: 0,
                          }}
                        >
                          {theme.icon}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            height: '100%',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#999',
                              marginBottom: '4px',
                              flexShrink: 0,
                            }}
                          >
                            {formatTimestamp(entry.timestamp)}
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              color: '#333',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                            }}
                          >
                            {truncateText(entry.text)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
