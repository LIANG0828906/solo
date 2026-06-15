import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGraph, NodeColor, COLOR_MAP, GraphState } from '@/context/GraphContext';

const colorOptions: NodeColor[] = ['red', 'blue', 'green', 'orange'];

export default function Sidebar() {
  const {
    nodes,
    selectedNodeId,
    addNode,
    selectNode,
    recomputeClusters,
    exportJSON,
    importJSON,
  } = useGraph();

  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<NodeColor>('blue');
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 800);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const handleAddNode = () => {
    if (!title.trim()) return;
    addNode(title.trim(), selectedColor);
    setTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddNode();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as GraphState;
        importJSON(data);
      } catch {
        alert('无效的JSON文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.endsWith('.json')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as GraphState;
        importJSON(data);
      } catch {
        alert('无效的JSON文件');
      }
    };
    reader.readAsText(file);
  }, [importJSON]);

  const sidebarBaseStyle: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    padding: 20,
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    border: isDragOver ? '2px dashed #667eea' : '2px solid transparent',
  };

  const desktopStyle: React.CSSProperties = {
    ...sidebarBaseStyle,
    width: 300,
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    overflowY: 'auto',
  };

  const mobileStyle: React.CSSProperties = {
    ...sidebarBaseStyle,
    width: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    maxHeight: isCollapsed ? 60 : 'auto',
    overflow: 'hidden',
  };

  const containerStyle = isMobile ? mobileStyle : desktopStyle;

  const buttonBaseStyle: React.CSSProperties = {
    borderRadius: 12,
    padding: '10px 16px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    color: '#ffffff',
  };

  const actionBtnStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#2d2d2d',
    flex: 1,
  };

  const actionBtnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateX(0.5px)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
  };

  const actionBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateX(0)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const addBtnStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 600,
    width: '100%',
  };

  const addBtnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateX(0.5px)';
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
  };

  const addBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateX(0)';
    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#2d2d2d',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const nodeItemStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: isSelected ? '#2d2d2d' : 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  });

  const renderHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#ffffff' }}>知识图谱</h1>
      {isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: 20,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      )}
    </div>
  );

  const renderContent = () => (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="输入节点标题..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {colorOptions.map((color) => (
            <div
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: COLOR_MAP[color],
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: selectedColor === color ? '3px solid #ffffff' : '3px solid transparent',
                boxSizing: 'border-box',
                boxShadow: selectedColor === color ? `0 0 0 2px ${COLOR_MAP[color]}` : 'none',
              }}
            />
          ))}
        </div>

        <button
          onClick={handleAddNode}
          style={addBtnStyle}
          onMouseEnter={addBtnHover}
          onMouseLeave={addBtnLeave}
        >
          添加节点
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={recomputeClusters}
          style={actionBtnStyle}
          onMouseEnter={actionBtnHover}
          onMouseLeave={actionBtnLeave}
        >
          重组
        </button>
        <button
          onClick={exportJSON}
          style={actionBtnStyle}
          onMouseEnter={actionBtnHover}
          onMouseLeave={actionBtnLeave}
        >
          导出JSON
        </button>
        <button
          onClick={handleImportClick}
          style={actionBtnStyle}
          onMouseEnter={actionBtnHover}
          onMouseLeave={actionBtnLeave}
        >
          导入JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 13, color: '#888888', marginBottom: 4, fontWeight: 500 }}>
          节点列表 ({nodes.length})
        </div>
        {nodes.length === 0 ? (
          <div style={{ fontSize: 13, color: '#666666', padding: '12px 0', textAlign: 'center' }}>
            暂无节点，添加第一个节点吧
          </div>
        ) : (
          nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => selectNode(selectedNodeId === node.id ? null : node.id)}
              style={nodeItemStyle(selectedNodeId === node.id)}
              onMouseEnter={(e) => {
                if (selectedNodeId !== node.id) {
                  e.currentTarget.style.backgroundColor = '#252525';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedNodeId !== node.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: COLOR_MAP[node.color],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  color: '#ffffff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {node.title}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div
      style={containerStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {renderHeader()}
      {(!isMobile || !isCollapsed) && renderContent()}
    </div>
  );
}
