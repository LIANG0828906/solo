import React from 'react';
import { Trash2, Trash, Check, Layers } from 'lucide-react';
import { usePathStore } from '../store/usePathStore';

interface PathPanelProps {
  className?: string;
}

export const PathPanel: React.FC<PathPanelProps> = ({ className = '' }) => {
  const { paths, selectedPathId, selectPath, deletePath, clearPaths } = usePathStore();

  const handlePathClick = (e: React.MouseEvent, pathId: string) => {
    e.stopPropagation();
    selectPath(selectedPathId === pathId ? null : pathId);
  };

  const handleDeletePath = (e: React.MouseEvent, pathId: string) => {
    e.stopPropagation();
    deletePath(pathId);
  };

  const handleClearAll = () => {
    if (paths.length > 0 && window.confirm('确定要清空所有路径吗？')) {
      clearPaths();
    }
  };

  return (
    <div className={`path-panel glass-panel ${className}`}>
      <div className="path-panel-header">
        <div className="header-title">
          <Layers size={18} />
          <span>路径管理</span>
          <span className="path-count">{paths.length}</span>
        </div>
        <button
          className="clear-btn"
          onClick={handleClearAll}
          disabled={paths.length === 0}
          title="清空所有路径"
        >
          <Trash size={16} />
          <span>清空</span>
        </button>
      </div>

      <div className="path-list">
        {paths.length === 0 ? (
          <div className="empty-state">
            <p>暂无检测到的路径</p>
            <p className="hint">上传图片后点击"生成路径"按钮</p>
          </div>
        ) : (
          paths.map((path, index) => (
            <div
              key={path.id}
              className={`path-item ${selectedPathId === path.id ? 'selected' : ''}`}
              onClick={e => handlePathClick(e, path.id)}
            >
              <div className="path-thumbnail">
                {path.thumbnail ? (
                  <img src={path.thumbnail} alt={`Path ${index + 1}`} />
                ) : (
                  <div className="thumbnail-placeholder" style={{ borderColor: path.color }} />
                )}
                {selectedPathId === path.id && (
                  <div className="selected-badge">
                    <Check size={12} />
                  </div>
                )}
              </div>

              <div className="path-info">
                <div className="path-name">
                  <span className="path-color-dot" style={{ backgroundColor: path.color }} />
                  路径 {index + 1}
                </div>
                <div className="path-meta">
                  <span>{path.nodes.length} 节点</span>
                  <span>{path.length}px</span>
                  {path.isClosed && <span className="closed-badge">闭合</span>}
                </div>
              </div>

              <button
                className="delete-btn"
                onClick={e => handleDeletePath(e, path.id)}
                title="删除此路径"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
