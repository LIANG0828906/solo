import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSnapshotStore, Snapshot } from '../stores/snapshotStore';

const tagLabels: Record<string, string> = {
  positive: '积极',
  negative: '消极',
  neutral: '中性',
};

const tagColors: Record<string, string> = {
  positive: '#4ADE80',
  negative: '#F87171',
  neutral: '#60A5FA',
};

interface SearchPanelProps {
  onSnapshotClick?: (snapshot: Snapshot) => void;
  isVisible: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onSnapshotClick, isVisible }) => {
  const { searchKeyword, selectedTag, setSearchKeyword, setSelectedTag, filterSnapshots } =
    useSnapshotStore();

  const [inputValue, setInputValue] = useState(searchKeyword);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredSnapshots = useMemo(() => {
    return filterSnapshots();
  }, [searchKeyword, selectedTag, filterSnapshots]);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSearchKeyword(value);
  };

  const handleTagClick = (tag: 'positive' | 'negative' | 'neutral' | null) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  const handleSnapshotClick = (snapshot: Snapshot) => {
    if (onSnapshotClick) {
      onSnapshotClick(snapshot);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '500px',
        background: 'rgba(20, 20, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '24px',
        boxSizing: 'border-box',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(108, 99, 255, 0.15)',
        border: '1px solid rgba(108, 99, 255, 0.2)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(42, 42, 64, 0.3);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(108, 99, 255, 0.5);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(108, 99, 255, 0.8);
        }
      `}</style>

      <h2
        style={{
          margin: 0,
          color: '#fff',
          fontSize: '20px',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}
      >
        搜索记忆回廊
      </h2>

      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleSearchChange}
        placeholder="输入关键词搜索..."
        style={{
          width: '100%',
          height: '48px',
          background: '#2D2D44',
          border: '1px solid #6C63FF',
          borderRadius: '8px',
          padding: '0 16px',
          color: '#fff',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = '0 0 12px rgba(108, 99, 255, 0.6)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'none';
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between',
        }}
      >
        {(['positive', 'neutral', 'negative'] as const).map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            style={{
              width: '120px',
              height: '40px',
              background: selectedTag === tag ? '#6C63FF' : '#3A3A50',
              border: 'none',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: 500,
              letterSpacing: '0.3px',
            }}
            onMouseEnter={(e) => {
              if (selectedTag !== tag) {
                e.currentTarget.style.background = '#4A4A6A';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTag !== tag) {
                e.currentTarget.style.background = '#3A3A50';
              }
            }}
          >
            {tagLabels[tag]}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
        }}
      >
        <span>找到 {filteredSnapshots.length} 条记忆</span>
        {selectedTag && (
          <span style={{ color: tagColors[selectedTag] }}>
            筛选: {tagLabels[selectedTag]}
          </span>
        )}
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginRight: '-8px',
          paddingRight: '8px',
        }}
      >
        {filteredSnapshots.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '14px',
            }}
          >
            没有找到匹配的记忆
          </div>
        ) : (
          filteredSnapshots.map((snapshot, index) => (
            <div
              key={snapshot.id}
              onClick={() => handleSnapshotClick(snapshot)}
              style={{
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px',
                background: 'rgba(58, 58, 80, 0.5)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                animation: `slideIn 0.3s ease ${index * 0.05}s both`,
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(108, 99, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.3)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(58, 58, 80, 0.5)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <img
                src={snapshot.thumbnailUrl}
                alt={snapshot.title}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  flexShrink: 0,
                  background: '#2A2A40',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect fill="%232A2A40" width="60" height="60"/><text x="30" y="35" text-anchor="middle" fill="%236C63FF" font-size="24">📷</text></svg>';
                }}
              />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {snapshot.title}
                </div>
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '11px',
                  }}
                >
                  {formatDate(snapshot.timestamp)}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#fff',
                      background: tagColors[snapshot.sentimentLabel] + '20',
                      border: `1px solid ${tagColors[snapshot.sentimentLabel]}40`,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: tagColors[snapshot.sentimentLabel],
                        marginRight: '4px',
                      }}
                    />
                    {tagLabels[snapshot.sentimentLabel]}
                  </span>
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '10px',
                    }}
                  >
                    {(snapshot.sentimentStrength * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
