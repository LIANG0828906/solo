import React from 'react';

export interface Annotation {
  id: string;
  textBlockId: string;
  type: 'highlight' | 'underline' | 'strikethrough' | 'comment';
  comment?: string;
  commentNumber?: number;
  textPreview?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ToolPanelProps {
  activeTool: 'highlight' | 'underline' | 'strikethrough' | 'comment' | null;
  onToolSelect: (tool: 'highlight' | 'underline' | 'strikethrough' | 'comment') => void;
  annotations: Annotation[];
  onAnnotationClick: (annotation: Annotation) => void;
  onExport: () => void;
  isExporting: boolean;
}

const tools = [
  { type: 'highlight' as const, emoji: '🖍️', label: '高亮', color: '#ffeb3b' },
  { type: 'underline' as const, emoji: '〰️', label: '下划线', color: '#2196f3' },
  { type: 'strikethrough' as const, emoji: '✂️', label: '删除线', color: '#e53935' },
  { type: 'comment' as const, emoji: '💬', label: '批注', color: '#4caf50' },
];

const ToolPanel: React.FC<ToolPanelProps> = ({
  activeTool,
  onToolSelect,
  annotations,
  onAnnotationClick,
  onExport,
  isExporting,
}) => {
  const getTypeLabel = (type: string) => {
    const t = tools.find((tool) => tool.type === type);
    return t ? { emoji: t.emoji, label: t.label } : { emoji: '📌', label: type };
  };

  const truncateText = (text: string, maxLen: number = 20) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  };

  return (
    <div
      style={{
        width: 200,
        flexShrink: 0,
        background: '#ffffff',
        borderLeft: '1px solid #e0e0e0',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#2c3e50',
            margin: '0 0 16px 0',
          }}
        >
          校稿工具
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tools.map((tool) => {
            const isActive = activeTool === tool.type;
            return (
              <button
                key={tool.type}
                onClick={() => onToolSelect(tool.type)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: isActive ? `${tool.color}15` : '#f8f9fa',
                  border: isActive ? `2px solid ${tool.color}` : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  color: '#2c3e50',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 18 }}>{tool.emoji}</span>
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: 20 }}>
        <h4
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#2c3e50',
            margin: '0 0 12px 0',
          }}
        >
          标记列表 ({annotations.length})
        </h4>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 300,
            scrollbarWidth: 'thin',
          }}
        >
          {annotations.length === 0 ? (
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: '20px 0' }}>
              暂无标记
            </p>
          ) : (
            annotations.map((ann, index) => {
              const typeInfo = getTypeLabel(ann.type);
              const displayText = ann.comment || ann.textPreview || '';
              const blockNumber = ann.commentNumber !== undefined ? ann.commentNumber : index + 1;
              return (
                <div
                  key={ann.id}
                  onClick={() => onAnnotationClick(ann)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>{typeInfo.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#2c3e50' }}>
                      文本块 #{blockNumber} · {typeInfo.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#666',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={displayText}
                    >
                      {truncateText(displayText)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <button
        onClick={onExport}
        disabled={isExporting}
        style={{
          marginTop: 20,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: '#ffffff',
          border: 'none',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.3s ease',
          boxShadow: isExporting ? 'none' : '0 2px 8px rgba(102, 126, 234, 0.3)',
          fontFamily: 'inherit',
          opacity: isExporting ? 0.8 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isExporting) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExporting) {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
          }
        }}
      >
        {isExporting ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
            </svg>
            生成中...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出PDF
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ToolPanel;
