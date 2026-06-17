import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import type { InspirationNode } from '../types';
import { TAG_COLORS } from '../types';

interface TreeNodeProps {
  node: InspirationNode;
  level: number;
  visibleNodes: Set<string>;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, visibleNodes }) => {
  const {
    selectedNodeId,
    editingNodeId,
    searchKeyword,
    actions: {
      selectNode,
      setEditingNode,
      updateNode,
      toggleCollapse,
      openModal,
    },
  } = useGraphStore();

  const [editTitle, setEditTitle] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const isEditing = editingNodeId === node.id;
  const isHighlighted =
    searchKeyword.trim() !== '' &&
    (node.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      node.tag.toLowerCase().includes(searchKeyword.toLowerCase()));

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNode(node.id);
    setEditTitle(node.title);
  };

  const handleBlur = () => {
    if (editTitle.trim()) {
      updateNode(node.id, { title: editTitle.trim() });
    }
    setEditingNode(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditTitle(node.title);
      setEditingNode(null);
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal(node.id);
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCollapse(node.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  if (!visibleNodes.has(node.id)) return null;

  const indent = level * 24;
  const dotColor = TAG_COLORS[node.tag];

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 py-2 px-2 mx-2 rounded-lg cursor-pointer
          transition-all duration-200 group
          ${isSelected ? 'bg-[#2A2A44]' : 'hover:bg-[#2A2A44]/60'}
          ${isHighlighted ? 'ring-1 ring-[#6C63FF]/50' : ''}
        `}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <button
          className={`
            w-5 h-5 flex items-center justify-center rounded
            transition-all duration-200
            ${hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            hover:bg-[#3A3A5C]
          `}
          onClick={handleToggleCollapse}
        >
          {node.collapsed ? (
            <ChevronRight size={14} className="text-[#8C8CAA]" />
          ) : (
            <ChevronDown size={14} className="text-[#8C8CAA]" />
          )}
        </button>

        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}40` }}
        />

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-[#3A3A5C] text-[#E0E0E0] text-sm font-semibold px-2 py-1 rounded outline-none border border-[#6C63FF]/50"
            style={{ fontFamily: 'Inter, sans-serif' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`
              flex-1 text-sm font-semibold truncate
              ${isHighlighted ? 'text-[#6C63FF]' : 'text-[#E0E0E0]'}
            `}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {node.title}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <button
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#3A3A5C] text-[#8C8CAA] hover:text-[#E0E0E0] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setEditingNode(node.id);
                setEditTitle(node.title);
              }}
              title="编辑"
            >
              <Pencil size={12} />
            </button>
          )}
          <button
            className="
              w-5 h-5 flex items-center justify-center rounded-full bg-[#6C63FF]
              hover:scale-110 hover:shadow-lg transition-all duration-200
              text-white
            "
            style={{ boxShadow: '0 0 8px rgba(108,99,255,0.3)' }}
            onClick={handleAddChild}
            title="添加子节点"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {!node.collapsed &&
        node.children.map((childId) => {
          const child = useGraphStore
            .getState()
            .nodes.find((n) => n.id === childId);
          if (!child) return null;
          return (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              visibleNodes={visibleNodes}
            />
          );
        })}
    </div>
  );
};

export const IdeaTreePanel: React.FC = () => {
  const { nodes, searchKeyword, actions: { openModal } } = useGraphStore();

  const getVisibleNodes = (): Set<string> => {
    const visible = new Set<string>();

    function traverse(nodeId: string, parentCollapsed: boolean) {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (!parentCollapsed) {
        visible.add(node.id);
      }

      node.children.forEach((childId) =>
        traverse(childId, parentCollapsed || node.collapsed),
      );
    }

    nodes
      .filter((n) => n.parentId === null)
      .forEach((n) => traverse(n.id, false));

    return visible;
  };

  const visibleNodes = getVisibleNodes();
  const rootNodes = nodes.filter((n) => n.parentId === null);

  return (
    <div
      className="
        w-[300px] h-full flex flex-col
        bg-[#16162A] rounded-xl border border-[#2A2A44]
        overflow-hidden
      "
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A44]">
        <h2 className="text-[#E0E0E0] font-bold text-base">灵感树</h2>
        <button
          className="
            w-6 h-6 flex items-center justify-center rounded-full bg-[#6C63FF]
            hover:scale-110 transition-all duration-200
            text-white
          "
          style={{ boxShadow: '0 0 12px rgba(108,99,255,0.5)' }}
          onClick={() => openModal(null)}
          title="添加根节点"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {rootNodes.length === 0 ? (
          <div className="text-center text-[#6C6C8A] text-sm py-8">
            暂无灵感节点
            <br />
            点击右上角 + 添加
          </div>
        ) : (
          rootNodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              visibleNodes={visibleNodes}
            />
          ))
        )}
      </div>
    </div>
  );
};
