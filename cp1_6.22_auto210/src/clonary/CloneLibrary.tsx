import React, { useState, useEffect, useRef } from 'react';
import { PathData, PathPoint } from '../types';
import { StorageService } from './StorageService';
import { PathManager } from '../editor/PathManager';

interface CloneLibraryProps {
  onLoadPath: (points: PathPoint[]) => void;
  currentPoints: PathPoint[];
}

const CloneLibrary: React.FC<CloneLibraryProps> = ({ onLoadPath, currentPoints }) => {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPaths(StorageService.getAll());
  }, []);

  const renderThumbnail = (points: PathPoint[]) => {
    const manager = new PathManager(points);
    const pathStr = manager.serialize();
    const bbox = manager.getBoundingBox();

    if (!bbox || !pathStr) {
      return (
        <svg width="80" height="80" viewBox="0 0 80 80">
          <rect x="0" y="0" width="80" height="80" fill="#374151" rx="4" />
        </svg>
      );
    }

    const padding = 10;
    const width = bbox.maxX - bbox.minX || 1;
    const height = bbox.maxY - bbox.minY || 1;
    const scale = Math.min((80 - 2 * padding) / width, (80 - 2 * padding) / height);
    const offsetX = padding + (80 - 2 * padding - width * scale) / 2 - bbox.minX * scale;
    const offsetY = padding + (80 - 2 * padding - height * scale) / 2 - bbox.minY * scale;

    return (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <rect x="0" y="0" width="80" height="80" fill="#374151" rx="4" />
        <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
          <path
            d={pathStr}
            stroke="#6366F1"
            strokeWidth={2 / scale}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    );
  };

  const handleLoadPath = (points: PathPoint[]) => {
    onLoadPath(points);
  };

  const handleSave = () => {
    if (currentPoints.length === 0) return;
    setShowSaveDialog(true);
    setSaveName(`路径 ${paths.length + 1}`);
  };

  const confirmSave = () => {
    if (!saveName.trim() || currentPoints.length === 0) return;
    StorageService.create(saveName.trim(), currentPoints);
    setPaths(StorageService.getAll());
    setShowSaveDialog(false);
    setSaveName('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.delete(id);
    setPaths(StorageService.getAll());
  };

  const startRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(currentName);
  };

  const confirmRename = () => {
    if (editingId && editingName.trim()) {
      StorageService.rename(editingId, editingName.trim());
      setPaths(StorageService.getAll());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      const newPaths = [...paths];
      const [removed] = newPaths.splice(draggedIndex, 1);
      newPaths.splice(index, 0, removed);
      setPaths(newPaths);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      StorageService.saveAll(paths);
    }
    setDraggedIndex(null);
  };

  const containerStyle: React.CSSProperties = {
    width: 280,
    height: '100%',
    backgroundColor: '#1F2937',
    color: '#F3F4F6',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid #374151',
    fontSize: 16,
    fontWeight: 600,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const saveBtnStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: 12,
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontWeight: 500
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: 12
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginBottom: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    opacity: draggedIndex !== null ? 0.6 : 1
  };

  const nameStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 13,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #6366F1',
    backgroundColor: '#1F2937',
    color: '#F3F4F6',
    outline: 'none'
  };

  const actionBtnStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: 11,
    backgroundColor: '#4B5563',
    color: '#F3F4F6',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  };

  const dialogOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 12,
    minWidth: 280,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>克隆库</span>
        <button
          style={saveBtnStyle}
          onClick={handleSave}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4F46E5';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366F1';
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
          }}
        >
          + 保存路径
        </button>
      </div>

      <div style={listStyle}>
        {paths.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: 40 }}>
            暂无保存的路径<br />
            点击右上角保存当前路径
          </div>
        ) : (
          paths.map((path, index) => (
            <div
              key={path.id}
              draggable
              onDragStart={(e) => handleDragStart(index, e)}
              onDragOver={(e) => handleDragOver(index, e)}
              onDragEnd={handleDragEnd}
              style={itemStyle}
              onClick={() => handleLoadPath(path.points)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#4B5563';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#374151';
              }}
            >
              <div style={{ flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                {renderThumbnail(path.points)}
              </div>

              {editingId === path.id ? (
                <input
                  style={inputStyle}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={confirmRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename();
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditingName('');
                    }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  maxLength={20}
                />
              ) : (
                <span style={nameStyle} title={path.name}>{path.name}</span>
              )}

              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  style={actionBtnStyle}
                  onClick={(e) => startRename(path.id, path.name, e)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366F1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4B5563';
                  }}
                >
                  重命名
                </button>
                <button
                  style={{ ...actionBtnStyle, backgroundColor: '#991B1B' }}
                  onClick={(e) => handleDelete(path.id, e)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#991B1B';
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showSaveDialog && (
        <div style={dialogOverlayStyle} onClick={() => setShowSaveDialog(false)}>
          <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>保存路径</h3>
            <input
              style={{ ...inputStyle, width: '100%', fontSize: 14, padding: '8px 12px' }}
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="请输入路径名称（最多20字符）"
              maxLength={20}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                style={{ ...actionBtnStyle, padding: '8px 16px', fontSize: 13 }}
                onClick={() => setShowSaveDialog(false)}
              >
                取消
              </button>
              <button
                style={{ ...actionBtnStyle, padding: '8px 16px', fontSize: 13, backgroundColor: '#6366F1' }}
                onClick={confirmSave}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4F46E5';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366F1';
                }}
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".svg" style={{ display: 'none' }} />
    </div>
  );
};

export default CloneLibrary;
