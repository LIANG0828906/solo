import { useState, useRef, useEffect, useCallback } from 'react';
import { MindMapNode, UserCursor, ThemeType } from '../types';

interface MindMapProps {
  nodes: MindMapNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddNode: (parentId: string | null, text: string, x: number, y: number) => MindMapNode | void;
  onDeleteNode: (id: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onEditNode: (id: string, text: string) => void;
  onMoveEnd: () => void;
  onCursorMove: (x: number, y: number) => void;
  userCursors: Map<string, UserCursor>;
  theme: ThemeType;
}

const NODE_WIDTH = 100;
const NODE_HEIGHT = 44;
const MIN_SPACING = 80;
const CHILD_OFFSET_X = 140;
const CHILD_OFFSET_Y = 60;

function MindMap({
  nodes,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onDeleteNode,
  onMoveNode,
  onEditNode,
  onMoveEnd,
  onCursorMove,
  userCursors,
  theme,
}: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);
  const lastCursorTimeRef = useRef<number>(0);

  const getChildNodes = useCallback(
    (parentId: string | null) => {
      return nodes.filter((n) => n.parentId === parentId);
    },
    [nodes]
  );

  const getConnectionPath = useCallback(
    (parent: MindMapNode, child: MindMapNode) => {
      const startX = parent.x + NODE_WIDTH / 2;
      const startY = parent.y + NODE_HEIGHT / 2;
      const endX = child.x + NODE_WIDTH / 2;
      const endY = child.y + NODE_HEIGHT / 2;

      const midX = (startX + endX) / 2;

      return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    },
    []
  );

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.mindmap-node')) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left - NODE_WIDTH / 2;
      const y = e.clientY - rect.top - NODE_HEIGHT / 2;

      const newNode = onAddNode(null, '新主题', x, y);
      if (newNode) {
        onSelectNode(newNode.id);
        setEditingNodeId(newNode.id);
        setEditText(newNode.text);
      }
    },
    [onAddNode, onSelectNode]
  );

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      e.stopPropagation();
      onSelectNode(node.id);
      setEditingNodeId(node.id);
      setEditText(node.text);
    },
    [onSelectNode]
  );

  const handleNodeClick = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      e.stopPropagation();
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const handleCanvasClick = useCallback(() => {
    onSelectNode(null);
    setEditingNodeId(null);
  }, [onSelectNode]);

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      if (editingNodeId === node.id) return;
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDraggingNodeId(node.id);
      setDragOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y,
      });

      onSelectNode(node.id);
    },
    [editingNodeId, onSelectNode]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const now = Date.now();
      if (now - lastCursorTimeRef.current > 16) {
        onCursorMove(canvasX, canvasY);
        lastCursorTimeRef.current = now;
      }

      if (draggingNodeId) {
        const newX = e.clientX - rect.left - dragOffset.x;
        const newY = e.clientY - rect.top - dragOffset.y;
        onMoveNode(draggingNodeId, newX, newY);
      }
    },
    [draggingNodeId, dragOffset, onMoveNode, onCursorMove]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
      onMoveEnd();
      autoLayout(draggingNodeId);
    }
  }, [draggingNodeId, onMoveEnd]);

  const autoLayout = useCallback(
    (movedNodeId: string) => {
      const movedNode = nodes.find((n) => n.id === movedNodeId);
      if (!movedNode) return;

      const siblings = nodes
        .filter((n) => n.parentId === movedNode.parentId && n.id !== movedNodeId)
        .sort((a, b) => a.y - b.y);

      siblings.forEach((sibling, index) => {
        const prevNode = index === 0 ? movedNode : siblings[index - 1];
        const distance = sibling.y - prevNode.y;

        if (Math.abs(distance) < MIN_SPACING) {
          const adjust = (MIN_SPACING - Math.abs(distance)) / 2;
          if (distance >= 0) {
            onMoveNode(sibling.id, sibling.x, sibling.y + adjust);
          } else {
            onMoveNode(sibling.id, sibling.x, sibling.y - adjust);
          }
        }
      });
    },
    [nodes, onMoveNode]
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent, nodeId: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onEditNode(nodeId, editText);
        setEditingNodeId(null);

        const node = nodes.find((n) => n.id === nodeId);
        if (node && node.text.trim() === '') {
          onDeleteNode(nodeId);
        }
      } else if (e.key === 'Escape') {
        setEditingNodeId(null);
      }
    },
    [editText, nodes, onEditNode, onDeleteNode]
  );

  const handleAddChildNode = useCallback(
    (parentId: string) => {
      const parent = nodes.find((n) => n.id === parentId);
      if (!parent) return;

      const children = getChildNodes(parentId);
      const childY = parent.y + CHILD_OFFSET_Y + children.length * 60;

      const newNode = onAddNode(
        parentId,
        '子主题',
        parent.x + CHILD_OFFSET_X,
        childY
      );
      if (newNode) {
        onSelectNode(newNode.id);
        setEditingNodeId(newNode.id);
        setEditText(newNode.text);
      }
    },
    [nodes, getChildNodes, onAddNode, onSelectNode]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNodeId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          setDeletingNodeId(selectedNodeId);
          setTimeout(() => {
            onDeleteNode(selectedNodeId);
            setDeletingNodeId(null);
          }, 200);
        }
      }

      if ((e.key === 'Tab' || e.key === 'Insert') && selectedNodeId) {
        e.preventDefault();
        handleAddChildNode(selectedNodeId);
      }

      if (e.key === 'Enter' && selectedNodeId && !e.shiftKey) {
        e.preventDefault();
        const node = nodes.find((n) => n.id === selectedNodeId);
        if (node) {
          setEditingNodeId(selectedNodeId);
          setEditText(node.text);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, editingNodeId, nodes, onDeleteNode, handleAddChildNode]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (editingNodeId) {
      const input = window.document.querySelector(
        `.node-input-${editingNodeId}`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [editingNodeId]);

  const connections = nodes
    .filter((n) => n.parentId)
    .map((child) => {
      const parent = nodes.find((n) => n.id === child.parentId);
      if (!parent) return null;
      return { parent, child, path: getConnectionPath(parent, child) };
    })
    .filter(Boolean);

  return (
    <div
      ref={containerRef}
      className={`canvas-container theme-${theme}`}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
    >
      <svg className="canvas-svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {connections.map((conn) => {
          if (!conn) return null;
          const isSelected =
            selectedNodeId === conn.child.id || selectedNodeId === conn.parent.id;
          return (
            <path
              key={`${conn.parent.id}-${conn.child.id}`}
              d={conn.path}
              className={`connection-line ${isSelected ? 'selected' : ''}`}
            />
          );
        })}
      </svg>

      {nodes.map((node) => (
        <div
          key={node.id}
          className={`mindmap-node 
            ${selectedNodeId === node.id ? 'selected' : ''} 
            ${draggingNodeId === node.id ? 'dragging' : ''}
            ${editingNodeId === node.id ? 'editing' : ''}
            ${deletingNodeId === node.id ? 'deleting' : ''}`}
          style={{
            left: node.x,
            top: node.y,
            width: NODE_WIDTH,
            minHeight: NODE_HEIGHT,
            transition:
              draggingNodeId === node.id
                ? 'none'
                : 'all 200ms ease-in-out',
          }}
          onClick={(e) => handleNodeClick(e, node)}
          onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
          onMouseDown={(e) => handleNodeMouseDown(e, node)}
        >
          {editingNodeId === node.id ? (
            <input
              type="text"
              className={`node-text node-input-${node.id}`}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => handleEditKeyDown(e, node.id)}
              onBlur={() => {
                onEditNode(node.id, editText);
                setEditingNodeId(null);
              }}
            />
          ) : (
            <div className="node-text">{node.text || ' '}</div>
          )}
        </div>
      ))}

      {Array.from(userCursors.values()).map((cursor) => (
        <div
          key={cursor.userId}
          className="user-cursor"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="cursor-dot"
            style={{ background: cursor.color }}
          />
          <div className="cursor-label">{cursor.userName}</div>
        </div>
      ))}
    </div>
  );
}

export default MindMap;
