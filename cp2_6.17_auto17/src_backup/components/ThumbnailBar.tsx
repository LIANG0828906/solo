import { useRef, useState } from 'react';
import { Page } from '../types';

interface ThumbnailBarProps {
  pages: Page[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onRemovePage: (pageId: string) => void;
  onReorderPages: (fromIndex: number, toIndex: number) => void;
}

export default function ThumbnailBar({
  pages,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onRemovePage,
  onReorderPages,
}: ThumbnailBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      onReorderPages(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      style={{
        height: 110,
        background: '#FFF',
        borderTop: '1px solid #E0E0E0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
      }}
    >
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          alignItems: 'center',
          flex: 1,
          padding: '6px 0',
        }}
      >
        {pages.map((page, index) => (
          <div
            key={page.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectPage(index)}
            style={{
              width: 120,
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all 0.2s ease-out',
              transform: dragOverIndex === index ? 'scale(1.08)' : 'translateY(0)',
              opacity: dragIndex === index ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (dragIndex === null) {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (dragIndex === null) {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }
            }}
          >
            <div
              style={{
                width: 120,
                height: 60,
                borderRadius: 8,
                background: page.imageUrl
                  ? `url(${page.imageUrl}) center/cover`
                  : '#E8E0D8',
                border:
                  currentPageIndex === index
                    ? '2.5px solid #FF6B6B'
                    : '2px solid #E0E0E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                boxShadow:
                  currentPageIndex === index
                    ? '0 2px 10px rgba(255, 107, 107, 0.3)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {!page.imageUrl && (
                <span style={{ fontSize: 20, opacity: 0.5 }}>📄</span>
              )}
              {pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePage(page.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'rgba(255,107,107,0.85)',
                    color: '#FFF',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = '0';
                  }}
                >
                  ×
                </button>
              )}
              {page.hotspots.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 4,
                    background: 'rgba(78,205,196,0.85)',
                    borderRadius: 6,
                    padding: '1px 5px',
                    fontSize: 9,
                    color: '#FFF',
                    fontWeight: 600,
                  }}
                >
                  {page.hotspots.length}热点
                </div>
              )}
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: 11,
                color: currentPageIndex === index ? '#FF6B6B' : '#B2BEC3',
                marginTop: 4,
                fontWeight: currentPageIndex === index ? 600 : 400,
              }}
            >
              {page.pageNumber}
            </div>
          </div>
        ))}

        <div
          onClick={onAddPage}
          style={{
            width: 120,
            height: 60,
            flexShrink: 0,
            borderRadius: 8,
            border: '2px dashed #D0D0D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease-out',
            color: '#B2BEC3',
            fontSize: 24,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#4ECDC4';
            (e.currentTarget as HTMLDivElement).style.color = '#4ECDC4';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#D0D0D0';
            (e.currentTarget as HTMLDivElement).style.color = '#B2BEC3';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          }}
        >
          +
        </div>
      </div>
    </div>
  );
}
