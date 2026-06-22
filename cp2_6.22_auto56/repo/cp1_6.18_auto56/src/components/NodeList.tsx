import React, { useCallback, useMemo } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { ideaService } from '@/services/ideaService';
import type { SortType } from '@/shared/types';

export const NodeList: React.FC = () => {
  const {
    showNodeList,
    nodes,
    searchQuery,
    sortType,
    selectedNodeId,
    toggleNodeList,
    setSearchQuery,
    setSortType,
    selectNode,
    setPan,
    setZoom,
    setShowNodePanel,
    setPanelNodeId,
    setPanelPosition,
    setShowDeleteConfirm,
    setDeleteNodeId,
  } = useBoardStore();

  const filteredAndSortedNodes = useMemo(() => {
    let result = [...nodes];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (node) =>
          node.title.toLowerCase().includes(query) ||
          node.content.toLowerCase().includes(query)
      );
    }

    if (sortType === 'time') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      result.sort((a, b) => b.votes.up - a.votes.up);
    }

    return result;
  }, [nodes, searchQuery, sortType]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      selectNode(nodeId);

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const newPanX = centerX - node.x * 1 - node.width / 2;
      const newPanY = centerY - node.y * 1 - node.height / 2;

      setZoom(1);
      setPan({ x: newPanX, y: newPanY });

      if (window.innerWidth < 768) {
        toggleNodeList();
      }
    },
    [nodes, selectNode, setPan, setZoom, toggleNodeList]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const screenX = node.x * 1 + node.width / 2;
      const screenY = node.y * 1 + node.height / 2;

      setPanelNodeId(nodeId);
      setPanelPosition({ x: screenX, y: screenY });
      setShowNodePanel(true);
    },
    [nodes, setPanelNodeId, setPanelPosition, setShowNodePanel]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setDeleteNodeId(nodeId);
      setShowDeleteConfirm(true);
    },
    [setDeleteNodeId, setShowDeleteConfirm]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  const handleSortChange = useCallback(
    (type: SortType) => {
      setSortType(type);
    },
    [setSortType]
  );

  if (!showNodeList) return null;

  return (
    <>
      <div className="node-list-backdrop" onClick={toggleNodeList} />
      <div className={`node-list-panel ${showNodeList ? 'open' : ''}`}>
        <div className="panel-header">
          <h3 className="panel-header-title">想法列表</h3>
          <button
            className="close-btn"
            onClick={toggleNodeList}
            title="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M21 21l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="搜索想法..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="sort-tabs">
          <button
            className={`sort-tab ${sortType === 'time' ? 'active' : ''}`}
            onClick={() => handleSortChange('time')}
          >
            最新
          </button>
          <button
            className={`sort-tab ${sortType === 'votes' ? 'active' : ''}`}
            onClick={() => handleSortChange('votes')}
          >
            热门
          </button>
        </div>
        <div className="node-list-content">
          {filteredAndSortedNodes.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                <path
                  d="M9 12h6M12 9v6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
              <p>暂无想法</p>
              <span>双击画布创建第一个想法</span>
            </div>
          ) : (
            filteredAndSortedNodes.map((node) => (
              <div
                key={node.id}
                className={`node-list-item ${
                  selectedNodeId === node.id ? 'selected' : ''
                }`}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className="node-item-header">
                  <h4 className="node-item-title">{node.title}</h4>
                  <div className="node-item-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={(e) => handleEdit(e, node.id)}
                      title="编辑"
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path
                          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => handleDelete(e, node.id)}
                      title="删除"
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path
                          d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="node-item-content">{node.content}</p>
                <div className="node-item-footer">
                  <div className="vote-badge up">
                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                      <path
                        d="M12 4L4 15h5v5h6v-5h5L12 4z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>{node.votes.up}</span>
                  </div>
                  <div className="vote-badge down">
                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                      <path
                        d="M12 20L20 9h-5V4H9v5H4l8 11z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>{node.votes.down}</span>
                  </div>
                  <span className="node-item-date">
                    {new Date(node.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
