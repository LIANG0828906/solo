import { useState, useRef } from 'react';
import { HistoryNode } from '../story/types';

interface TreeProps {
  history: HistoryNode[];
  onNodeClick: (historyIndex: number) => void;
  currentHistoryIndex: number;
  onClear: () => void;
}

export function Tree({ history, onNodeClick, currentHistoryIndex, onClear }: TreeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const panelStyle: React.CSSProperties = {
    width: '600px',
    backgroundColor: 'rgba(15, 52, 96, 0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: '12px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'height 0.3s ease-out',
    height: isExpanded ? '300px' : '44px',
    cursor: isExpanded ? 'default' : 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    minHeight: '44px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    userSelect: 'none',
  };

  const clearButtonStyle: React.CSSProperties = {
    color: 'white',
    fontSize: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    textDecoration: 'none',
  };

  const treeContainerStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '16px 20px',
    display: 'block',
  };

  const nodeStyle = (isCurrent: boolean): React.CSSProperties => ({
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: isCurrent ? '#E94560' : 'white',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: isCurrent ? '0 0 8px rgba(233, 69, 96, 0.6)' : 'none',
    display: 'inline-block',
  });

  const nodeLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: '6px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '120px',
    display: 'inline-block',
    verticalAlign: 'middle',
  };

  const toggleArrowStyle: React.CSSProperties = {
    transition: 'transform 0.3s ease',
    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
    marginLeft: '8px',
    fontSize: '12px',
    display: 'inline-block',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '0',
    width: 'max-content',
    minWidth: '100%',
  };

  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
    paddingRight: '28px',
    position: 'relative',
  };

  const nodeWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '20px',
    position: 'relative',
    whiteSpace: 'nowrap',
  };

  const horizontalConnectorStyle: React.CSSProperties = {
    position: 'absolute',
    right: '-28px',
    top: '50%',
    width: '28px',
    height: '1px',
    backgroundColor: '#555555',
  };

  const buildTreeColumns = (): React.ReactNode => {
    if (history.length === 0) {
      return (
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '12px',
            textAlign: 'center',
            padding: '40px 0',
            width: '100%',
          }}
        >
          暂无历史记录
        </div>
      );
    }

    const maxDepth = Math.max(...history.map((h) => h.depth));
    const columns: React.ReactNode[] = [];

    for (let d = 0; d <= maxDepth; d++) {
      const nodesAtDepth = history
        .map((h, idx) => ({ node: h, index: idx }))
        .filter(({ node }) => node.depth === d);

      const nodes = nodesAtDepth.map(({ node, index }) => {
        const isCurrent = index === currentHistoryIndex;
        const hasChildren = history.some((h) => h.parentIndex === index);
        const label = node.choiceText || '起点';

        return (
          <div key={`node-${index}`} style={nodeWrapperStyle}>
            <span
              style={nodeStyle(isCurrent)}
              onClick={() => onNodeClick(index)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`节点 ${index + 1}: ${label}`}
            />
            <span style={nodeLabelStyle}>{label}</span>
            {hasChildren && <span style={horizontalConnectorStyle} />}
          </div>
        );
      });

      columns.push(
        <div key={`depth-${d}`} style={columnStyle}>
          {nodes}
        </div>
      );
    }

    return <div style={rowStyle}>{columns}</div>;
  };

  return (
    <div
      style={panelStyle}
      onClick={() => {
        if (!isExpanded) {
          setIsExpanded(true);
        }
      }}
      ref={containerRef}
    >
      <div
        style={headerStyle}
        onClick={(e) => {
          if (isExpanded) {
            e.stopPropagation();
            setIsExpanded(false);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span>历史路径</span>
          <span style={{ marginLeft: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            ({history.length} 个节点)
          </span>
          <span style={toggleArrowStyle}>▼</span>
        </div>
        <button
          style={clearButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
          disabled={history.length === 0}
        >
          清空历史
        </button>
      </div>

      {isExpanded && <div style={treeContainerStyle}>{buildTreeColumns()}</div>}
    </div>
  );
}
