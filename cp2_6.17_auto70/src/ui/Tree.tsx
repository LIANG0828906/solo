import { useState } from 'react';
import type { HistoryEntry } from '../story/types';

interface TreeProps {
  history: HistoryEntry[];
  onNodeClick: (historyIndex: number) => void;
  onClear: () => void;
}

export default function Tree({ history, onNodeClick, onClear }: TreeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNodeClick = (index: number) => {
    onNodeClick(index);
  };

  const renderNode = (entry: HistoryEntry, index: number, isLast: boolean) => {
    return (
      <div
        key={entry.timestamp + '-' + index}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          position: 'relative',
          paddingLeft: '20px',
        }}
      >
        {!isLast && (
          <div
            style={{
              position: 'absolute',
              left: '4px',
              top: '14px',
              width: '1px',
              height: 'calc(100% + 12px)',
              backgroundColor: '#333',
            }}
          />
        )}
        
        <div
          onClick={() => handleNodeClick(index)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease',
            flex: 1,
            minWidth: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              flexShrink: 0,
              boxShadow: entry.choiceIndex === 0 
                ? '0 0 8px rgba(233, 69, 96, 0.6)' 
                : '0 0 8px rgba(15, 52, 96, 0.6)',
              position: 'relative',
              zIndex: 1,
            }}
          />
          
          <div style={{ 
            flex: 1, 
            minWidth: 0,
            overflow: 'hidden',
          }}>
            <div
              style={{
                color: '#ffffff',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {entry.choiceText}
            </div>
            <div
              style={{
                color: '#666',
                fontSize: '10px',
                marginTop: '2px',
              }}
            >
              节点 {index + 1} · {entry.choiceIndex === 0 ? '左选择' : '右选择'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '600px',
        position: 'fixed',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          backgroundColor: 'rgba(15, 52, 96, 0.9)',
          backdropFilter: 'blur(10px)',
          borderTopLeftRadius: isExpanded ? '12px' : '12px',
          borderTopRightRadius: isExpanded ? '12px' : '12px',
          borderBottomLeftRadius: isExpanded ? '0' : '12px',
          borderBottomRightRadius: isExpanded ? '0' : '12px',
          padding: '12px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-radius 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#ffffff' }}>🌿 故事路径</span>
          {history.length > 0 && (
            <span
              style={{
                backgroundColor: '#E94560',
                color: '#ffffff',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 'bold',
              }}
            >
              {history.length}
            </span>
          )}
        </div>
        <span
          style={{
            color: '#888',
            fontSize: '12px',
            transition: 'transform 0.3s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(15, 52, 96, 0.85)',
          backdropFilter: 'blur(10px)',
          height: isExpanded ? '300px' : '0',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
          position: 'relative',
        }}
      >
        {history.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
              textDecoration: 'none',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            清空历史
          </button>
        )}

        <div
          style={{
            height: '100%',
            overflowY: 'auto',
            padding: '16px 12px',
          }}
        >
          {history.length === 0 ? (
            <div
              style={{
                color: '#666',
                fontSize: '12px',
                textAlign: 'center',
                padding: '40px 20px',
              }}
            >
              还没有做出任何选择<br />
              <span style={{ fontSize: '11px', color: '#444' }}>
                你的选择将在这里形成故事的脉络
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {history.map((entry, index) =>
                renderNode(entry, index, index === history.length - 1)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
