import React, { useState, useRef, useCallback } from 'react';

interface TextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageUploaderProps {
  onUploadComplete: (data: {
    documentId: string;
    textBlocks: TextBlock[];
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
  }) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadComplete }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return '仅支持 PNG、JPG 格式的图片';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '文件大小不能超过 5MB';
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            onUploadComplete(response);
          } catch {
            setError('解析响应数据失败');
          }
        } else {
          setError('上传失败，请重试');
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setError('网络错误，请重试');
      };

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    },
    [validateFile, onUploadComplete]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadFile]
  );

  const handleClick = useCallback(() => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isUploading]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadFile(files[0]);
      }
      e.target.value = '';
    },
    [uploadFile]
  );

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: '60%',
        background: isDragOver ? '#f0f4ff' : '#f8f9fa',
        borderRadius: 12,
        border: `2px dashed ${isDragOver ? '#667eea' : '#ccc'}`,
        transition: 'all 0.3s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        cursor: isUploading ? 'default' : 'pointer',
        position: 'relative',
        margin: '0 auto',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {!isUploading && (
        <>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
          </svg>
          <p style={{ marginTop: 20, fontSize: 16, color: '#333' }}>
            拖拽手写稿图片到此处或点击上传
          </p>
          <p style={{ marginTop: 8, fontSize: 13, color: '#999' }}>
            支持 PNG、JPG 格式，最大 5MB
          </p>
        </>
      )}

      {isUploading && (
        <div style={{ width: '80%', maxWidth: 400 }}>
          <div
            style={{
              width: '100%',
              height: 8,
              background: '#e9ecef',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: 4,
                transition: 'width 0.2s',
              }}
            />
          </div>
          <p
            style={{
              textAlign: 'center',
              marginTop: 12,
              fontSize: 14,
              color: '#667eea',
            }}
          >
            {progress}%
          </p>
        </div>
      )}

      {error && (
        <p style={{ marginTop: 12, fontSize: 13, color: 'red' }}>{error}</p>
      )}
    </div>
  );
};

export default ImageUploader;
