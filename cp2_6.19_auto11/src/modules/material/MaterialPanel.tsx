import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Upload, Search, Filter, ChevronLeft, ChevronRight, Film, Clock, Loader2 } from 'lucide-react';
import type { Material } from '../../types';
import { formatTimeShort } from '../../utils/time';
import './MaterialPanel.css';

interface MaterialPanelProps {
  materials: Material[];
  filter: { keyword: string; sortBy: 'name' | 'duration' };
  onUpload: (files: FileList) => void;
  onFilterChange: (filter: { keyword: string; sortBy: 'name' | 'duration' }) => void;
  onDragStart: (material: Material, e: React.DragEvent) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isUploading?: boolean;
}

const MaterialPanel: React.FC<MaterialPanelProps> = ({
  materials,
  filter,
  onUpload,
  onFilterChange,
  onDragStart,
  collapsed,
  onToggleCollapse,
  isUploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [displayedMaterials, setDisplayedMaterials] = useState<Material[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [filterDebounce, setFilterDebounce] = useState(filter);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterDebounce(filter);
    }, 150);
    return () => clearTimeout(timer);
  }, [filter]);

  const filteredMaterials = useMemo(() => {
    let result = [...materials];

    if (filterDebounce.keyword) {
      const keyword = filterDebounce.keyword.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(keyword));
    }

    if (filterDebounce.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterDebounce.sortBy === 'duration') {
      result.sort((a, b) => a.duration - b.duration);
    }

    return result;
  }, [materials, filterDebounce]);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setDisplayedMaterials(filteredMaterials);
      setTimeout(() => setIsAnimating(false), 200);
    }, 150);
    return () => clearTimeout(timer);
  }, [filteredMaterials]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDragEnd = useCallback(() => {
  }, []);

  return (
    <div 
      className={`material-panel ${collapsed ? 'collapsed' : ''}`}
      style={{ width: collapsed ? '48px' : '25%' }}
    >
      <div className="panel-header">
        {!collapsed && (
          <div className="panel-title">
            <Film size={18} />
            <span>素材库</span>
          </div>
        )}
        <button className="collapse-btn" onClick={onToggleCollapse}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="upload-section">
            <div
              className={`drop-zone ${isDraggingOver ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>正在处理视频...</span>
                </>
              ) : (
                <>
                  <Upload size={24} />
                  <span>拖拽视频到此处或点击上传</span>
                  <span className="hint">支持 MP4 格式</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/*"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          <div className="filter-section">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="搜索素材..."
                value={filter.keyword}
                onChange={(e) => onFilterChange({ ...filter, keyword: e.target.value })}
              />
            </div>
            <div className="sort-box">
              <Filter size={16} />
              <select
                value={filter.sortBy}
                onChange={(e) => onFilterChange({ ...filter, sortBy: e.target.value as 'name' | 'duration' })}
              >
                <option value="name">按名称</option>
                <option value="duration">按时长</option>
              </select>
            </div>
          </div>

          <div className={`material-grid ${isAnimating ? 'animating' : ''}`}>
            {displayedMaterials.length === 0 ? (
              <div className="empty-state">
                <Film size={48} opacity={0.3} />
                <p>暂无素材</p>
                <span>上传视频开始创作</span>
              </div>
            ) : (
              displayedMaterials.map((material, index) => (
                <div
                  key={material.id}
                  className="material-card"
                  draggable
                  onDragStart={(e) => onDragStart(material, e)}
                  onDragEnd={handleDragEnd}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="card-thumbnail">
                    {material.thumbnail ? (
                      <img 
                        src={material.thumbnail} 
                        alt={material.name}
                        loading="lazy"
                        className="thumbnail-image"
                      />
                    ) : (
                      <div className="thumbnail-placeholder">
                        <Film size={32} opacity={0.5} />
                      </div>
                    )}
                    <div className="duration-badge">
                      <Clock size={12} />
                      {formatTimeShort(material.duration)}
                    </div>
                  </div>
                  <div className="card-info">
                    <span className="card-name" title={material.name}>
                      {material.name}
                    </span>
                    <span className="card-resolution">
                      {material.width}×{material.height}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(MaterialPanel);
