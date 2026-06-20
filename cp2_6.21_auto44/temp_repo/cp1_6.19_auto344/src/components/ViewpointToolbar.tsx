import { useState, useEffect, useCallback } from 'react';
import { Camera, Plus, Trash2, Eye } from 'lucide-react';
import { Viewpoint } from '@/types';

interface ViewpointToolbarProps {
  viewpoints: Viewpoint[];
  onSaveViewpoint: () => void;
  onLoadViewpoint: (viewpoint: Viewpoint) => void;
  onDeleteViewpoint: (id: string) => void;
  isAnimating: boolean;
}

export default function ViewpointToolbar({
  viewpoints,
  onSaveViewpoint,
  onLoadViewpoint,
  onDeleteViewpoint,
  isAnimating,
}: ViewpointToolbarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    if (viewpoints.length < 4) {
      onSaveViewpoint();
    }
  }, [viewpoints.length, onSaveViewpoint]);

  return (
    <div className="viewpoint-toolbar">
      <button
        className="toolbar-btn save-btn"
        onClick={handleSave}
        disabled={viewpoints.length >= 4 || isAnimating}
        title={viewpoints.length >= 4 ? '最多保存4个视点' : '保存当前视点'}
      >
        <Camera size={16} />
        <span>保存视点</span>
        <span className="count">{viewpoints.length}/4</span>
      </button>

      <div className="viewpoints-list">
        {viewpoints.map((vp, index) => (
          <div
            key={vp.id}
            className={`viewpoint-item ${hoveredId === vp.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredId(vp.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <button
              className="viewpoint-thumbnail"
              onClick={() => !isAnimating && onLoadViewpoint(vp)}
              disabled={isAnimating}
              title={vp.name}
            >
              {vp.thumbnail ? (
                <img src={vp.thumbnail} alt={vp.name} />
              ) : (
                <div className="thumbnail-placeholder">
                  <Eye size={20} />
                </div>
              )}
              <span className="viewpoint-index">{index + 1}</span>
            </button>

            {hoveredId === vp.id && (
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteViewpoint(vp.id);
                }}
                title="删除视点"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}

        {Array.from({ length: 4 - viewpoints.length }).map((_, i) => (
          <div key={`empty-${i}`} className="viewpoint-item empty">
            <div className="viewpoint-thumbnail empty-slot">
              <Plus size={20} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .viewpoint-toolbar {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1000;
        }

        .toolbar-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #333;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .toolbar-btn:hover:not(:disabled) {
          background: #555;
        }

        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-btn .count {
          padding: 2px 6px;
          background: rgba(79, 195, 247, 0.3);
          color: #4FC3F7;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .viewpoints-list {
          display: flex;
          gap: 8px;
        }

        .viewpoint-item {
          position: relative;
        }

        .viewpoint-thumbnail {
          position: relative;
          width: 60px;
          height: 45px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: #222;
          cursor: pointer;
          padding: 0;
          transition: all 0.2s ease;
        }

        .viewpoint-thumbnail:hover:not(:disabled) {
          border-color: #4FC3F7;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
        }

        .viewpoint-thumbnail:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .viewpoint-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
        }

        .viewpoint-thumbnail.empty-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #444;
          border-style: dashed;
          cursor: default;
        }

        .viewpoint-thumbnail.empty-slot:hover {
          border-color: rgba(255, 255, 255, 0.2);
          transform: none;
          box-shadow: none;
        }

        .viewpoint-index {
          position: absolute;
          bottom: 2px;
          right: 4px;
          padding: 1px 4px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 2px;
        }

        .delete-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e53935;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.2s ease;
          z-index: 10;
        }

        .viewpoint-item:hover .delete-btn {
          opacity: 1;
          transform: scale(1);
        }

        .delete-btn:hover {
          background: #c62828;
        }

        @media (max-width: 768px) {
          .viewpoint-toolbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
