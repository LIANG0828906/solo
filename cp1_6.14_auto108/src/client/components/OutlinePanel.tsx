import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { OutlineNode } from '../../types';

interface OutlinePanelProps {
  outline: OutlineNode[];
  onOutlineChange: (outline: OutlineNode[]) => void;
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
}

const panelStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(200, 220, 240, 0.3)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  padding: '16px',
  overflow: 'hidden',
};

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#3B4A6B',
};

const addBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3B4A6B, #5A6B8C)',
  color: 'white',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s ease',
};

const treeContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
};

const nodeContainerStyle: React.CSSProperties = {
  marginBottom: '4px',
};

const nodeContentStyle = (selected: boolean, isDragging: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 10px',
  borderRadius: '8px',
  cursor: 'grab',
  transition: 'all 0.2s ease',
  background: selected ? 'rgba(59, 74, 107, 0.1)' : 'transparent',
  border: selected ? '2px solid #3B4A6B' : '2px solid transparent',
  opacity: isDragging ? 0.5 : 1,
  position: 'relative',
});

const nodeTitleStyle: React.CSSProperties = {
  flex: 1,
  fontSize: '0.875rem',
  color: '#2D3748',
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const nodeActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  opacity: 0,
  transition: 'opacity 0.2s ease',
};

const expandBtnStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#718096',
  fontSize: '0.75rem',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
};

const iconBtnStyle: React.CSSProperties = {
  width: '22px',
  height: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(59, 74, 107, 0.1)',
  border: 'none',
  cursor: 'pointer',
  color: '#3B4A6B',
  fontSize: '0.7rem',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
};

const childrenContainerStyle = (collapsed: boolean, height: number): React.CSSProperties => ({
  overflow: 'hidden',
  transition: 'height 0.3s ease',
  height: collapsed ? 0 : height,
  marginLeft: '20px',
  borderLeft: '2px solid rgba(59, 74, 107, 0.2)',
  paddingLeft: '12px',
});

const dropIndicatorStyle: React.CSSProperties = {
  height: '3px',
  background: '#74C0FC',
  borderRadius: '2px',
  margin: '2px 0',
  animation: 'fadeIn 0.15s ease',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#A0AEC0',
  fontSize: '0.85rem',
  padding: '30px 10px',
};

function findNode(nodes: OutlineNode[], id: string): OutlineNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function removeNode(nodes: OutlineNode[], id: string): OutlineNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({
      ...n,
      children: removeNode(n.children, id),
    }));
}

function updateNode(nodes: OutlineNode[], id: string, updates: Partial<OutlineNode>): OutlineNode[] {
  return nodes.map((n) => {
    if (n.id === id) {
      return { ...n, ...updates };
    }
    return { ...n, children: updateNode(n.children, id, updates) };
  });
}

function addChildNode(nodes: OutlineNode[], parentId: string, child: OutlineNode): OutlineNode[] {
  if (parentId === '') {
    return [...nodes, child];
  }
  return nodes.map((n) => {
    if (n.id === parentId) {
      return { ...n, children: [...n.children, child] };
    }
    return { ...n, children: addChildNode(n.children, parentId, child) };
  });
}

function insertNodeAt(
  nodes: OutlineNode[],
  targetId: string,
  node: OutlineNode,
  position: 'before' | 'after' | 'child'
): OutlineNode[] {
  if (position === 'child') {
    return addChildNode(nodes, targetId, node);
  }

  const result: OutlineNode[] = [];
  let inserted = false;

  for (const n of nodes) {
    if (n.id === targetId) {
      if (position === 'before') {
        result.push(node);
        result.push({ ...n, children: n.children });
      } else {
        result.push({ ...n, children: n.children });
        result.push(node);
      }
      inserted = true;
    } else {
      result.push({ ...n, children: insertNodeAt(n.children, targetId, node, position) });
    }
  }

  if (!inserted) {
    return nodes.map((n) => ({
      ...n,
      children: insertNodeAt(n.children, targetId, node, position),
    }));
  }

  return result;
}

interface TreeNodeProps {
  node: OutlineNode;
  level: number;
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
  onOutlineChange: (outline: OutlineNode[]) => void;
  outline: OutlineNode[];
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  dropTarget: { id: string; position: 'before' | 'after' | 'child' } | null;
  setDropTarget: (target: { id: string; position: 'before' | 'after' | 'child' } | null) => void;
  onShowDeleteConfirm: (nodeId: string) => void;
}

function TreeNode({
  node,
  level,
  selectedNodeId,
  onSelectNode,
  onOutlineChange,
  outline,
  draggedId,
  setDraggedId,
  dropTarget,
  setDropTarget,
  onShowDeleteConfirm,
}: TreeNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [showActions, setShowActions] = useState(false);
  const [childHeight, setChildHeight] = useState<number>(0);
  const childrenRef = useRef<HTMLDivElement>(null);

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.collapsed ?? false;
  const isSelected = selectedNodeId === node.id;
  const isDragging = draggedId === node.id;

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasChildren) return;
    const newOutline = updateNode(outline, node.id, { collapsed: !isCollapsed });
    onOutlineChange(newOutline);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newNode: OutlineNode = {
      id: uuidv4(),
      title: '新章节',
      children: [],
    };
    const newOutline = addChildNode(outline, node.id, newNode);
    if (isCollapsed) {
      const updated = updateNode(newOutline, node.id, { collapsed: false });
      onOutlineChange(updated);
    } else {
      onOutlineChange(newOutline);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDeleteConfirm(node.id);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditTitle(node.title);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle !== node.title) {
      const newOutline = updateNode(outline, node.id, { title: editTitle.trim() });
      onOutlineChange(newOutline);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(node.title);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setDraggedId(node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedId === node.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: 'before' | 'after' | 'child';
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    } else {
      position = 'child';
    }

    setDropTarget({ id: node.id, position });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || draggedId === node.id || !dropTarget) return;

    const draggedNode = findNode(outline, draggedId);
    if (!draggedNode) return;

    let newOutline = removeNode(outline, draggedId);
    newOutline = insertNodeAt(newOutline, dropTarget.id, { ...draggedNode }, dropTarget.position);

    onOutlineChange(newOutline);
    setDraggedId(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTarget(null);
  };

  const measureHeight = () => {
    if (childrenRef.current) {
      setChildHeight(childrenRef.current.scrollHeight);
    }
  };

  return (
    <div style={nodeContainerStyle}>
      {dropTarget?.id === node.id && dropTarget.position === 'before' && (
        <div style={dropIndicatorStyle} />
      )}
      <div
        style={nodeContentStyle(isSelected, isDragging)}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectNode?.(node.id)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onDoubleClick={handleDoubleClick}
      >
        <button
          style={expandBtnStyle}
          onClick={handleToggleCollapse}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 74, 107, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          {hasChildren ? (isCollapsed ? '▶' : '▼') : '•'}
        </button>

        {isEditing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              flex: 1,
              padding: '2px 6px',
              fontSize: '0.875rem',
              border: '1px solid #3B4A6B',
              borderRadius: '4px',
              outline: 'none',
              background: 'white',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span style={nodeTitleStyle}>{node.title}</span>
        )}

        <div style={{ ...nodeActionsStyle, opacity: showActions || isSelected ? 1 : 0 }}>
          <button
            style={iconBtnStyle}
            onClick={handleAddChild}
            title="添加子章节"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 74, 107, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 74, 107, 0.1)';
            }}
          >
            +
          </button>
          <button
            style={iconBtnStyle}
            onClick={handleDelete}
            title="删除"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FED7D7';
              e.currentTarget.style.color = '#E53E3E';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 74, 107, 0.1)';
              e.currentTarget.style.color = '#3B4A6B';
            }}
          >
            ✕
          </button>
        </div>
      </div>
      {dropTarget?.id === node.id && dropTarget.position === 'after' && (
        <div style={dropIndicatorStyle} />
      )}

      {hasChildren && (
        <div
          style={childrenContainerStyle(isCollapsed, childHeight)}
          ref={childrenRef}
          onTransitionEnd={measureHeight}
        >
          <div style={{ display: isCollapsed ? 'none' : 'block' }}>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode}
                onOutlineChange={onOutlineChange}
                outline={outline}
                draggedId={draggedId}
                setDraggedId={setDraggedId}
                dropTarget={dropTarget}
                setDropTarget={setDropTarget}
                onShowDeleteConfirm={onShowDeleteConfirm}
              />
            ))}
          </div>
        </div>
      )}

      {hasChildren && !isCollapsed && (
        <div style={{ display: 'none' }} ref={measureHeight as any} />
      )}
    </div>
  );
}

export default function OutlinePanel({
  outline,
  onOutlineChange,
  selectedNodeId,
  onSelectNode,
}: OutlinePanelProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: 'before' | 'after' | 'child';
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteWithContent, setDeleteWithContent] = useState(false);

  const handleAddRoot = () => {
    const newNode: OutlineNode = {
      id: uuidv4(),
      title: '新章节',
      children: [],
    };
    onOutlineChange([...outline, newNode]);
  };

  const handleDeleteConfirm = () => {
    if (!showDeleteConfirm) return;
    const newOutline = removeNode(outline, showDeleteConfirm);
    onOutlineChange(newOutline);
    setShowDeleteConfirm(null);
    setDeleteWithContent(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
    setDeleteWithContent(false);
  };

  return (
    <div style={panelStyle}>
      <div style={panelHeaderStyle}>
        <span style={panelTitleStyle}>📑 大纲</span>
        <button
          style={addBtnStyle}
          onClick={handleAddRoot}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #C99A3E, #E8B85C)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3B4A6B, #5A6B8C)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          + 章节
        </button>
      </div>

      <div style={treeContainerStyle}>
        {outline.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📝</div>
            <p>还没有大纲</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>点击上方按钮添加章节</p>
          </div>
        ) : (
          outline.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onOutlineChange={onOutlineChange}
              outline={outline}
              draggedId={draggedId}
              setDraggedId={setDraggedId}
              dropTarget={dropTarget}
              setDropTarget={setDropTarget}
              onShowDeleteConfirm={setShowDeleteConfirm}
            />
          ))
        )}
      </div>

      {showDeleteConfirm && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            zIndex: 10,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              maxWidth: '280px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              animation: 'scaleIn 0.25s ease',
            }}
          >
            <h4 style={{ marginBottom: '12px', color: '#2D3748', fontSize: '1rem' }}>
              确认删除？
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '12px' }}>
              确定要删除这个章节吗？
            </p>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                color: '#4A5568',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={deleteWithContent}
                onChange={(e) => setDeleteWithContent(e.target.checked)}
              />
              同时删除内容
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
                onClick={handleDeleteCancel}
              >
                取消
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  background: '#F56565',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
                onClick={handleDeleteConfirm}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
