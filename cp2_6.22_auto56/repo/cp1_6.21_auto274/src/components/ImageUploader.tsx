import React, { useCallback, useRef, useState } from 'react';

interface ImageUploaderProps {
  onImageSelect: (image: HTMLImageElement, imageData: ImageData) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('仅支持 JPG 和 PNG 格式');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          onImageSelect(img, imageData);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          width: '100%',
          padding: '60px 32px',
          border: `2px dashed ${isDragging ? '#6366F1' : '#334155'}`,
          borderRadius: '16px',
          backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : '#1E293B',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease-out'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          opacity: 0.8
        }}>
          📷
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#F8FAFC',
          marginBottom: '8px'
        }}>
          点击或拖拽上传人像照片
        </div>
        <div style={{
          fontSize: '13px',
          color: '#94A3B8'
        }}>
          支持 JPG / PNG 格式，最大 5MB
        </div>
      </div>
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '10px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#F87171',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
