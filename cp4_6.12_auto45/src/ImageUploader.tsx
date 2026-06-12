import React, { useRef, useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImageChange: (imageDataUrl: string, file: File) => void;
  imageUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, imageUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '只支持 JPG、PNG、WebP 格式的图片';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '图片大小不能超过 5MB';
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result, file);
      };
      reader.onerror = () => {
        setError('图片读取失败，请重试');
      };
      reader.readAsDataURL(file);
    },
    [onImageChange, validateFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div style={styles.container}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          ...styles.uploadContainer,
          ...(isDragging ? styles.uploadContainerHover : {}),
          borderStyle: isDragging ? 'solid' : imageUrl ? 'none' : 'dashed',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          style={styles.hiddenInput}
        />

        {imageUrl ? (
          <div style={styles.imageWrapper}>
            <img
              src={imageUrl}
              alt="上传的图片"
              style={styles.previewImage}
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <div style={styles.placeholderContent}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: 'var(--border-color)', marginBottom: 16 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p style={styles.placeholderText}>
              点击或拖拽图片到此处上传
            </p>
            <p style={styles.placeholderHint}>支持 JPG / PNG / WebP，最大 5MB</p>
          </div>
        )}
      </div>

      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
  },
  hiddenInput: {
    display: 'none',
  },
  uploadContainer: {
    width: '100%',
    maxWidth: 440,
    height: 440,
    backgroundColor: '#e8e8e8',
    borderRadius: 12,
    border: '2px dashed #ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    margin: '0 auto',
  },
  uploadContainerHover: {
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    backgroundColor: '#d8d8d8',
  },
  imageWrapper: {
    width: 400,
    height: 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 8,
    animation: 'fadeIn 0.3s ease-in-out',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  placeholderContent: {
    textAlign: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  placeholderHint: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
  },
};

export default ImageUploader;
