import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { StickerType } from '../types';
import { getStickerSVG, formatTime } from '../utils/mediaUtils';

interface DraggableClipAssetProps {
  id: string;
  name: string;
  duration: number;
}

export const DraggableClipAsset: React.FC<DraggableClipAssetProps> = ({ id, name, duration }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="asset-item"
      {...listeners}
      {...attributes}
    >
      <div className="asset-item-name">{name}</div>
      <div className="asset-item-meta">{formatTime(duration)}</div>
      <div className="asset-color-bar" />
    </div>
  );
};

interface DraggableStickerAssetProps {
  id: string;
  type: StickerType;
}

export const DraggableStickerAsset: React.FC<DraggableStickerAssetProps> = ({ id, type }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sticker-item"
      {...listeners}
      {...attributes}
      title={type}
      dangerouslySetInnerHTML={{ __html: getStickerSVG(type) }}
    />
  );
};
