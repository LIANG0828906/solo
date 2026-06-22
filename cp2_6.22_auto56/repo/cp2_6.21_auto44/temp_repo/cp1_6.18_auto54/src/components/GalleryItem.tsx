import React from 'react';
import type { ConstellationData } from '@/types';
import { Trash2 } from 'lucide-react';

interface GalleryItemProps {
  constellation: ConstellationData;
  isActive: boolean;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ constellation, isActive, onClick, onDelete }) => {
  return (
    <div
      className={`gallery-item ${isActive ? 'gallery-item--active' : ''}`}
      onClick={() => onClick(constellation.id)}
    >
      <div className="gallery-item__thumb-wrapper">
        <img
          src={constellation.thumbnail}
          alt={constellation.name}
          className="gallery-item__thumbnail"
        />
      </div>
      <div className="gallery-item__footer">
        <span className="gallery-item__name">{constellation.name}</span>
        <button
          className="gallery-item__delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(constellation.id);
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default GalleryItem;
