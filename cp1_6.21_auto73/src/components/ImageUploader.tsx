import React, { useState, useRef, useCallback } from 'react';

interface ImageUploaderProps {
  onUpload: (base64Image: string) => void;
  currentImage?: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, currentImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert('仅支持 JPG 和 PNG 格式图片');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => setProgress(0);
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onload = () => {
      setProgress(100);
      onUpload(reader.result as string);
      setTimeout(() => setProgress(0), 500);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div>
      <h2>上传草稿</h2>
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        {currentImage ? (
          <img src={currentImage} alt="草稿预览" className="upload-preview" />
        ) : (
          <>
            <div className="upload-icon">✏️</div>
            <div className="upload-text">拖拽或点击上传手绘草稿</div>
            <div className="upload-hint">支持 JPG / PNG 格式，最大 10MB</div>
          </>
        )}
        {progress > 0 && progress < 100 && (
          <div className="upload-progress" style={{ width: `${progress}%` }} />
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
