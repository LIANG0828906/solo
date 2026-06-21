import React, { useState, useRef, useEffect } from 'react';
import { MindMapNode as MindMapNodeType } from '../types';
import { useMindMap } from '../context/MindMapContext';
import { getLevelBorderColor } from '../utils/colors';
import { ContextMenu } from './ContextMenu';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

interface Props {
  node: MindMapNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  isRoot: boolean;
  mounted: Set<string>;
  justAdded: Set<string>;
}

export const Node: React.FC<Props> = ({ node, x, y, width, height, isRoot, mounted, justAdded }) => {
  const { selectedNodeId, setSelectedNodeId, updateNode, data } = useMindMap();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [bounceScale, setBounceScale] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedNodeId === node.id;
  const borderColor = isSelected ? '#4a90d9' : node.colorTag || getLevelBorderColor(node.level);
  const borderWidth = isSelected || isEditing ? 2 : 1;

  const hasChildren = node.childrenIds.length > 0;
  const canExpand = hasChildren && !isRoot;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = () => {
    const newText = editText.trim() || node.text;
    if (newText !== node.text) updateNode(node.id, { text: newText });
    setIsEditing(false);
    setBounceScale(1.1);
    setTimeout(() => setBounceScale(1.0), 60);
    setTimeout(() => setBounceScale(null), 180);
  };

  const cancelEdit = () => {
    setEditText(node.text);
    setIsEditing(false);
  };

  const toggleCollapsed = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNode(node.id, { collapsed: !node.collapsed });
  };

  const appearAnimation = !mounted.has(node.id) || justAdded.has(node.id);

  return (
    <>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (!isEditing) setSelectedNodeId(node.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditText(node.text);
          setIsEditing(true);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width,
          height,
          transform: `scale(${bounceScale ?? 1})`,
          transition: bounceScale != null
            ? `transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)`
            : `left 0.3s ${EASE}, top 0.3s ${EASE}, opacity 0.3s ${EASE}`,
          animation: appearAnimation
            ? (justAdded.has(node.id) ? `slideFromTop 0.3s ${EASE} both` : `nodeFadeIn 0.3s ${EASE} both`)
            : isSelected
              ? `blinkHighlight 0.6s ${EASE}`
              : undefined,
          zIndex: isSelected ? 10 : 1,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#ffffff',
            borderRadius: 8,
            border: `${borderWidth}px solid ${borderColor}`,
            boxShadow: isSelected
              ? '0 4px 14px rgba(74, 144, 217, 0.25)'
              : '0 2px 6px rgba(0,0,0,0.06)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            transition: `box-shadow 0.2s ${EASE}, border-color 0.2s ${EASE}, border-width 0.2s ${EASE}`,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {canExpand && (
            <button
              onClick={toggleCollapsed}
              style={{
                flexShrink: 0,
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: 'none',
                background: '#e8ecf1',
                color: '#555',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                lineHeight: 1,
                padding: 0,
                transform: node.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: `transform 0.2s ${EASE}`,
              }}
            >
              ▾
            </button>
          )}

          {isEditing ? (
            <input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEdit();
                }
                e.stopPropagation();
              }}
              onBlur={commitEdit}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 13,
                fontFamily: 'inherit',
                color: '#222',
              }}
            />
          ) : (
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                fontWeight: isRoot ? 600 : 400,
                color: '#222',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={node.text}
            >
              {node.text}
            </div>
          )}

          {data && data.notes[node.id]?.length > 0 && (
            <div
              title={`${data.notes[node.id].length}条便签`}
              style={{
                flexShrink: 0,
                background: '#e6f0fa',
                color: '#2c5282',
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              📝 {data.notes[node.id].length}
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={node.id}
          isRoot={isRoot}
          onClose={() => setContextMenu(null)}
        />
      )}

      <style>{`
        @keyframes nodeFadeIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideFromTop {
          from { opacity: 0; transform: translateY(-20px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes blinkHighlight {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.08); }
        }
      `}</style>
    </>
  );
};
