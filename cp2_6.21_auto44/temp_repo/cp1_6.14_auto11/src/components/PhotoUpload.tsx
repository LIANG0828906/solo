import { useState, useRef, useCallback } from 'react';
import ImageCropper from '../ImageCropper';

interface PhotoUploadProps {
  onPhotoReady: (blob: Blob) => void;
  currentPhotoUrl?: string;
  onRemove?: () => void;
}

export default function PhotoUpload({
  onPhotoReady,
  currentPhotoUrl,
  onRemove,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentPhotoUrl || null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    setSelectedFile(file);
    setShowCropper(true);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleCropConfirm = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setShowCropper(false);
    setSelectedFile(null);
    onPhotoReady(blob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (onRemove) onRemove();
  };

  return (
    <div>
      {showCropper && selectedFile ? (
        <ImageCropper
          file={selectedFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          maxSizeMB={2}
        />
      ) : previewUrl ? (
        <div className="photo-preview">
          <img src={previewUrl} alt="预览" />
          <button
            type="button"
            className="photo-remove"
            onClick={handleRemove}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          className={`photo-upload ${isDragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>
            点击或拖拽图片到此处上传
          </div>
          <div className="photo-upload-hint">
            支持 JPG、PNG 格式，裁剪压缩后不超过 2MB
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
