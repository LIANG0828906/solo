import React from 'react';

export interface TagFrequency {
  tag: string;
  count: number;
}

interface TagPanelProps {
  tags: TagFrequency[];
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 200,
  backgroundColor: '#FFFFFF',
  borderTop: '1px solid #E2E8F0',
  boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderBottom: '1px solid #E2E8F0',
  fontWeight: 600,
  fontSize: 14,
  color: '#1E293B',
  backgroundColor: '#F8FAFC',
  flexShrink: 0,
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '4px 0',
};

const scrollbarStyle: React.CSSProperties = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#CBD5E1 transparent',
};

const tagItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 16px',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
  fontSize: 13,
};

const tagNameStyle: React.CSSProperties = {
  color: '#334155',
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  marginRight: 8,
};

const tagCountStyle: React.CSSProperties = {
  backgroundColor: '#E2E8F0',
  color: '#475569',
  fontSize: 12,
  padding: '2px 8px',
  borderRadius: 10,
  fontWeight: 600,
  marginRight: 8,
  flexShrink: 0,
};

const filterBtnStyle: React.CSSProperties = {
  border: 'none',
  padding: '4px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  transition: 'all 0.15s',
  flexShrink: 0,
};

const TagPanel: React.FC<TagPanelProps> = ({ tags, selectedTag, onTagSelect }) => {
  return (
    <div style={panelStyle}>
      <div style={headerStyle}>标签统计 ({tags.length})</div>
      <div style={{ ...listStyle, ...scrollbarStyle }}>
        {tags.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            暂无标签数据
          </div>
        )}
        {tags.map((t) => {
          const isSelected = selectedTag === t.tag;
          return (
            <div
              key={t.tag}
              style={{
                ...tagItemStyle,
                backgroundColor: isSelected ? '#EEF2FF' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
            >
              <span style={tagNameStyle} title={t.tag}>
                #{t.tag}
              </span>
              <span style={tagCountStyle}>{t.count}</span>
              <button
                style={{
                  ...filterBtnStyle,
                  backgroundColor: isSelected ? '#6366F1' : '#E0E7FF',
                  color: isSelected ? '#FFFFFF' : '#4F46E5',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSelected
                    ? '#4F46E5'
                    : '#C7D2FE';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSelected
                    ? '#6366F1'
                    : '#E0E7FF';
                }}
                onClick={() => onTagSelect(isSelected ? null : t.tag)}
              >
                {isSelected ? '取消高亮' : '高亮'}
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
      `}</style>
    </div>
  );
};

export default TagPanel;
