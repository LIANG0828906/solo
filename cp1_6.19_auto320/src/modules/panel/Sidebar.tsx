import React, { useMemo } from 'react';
import { useMindMapStore } from '../mindmap/store';
import { MindMapNode } from '../mindmap/types';

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${min}:${ss}`;
};

const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <span style={{ backgroundColor: '#f39c12', color: '#1a1a2e', padding: '0 2px', borderRadius: 2 }}>
        {text.slice(index, index + query.length)}
      </span>
      {text.slice(index + query.length)}
    </>
  );
};

export const Sidebar: React.FC = () => {
  const {
    nodes,
    searchQuery,
    setSearchQuery,
    selectedNodeId,
    selectNode,
    setHighlightNode,
    setOffset,
    setScale,
  } = useMindMapStore();

  const sortedNodes = useMemo(() => {
    return Object.values(nodes).sort((a: MindMapNode, b: MindMapNode) => a.createdAt - b.createdAt);
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return sortedNodes;
    const query = searchQuery.toLowerCase();
    return sortedNodes.filter(
      (node) =>
        node.text.toLowerCase().includes(query) ||
        (node.note && node.note.toLowerCase().includes(query))
    );
  }, [sortedNodes, searchQuery]);

  const handleNodeClick = (node: MindMapNode) => {
    selectNode(node.id);
    setHighlightNode(node.id);
    setScale(1);
    setOffset(-node.x, -node.y);
    setTimeout(() => setHighlightNode(null), 2000);
  };

  return (
    <div
      style={{
        width: 240,
        backgroundColor: 'rgba(15, 52, 96, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div style={{ padding: 16 }}>
        <h2
          style={{
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            margin: '0 0 12px 0',
          }}
        >
          🧠 节点列表
        </h2>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 12px 8px 32px',
              backgroundColor: '#16213e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: 'white',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
            }}
          >
            🔍
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 8px 16px 8px',
        }}
      >
        {filteredNodes.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
            }}
          >
            {searchQuery ? '没有匹配的节点' : '暂无节点'}
          </div>
        ) : (
          filteredNodes.map((node) => (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                marginBottom: 4,
                cursor: 'pointer',
                backgroundColor: selectedNodeId === node.id ? 'rgba(233, 69, 96, 0.2)' : 'transparent',
                transition: 'background-color 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
              onMouseEnter={(e) => {
                if (selectedNodeId !== node.id) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedNodeId !== node.id) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: node.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {highlightText(node.text.slice(0, 10) + (node.text.length > 10 ? '...' : ''), searchQuery)}
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  {formatTime(node.updatedAt)}
                </div>
              </div>
              {node.note && (
                <span style={{ fontSize: 12, color: '#f39c12' }}>📝</span>
              )}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
        }}
      >
        共 {Object.keys(nodes).length} 个节点
      </div>
    </div>
  );
};
