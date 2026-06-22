import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { HexColorPicker } from 'react-colorful';
import type { ColorNode } from '../types';

interface ColorEditorProps {
  nodes: ColorNode[];
  onAddNode: () => void;
  onDeleteNode: (nodeId: string) => void;
  onColorChange: (nodeId: string, color: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}

function ColorEditor({
  nodes,
  onAddNode,
  onDeleteNode,
  onColorChange,
  onReorder
}: ColorEditorProps) {
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setActivePickerId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    setDraggedId(nodeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', nodeId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      onReorder(draggedId, targetId);
    }
    setDraggedId(null);
  }, [draggedId, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setActivePickerId(activePickerId === nodeId ? null : nodeId);
  }, [activePickerId]);

  const handleColorSelect = useCallback((nodeId: string, color: string) => {
    onColorChange(nodeId, color);
  }, [onColorChange]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    onDeleteNode(nodeId);
    if (activePickerId === nodeId) {
      setActivePickerId(null);
    }
  }, [onDeleteNode, activePickerId]);

  const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);

  return (
    <div>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#aaa',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        颜色节点
      </h3>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: '1px solid #2a2a3e',
          minHeight: '80px'
        }}
      >
        {sortedNodes.map((node) => (
          <div
            key={node.id}
            style={{ position: 'relative' }}
          >
            <div
              className={`color-node ${draggedId === node.id ? 'dragging' : ''}`}
              style={{ backgroundColor: node.color }}
              draggable
              onDragStart={(e) => handleDragStart(e, node.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, node.id)}
              onDragEnd={handleDragEnd}
              onClick={() => handleNodeClick(node.id)}
            >
              {nodes.length > 2 && (
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteClick(e, node.id)}
                >
                  ×
                </button>
              )}
            </div>
            
            <div
              style={{
                position: 'absolute',
                bottom: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '11px',
                color: '#666'
              }}
            >
              {node.position}%
            </div>

            {activePickerId === node.id && (
              <div className="picker-popup" ref={pickerRef}>
                <HexColorPicker
                  color={node.color}
                  onChange={(color) => handleColorSelect(node.id, color)}
                  style={{ width: '200px' }}
                />
                <div
                  style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: node.color,
                      border: '1px solid #444'
                    }}
                  />
                  <input
                    type="text"
                    value={node.color}
                    onChange={(e) => handleColorSelect(node.id, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      backgroundColor: '#121212',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#e0e0e0',
                      fontFamily: "'Fira Code', monospace",
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        
        <button
          className="add-node-btn"
          onClick={onAddNode}
          title="添加颜色节点"
        >
          +
        </button>
      </div>

      <p
        style={{
          marginTop: '12px',
          fontSize: '12px',
          color: '#666'
        }}
      >
        拖拽节点调整顺序，点击节点选择颜色
      </p>
    </div>
  );
}

export default memo(ColorEditor);
