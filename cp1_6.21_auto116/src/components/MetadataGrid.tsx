import React from 'react';
import type { MaterialMeta } from '../types';

interface MetadataGridProps {
  metadata: MaterialMeta[];
  searchKeyword: string;
  onItemClick: (item: MaterialMeta) => void;
}

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const MetadataGrid: React.FC<MetadataGridProps> = ({ metadata, onItemClick }) => {
  if (metadata.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📹</div>
        <div className="empty-state-text">暂无素材数据</div>
      </div>
    );
  }

  return (
    <div className="grid-view">
      {metadata.map(item => (
        <div
          key={item.id}
          className="card"
          onClick={() => onItemClick(item)}
        >
          <div className="card-thumbnail">
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt={item.title} />
            ) : null}
          </div>
          <div className="card-body">
            <div className="card-title">{item.title}</div>
            <div className="card-field">
              <span className="card-field-label">场景:</span>
              <span>{item.scene || '-'}</span>
            </div>
            <div className="card-field">
              <span className="card-field-label">演员:</span>
              <span>{item.actor || '-'}</span>
            </div>
            <div className="card-field">
              <span className="card-field-label">灯光:</span>
              <span>{item.lighting || '-'}</span>
            </div>
            <div className="card-field">
              <span className="card-field-label">时长:</span>
              <span>{item.duration}秒</span>
            </div>
          </div>
          <div className="card-footer">
            {formatTime(item.createTime)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetadataGrid;
