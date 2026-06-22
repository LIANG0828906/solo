import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, Clock, Layers } from 'lucide-react';
import { useSpriteStore } from '@/store/spriteStore';
import { imageDataToDataURL } from '@/utils/canvasUtils';
import './FrameList.css';

export const FrameList: React.FC = () => {
  const {
    frames,
    selectedFrameIds,
    selectFrame,
    clearSelection,
    renameFrame,
    deleteFrames,
    setBulkDuration,
    addToTimeline,
  } = useSpriteStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [bulkDuration, setBulkDurationInput] = useState('0.1');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleFrameClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectFrame(id, e.ctrlKey || e.metaKey);
  }, [selectFrame]);

  const handleDoubleClick = useCallback((frame: { id: string; name: string }) => {
    setEditingId(frame.id);
    setEditName(frame.name);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (editingId && editName.trim()) {
      renameFrame(editingId, editName.trim());
    }
    setEditingId(null);
  }, [editingId, editName, renameFrame]);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      deleteFrames([id]);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  }, [deleteFrames]);

  const handleBulkDelete = useCallback(() => {
    if (selectedFrameIds.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedFrameIds.length} 帧吗？`)) return;
    setDeletingIds(new Set(selectedFrameIds));
    setTimeout(() => {
      deleteFrames(selectedFrameIds);
      setDeletingIds(new Set());
    }, 200);
  }, [selectedFrameIds, deleteFrames]);

  const handleBulkDuration = useCallback(() => {
    if (selectedFrameIds.length === 0) return;
    const duration = parseFloat(bulkDuration);
    if (isNaN(duration) || duration <= 0) {
      alert('请输入有效的持续时间');
      return;
    }
    setBulkDuration(selectedFrameIds, duration);
  }, [selectedFrameIds, bulkDuration, setBulkDuration]);

  const handleAddAllToTimeline = useCallback(() => {
    frames.forEach((f) => addToTimeline(f.id));
  }, [frames, addToTimeline]);

  const handleContainerClick = () => {
    clearSelection();
  };

  return (
    <div className="frame-list-panel">
      <div className="panel-header">
        <Layers size={16} />
        <span>帧列表</span>
        <span className="frame-count">{frames.length} 帧</span>
      </div>

      {selectedFrameIds.length > 0 && (
        <div className="bulk-actions">
          <span className="bulk-info">已选 {selectedFrameIds.length} 帧</span>
          <div className="bulk-duration">
            <Clock size={12} />
            <input
              type="number"
              value={bulkDuration}
              onChange={(e) => setBulkDurationInput(e.target.value)}
              step="0.05"
              min="0.01"
            />
            <span>秒</span>
          </div>
          <button className="btn-small" onClick={handleBulkDuration}>
            设置时长
          </button>
          <button className="btn-small btn-danger" onClick={handleBulkDelete}>
            <Trash2 size={12} />
            删除
          </button>
        </div>
      )}

      <div className="frame-list-actions">
        <button className="btn-secondary btn-full" onClick={handleAddAllToTimeline} disabled={frames.length === 0}>
          添加全部到时间轴
        </button>
      </div>

      <div className="frame-grid" onClick={handleContainerClick}>
        {frames.map((frame, index) => {
          const isSelected = selectedFrameIds.includes(frame.id);
          const isDeleting = deletingIds.has(frame.id);
          const dataUrl = imageDataToDataURL(frame.imageData);

          return (
            <div
              key={frame.id}
              className={`frame-thumb ${isSelected ? 'selected' : ''} ${isDeleting ? 'deleting' : ''}`}
              onClick={(e) => handleFrameClick(frame.id, e)}
              onDoubleClick={() => handleDoubleClick(frame)}
              title={`${frame.name} (${frame.width}x${frame.height})`}
            >
              <div className="frame-thumb-image">
                <img src={dataUrl} alt={frame.name} />
              </div>
              <div className="frame-thumb-info">
                {editingId === frame.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="frame-name">{frame.name}</span>
                )}
                <span className="frame-duration">{frame.duration}s</span>
              </div>
              <button
                className="frame-delete-btn"
                onClick={(e) => handleDelete(frame.id, e)}
                title="删除帧"
              >
                <Trash2 size={12} />
              </button>
              <div className="frame-index">{String(index + 1).padStart(2, '0')}</div>
            </div>
          );
        })}

        {frames.length === 0 && (
          <div className="empty-state">
            <Layers size={32} />
            <p>暂无帧</p>
            <p className="empty-hint">导入精灵表并切割生成帧</p>
          </div>
        )}
      </div>
    </div>
  );
};
