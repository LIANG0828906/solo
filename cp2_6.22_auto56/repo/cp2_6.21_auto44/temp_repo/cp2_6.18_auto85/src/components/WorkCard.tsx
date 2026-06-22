import React, { useState } from 'react';
import { WorkMaterial } from '@/types';
import { useExhibitionStore } from '@/store/useExhibitionStore';

interface WorkCardProps {
  work: WorkMaterial;
  onRemove?: () => void;
}

export const WorkCard: React.FC<WorkCardProps> = ({ work, onRemove }) => {
  const { setDraggingWork, selectedWorkId, setSelectedWork, removeWorkFromWall, getPlacementByWorkId } = useExhibitionStore();
  const [isHovered, setIsHovered] = useState(false);
  const isPlaced = !!getPlacementByWorkId(work.id);
  const isSelected = selectedWorkId === work.id;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggingWork(work.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', work.id);
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.width = '120px';
    dragImage.style.opacity = '0.9';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 60, 60);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setDraggingWork(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWork(isSelected ? null : work.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={`work-card ${isSelected ? 'ring-2' : ''}`}
      style={{
        outline: isSelected ? '2px solid #A3E635' : undefined,
        outlineOffset: '2px',
      }}
    >
      <div style={{ position: 'relative' }}>
        <img src={work.imageUrl} alt={work.title} className="work-card-image" draggable={false} />
        {isPlaced && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: 'linear-gradient(135deg, #22C55E, #4ADE80)',
              color: 'white',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            已布展
          </div>
        )}
        {isHovered && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeWorkFromWall(work.id);
              onRemove();
            }}
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              background: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              border: 'none',
              width: 22,
              height: 22,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
      <div className="work-card-title" title={work.title}>
        {work.title || '未命名作品'}
      </div>
    </div>
  );
};
