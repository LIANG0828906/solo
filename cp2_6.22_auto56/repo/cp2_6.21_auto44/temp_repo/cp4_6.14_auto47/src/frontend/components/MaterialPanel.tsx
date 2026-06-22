import React, { useState, useRef } from 'react';
import { useCollage } from '../context/CollageContext';

const sampleImages = [
  {
    id: 1,
    name: '山水',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  },
  {
    id: 2,
    name: '城市',
    url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=400&fit=crop',
  },
  {
    id: 3,
    name: '森林',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
  },
  {
    id: 4,
    name: '海洋',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
  },
  {
    id: 5,
    name: '花朵',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
  },
  {
    id: 6,
    name: '建筑',
    url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=400&fit=crop',
  },
  {
    id: 7,
    name: '人物',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  },
  {
    id: 8,
    name: '抽象',
    url: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=400&h=400&fit=crop',
  },
];

const MaterialPanel: React.FC = () => {
  const { addLayer } = useCollage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const maxSize = 300;
            let width = img.width;
            let height = img.height;
            if (width > height && width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
            addLayer(event.target?.result as string, width, height);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
  };

  const handleAddImage = (url: string, name: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxSize = 300;
      let width = img.width;
      let height = img.height;
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      addLayer(url, width, height);
    };
    img.src = url;
  };

  return (
    <div
      className="material-panel"
      style={{
        width: 250,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        margin: 12,
        marginRight: 0,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#fff',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>🖼️</span>
        <span>素材库</span>
      </div>

      <button
        onClick={handleUploadClick}
        style={{
          width: '100%',
          minHeight: 44,
          padding: '10px 16px',
          border: '2px dashed #4b5563',
          borderRadius: 8,
          backgroundColor: 'transparent',
          color: '#d1d5db',
          cursor: 'pointer',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 12,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.borderColor = '#4ecdc4';
          (e.target as HTMLButtonElement).style.color = '#4ecdc4';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.borderColor = '#4b5563';
          (e.target as HTMLButtonElement).style.color = '#d1d5db';
        }}
      >
        <span>📤</span>
        <span>上传素材</span>
      </button>

      <div
        style={{
          fontSize: 12,
          color: '#9ca3af',
          marginBottom: 8,
        }}
      >
        示例素材
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          paddingRight: 4,
        }}
      >
        {sampleImages.map((img) => (
          <div
            key={img.id}
            onClick={() => handleAddImage(img.url, img.name)}
            style={{
              aspectRatio: '1',
              borderRadius: 8,
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              backgroundColor: '#111827',
              transition: 'all 0.2s',
              border: '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
              (e.currentTarget as HTMLDivElement).style.borderColor = '#4ecdc4';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
            }}
          >
            <img
              src={img.url}
              alt={img.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              draggable={false}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: 11,
                padding: '4px 6px',
                textAlign: 'center',
              }}
            >
              {img.name}
            </div>
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default MaterialPanel;
