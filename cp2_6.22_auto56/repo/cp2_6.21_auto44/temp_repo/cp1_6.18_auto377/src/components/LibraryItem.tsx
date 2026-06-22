import React from 'react';
import type { LibraryItem } from '../types';
import { LibraryProvider } from '../modules/library/LibraryProvider';

interface Props {
  item: LibraryItem;
}

export const LibraryItemView: React.FC<Props> = ({ item }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = () => {
    LibraryProvider.addToCanvas(item);
  };

  const renderContent = () => {
    if (item.type === 'fill') {
      return (
        <div
          style={{
            width: '70%',
            height: '70%',
            borderRadius: 8,
            backgroundColor: item.fillColor,
            border: item.fillColor === '#FFFFFF' ? '1px solid #e0e0e0' : 'none',
          }}
        />
      );
    }
    if (item.src) {
      return (
        <img
          src={item.src}
          alt={item.name}
          draggable={false}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        />
      );
    }
    return <span style={{ fontSize: 12 }}>{item.name}</span>;
  };

  return (
    <div
      className="library-item"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      title={item.name}
    >
      {renderContent()}
    </div>
  );
};

export default LibraryItemView;
