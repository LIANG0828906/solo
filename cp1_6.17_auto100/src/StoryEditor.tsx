import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from './store';
import type { StoryNode } from './types';

const getNodeSummary = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return '(空段落)';
  return trimmed.length > 8 ? trimmed.slice(0, 8) + '...' : trimmed;
};

const buildNodeTree = (nodes: StoryNode[]): Map<string | null, StoryNode[]> => {
  const map = new Map<string | null, StoryNode[]>();
  nodes.forEach((node) => {
    const key = node.parentId;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(node);
  });
  map.forEach((list) => {
    list.sort((a, b) => a.createdAt - b.createdAt);
  });
  return map;
};

const TreeNode: React.FC<{
  node: StoryNode;
  depth: number;
  nodeMap: Map<string | null, StoryNode[]>;
}> = ({ node, depth, nodeMap }) => {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useStore((s) => s.setSelectedNodeId);
  const expandedNodeIds = useStore((s) => s.expandedNodeIds);
  const toggleNodeExpand = useStore((s) => s.toggleNodeExpand);

  const children = nodeMap.get(node.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodeIds.has(node.id);
  const isSelected = selectedNodeId === node.id;
  const isLocked = !!node.lockOwner;

  return (
    <div className="tree-node" style={{ paddingLeft: depth > 0 ? 0 : 0 }}>
      <div
        className={`tree-node-content ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedNodeId(node.id)}
      >
        <span
          className={`tree-toggle ${isExpanded ? 'expanded' : ''} ${!hasChildren ? 'leaf' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleNodeExpand(node.id);
          }}
        >
          ▶
        </span>
        <span className="tree-node-text" title={node.text}>
          {getNodeSummary(node.text)}
        </span>
        <span className="tree-lock-icon" title={isLocked ? `锁定中: ${node.lockOwnerName}` : '可编辑'}>
          {isLocked ? '🔒' : '🔓'}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div className="tree-children">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              nodeMap={nodeMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreePanel: React.FC = () => {
  const storyNodes = useStore((s) => s.storyNodes);
  const expandedNodeIds = useStore((s) => s.expandedNodeIds);
  const setExpandedNodeIds = useStore.getState;

  const nodeMap = buildNodeTree(storyNodes);
  const rootNodes = nodeMap.get(null) || [];

  const handleExpandAll = () => {
    const allIds = new Set(storyNodes.map((n) => n.id));
    useStore.setState({ expandedNodeIds: allIds });
  };

  const handleCollapseAll = () => {
    useStore.setState({ expandedNodeIds: new Set() });
  };

  return (
    <aside className="tree-panel">
      <div className="panel-title">
        <span>📚 故事节点</span>
        <span style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleExpandAll}
            style={{
              background: 'none',
              fontSize: '11px',
              color: '#6C63FF',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
            title="展开全部"
          >
            展开
          </button>
          <button
            onClick={handleCollapseAll}
            style={{
              background: 'none',
              fontSize: '11px',
              color: '#64748B',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
            title="折叠全部"
          >
            折叠
          </button>
        </span>
      </div>
      {rootNodes.length === 0 ? (
        <div className="empty-state">
          还没有故事节点，快来创建第一个分支吧！
        </div>
      ) : (
        rootNodes.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} nodeMap={nodeMap} />
        ))
      )}
    </aside>
  );
};

const AddBranchModal: React.FC<{
  parentId: string;
  onClose: () => void;
}> = ({ parentId, onClose }) => {
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(false);
  const addChildNode = useStore((s) => s.addChildNode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = branchName.trim();
    if (name.length === 0) return;
    setLoading(true);
    await addChildNode(parentId, name);
    setLoading(false);
    onClose();
  };

  return (
    <div className="add-branch-modal-overlay" onClick={onClose}>
      <form className="add-branch-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 className="modal-title">🌿 添加新分支</h3>
        <div className="form-group">
          <label className="form-label">分支起始内容（最多20字符）</label>
          <input
            type="text"
            className="form-input"
            placeholder="输入分支段落开头..."
            value={branchName}
            onChange={(e) => setBranchName(e.target.value.slice(0, 20))}
            maxLength={20}
            autoFocus
          />
          <div className="char-count" style={{ textAlign: 'right', marginTop: '4px' }}>
            {branchName.length}/20
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="confirm-btn" disabled={!branchName.trim() || loading}>
            {loading ? '创建中...' : '确认创建'}
          </button>
        </div>
      </form>
    </div>
  );
};

const EditorArea: React.FC = () => {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const storyNodes = useStore((s) => s.storyNodes);
  const currentUser = useStore((s) => s.currentUser);
  const updateNodeText = useStore((s) => s.updateNodeText);
  const lockNode = useStore((s) => s.lockNode);
  const unlockNode = useStore((s) => s.unlockNode);

  const [localText, setLocalText] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const lastSavedRef = useRef('');
  const saveTimerRef = useRef<number | null>(null);
  const lastLockTimeRef = useRef<number>(0);

  const selectedNode = storyNodes.find((n) => n.id === selectedNodeId) || null;

  const getNodePath = useCallback(() => {
    if (!selectedNode) return [];
    const path: StoryNode[] = [];
    let current: StoryNode | undefined = selectedNode;
    while (current) {
      path.unshift(current);
      current = storyNodes.find((n) => n.id === current!.parentId);
    }
    return path;
  }, [selectedNode, storyNodes]);

  useEffect(() => {
    if (selectedNode) {
      setLocalText(selectedNode.text);
      lastSavedRef.current = selectedNode.text;
    } else {
      setLocalText('');
      lastSavedRef.current = '';
    }
  }, [selectedNodeId, selectedNode?.text]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const isLockedByOther =
    selectedNode?.lockOwner != null && selectedNode.lockOwner !== currentUser?.id;
  const isLockedByMe =
    selectedNode?.lockOwner != null && selectedNode.lockOwner === currentUser?.id;

  const handleFocus = async () => {
    if (!selectedNode || !currentUser) return;
    if (isLockedByOther) return;
    const now = Date.now();
    if (now - lastLockTimeRef.current > 60 * 1000) {
      await lockNode(selectedNode.id);
      lastLockTimeRef.current = now;
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLocalText(newText);
    if (!selectedNode || !currentUser) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    const now = Date.now();
    if (now - lastLockTimeRef.current > 60 * 1000 || !isLockedByMe) {
      await lockNode(selectedNode.id);
      lastLockTimeRef.current = now;
    }

    saveTimerRef.current = window.setTimeout(async () => {
      if (newText !== lastSavedRef.current) {
        const success = await updateNodeText(selectedNode.id, newText);
        if (success) {
          lastSavedRef.current = newText;
        }
      }
    }, 500);
  };

  const handleBlur = async () => {
    if (!selectedNode || !currentUser) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (localText !== lastSavedRef.current) {
      await updateNodeText(selectedNode.id, localText);
      lastSavedRef.current = localText;
    }
    if (isLockedByMe) {
      await unlockNode(selectedNode.id);
      lastLockTimeRef.current = 0;
    }
  };

  const getNodeDepth = useCallback(
    (nodeId: string): number => {
      let depth = 0;
      let node = storyNodes.find((n) => n.id === nodeId);
      while (node?.parentId) {
        depth++;
        node = storyNodes.find((n) => n.id === node!.parentId);
      }
      return depth;
    },
    [storyNodes]
  );

  const canAddBranch = selectedNode && getNodeDepth(selectedNode.id) < 4;

  const pathNodes = getNodePath();

  if (!selectedNode) {
    return (
      <main className="editor-area">
        <div className="editor-empty">
          👈 请从左侧选择一个故事节点开始编辑
        </div>
      </main>
    );
  }

  return (
    <main className="editor-area">
      {pathNodes.length > 0 && (
        <div className="node-path">
          {pathNodes.map((node, i) => (
            <span key={node.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span className="path-segment">{getNodeSummary(node.text)}</span>
              {i < pathNodes.length - 1 && <span className="path-arrow">→</span>}
            </span>
          ))}
        </div>
      )}
      <div className="editor-card">
        <textarea
          className="editor-textarea"
          value={localText}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={isLockedByOther}
          placeholder="在这里开始你的创作..."
        />
        {isLockedByOther && (
          <div className="lock-warning">
            ⚠️ 该段落正由 <strong>{selectedNode.lockOwnerName}</strong> 编辑中
          </div>
        )}
        <div className="editor-footer">
          <span className="char-count">共 {localText.length} 字</span>
          <button
            className="add-branch-btn"
            onClick={() => setIsAddModalOpen(true)}
            disabled={!canAddBranch || isLockedByOther}
            title={!canAddBranch ? '已达到最大嵌套层数（5层）' : isLockedByOther ? '节点被锁定' : ''}
          >
            🌿 添加分支
          </button>
        </div>
      </div>
      {isAddModalOpen && (
        <AddBranchModal
          parentId={selectedNode.id}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </main>
  );
};

const StoryEditor = {
  TreePanel,
  EditorArea
};

export default StoryEditor;
