import React, { useState, useEffect } from 'react';
import { ImageData } from '../data/sampleImages';

interface ThumbnailBarProps {
  images: ImageData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: () => void;
  maxImages: number;
}

interface CheckmarkState {
  [key: string]: boolean;
}

const ThumbnailBar: React.FC<ThumbnailBarProps> = ({
  images,
  selectedId,
  onSelect,
  onDelete,
  onUpload,
  maxImages
}) => {
  const [checkmarks, setCheckmarks] = useState<CheckmarkState>({});
  const [prevCount, setPrevCount] = useState(images.length);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (images.length > prevCount && prevCount >= 0) {
      const newImage = images[images.length - 1];
      if (newImage) {
        setCheckmarks((prev) => ({ ...prev, [newImage.id]: true }));
        const timer = setTimeout(() => {
          setCheckmarks((prev) => {
            const next = { ...prev };
            delete next[newImage.id];
            return next;
          });
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
    setPrevCount(images.length);
  }, [images.length, prevCount, images]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (images.length < maxImages) {
      onUpload();
    }
  };

  return (
    <div
      style={{
        padding: '16px 20px',
        background: '#FFFFFF',
        borderBottom: '1px solid #EEE',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (images.length < maxImages) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          maxWidth: '100%',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}
      >
        {images.map((img) => (
          <div
            key={img.id}
            onClick={() => onSelect(img.id)}
            style={{
              position: 'relative',
              width: '140px',
              height: '100px',
              borderRadius: '8px',
              border: `2px solid ${selectedId === img.id ? '#4A90D9' : '#DDD'}`,
              overflow: 'hidden',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'border-color 0.2s ease, transform 0.15s ease',
              background: '#F5F5F5',
              boxShadow: selectedId === img.id ? '0 0 0 3px rgba(74, 144, 217, 0.2)' : 'none'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            }}
          >
            <img
              src={img.url}
              alt={img.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
              loading="lazy"
            />

            {checkmarks[img.id] && (
              <div
                className="checkmark-animation"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(46, 204, 113, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(46, 204, 113, 0.4)'
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(img.id);
              }}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#E74C3C',
                border: '2px solid white',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                lineHeight: 1,
                padding: 0,
                zIndex: 5,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
              aria-label="删除图片"
            >
              ×
            </button>

            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '4px 8px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                color: 'white',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                pointerEvents: 'none'
              }}
            >
              {img.title}
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            onClick={onUpload}
            style={{
              width: '140px',
              height: '100px',
              borderRadius: '8px',
              border: `2px dashed ${dragging ? '#4A90D9' : '#CCC'}`,
              background: dragging ? 'rgba(74, 144, 217, 0.08)' : '#FAFAFA',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: dragging ? '#4A90D9' : '#999',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#4A90D9';
              (e.currentTarget as HTMLButtonElement).style.color = '#4A90D9';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74, 144, 217, 0.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#CCC';
              (e.currentTarget as HTMLButtonElement).style.color = '#999';
              (e.currentTarget as HTMLButtonElement).style.background = '#FAFAFA';
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span style={{ fontSize: '12px' }}>
              {dragging ? '释放上传' : `上传图片 (${images.length}/${maxImages})`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ThumbnailBar;
