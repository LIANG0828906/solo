import React, { useCallback, useRef, useState } from 'react';

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
  previewUrl: string | null;
  fileName: string | null;
  isIdentifying: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  onImageSelected,
  previewUrl,
  fileName,
  isIdentifying,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  return (
    <div className="upload-container">
      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {previewUrl ? (
          <div className="preview-wrapper">
            <img src={previewUrl} alt="preview" className="preview-image" />
            {fileName && <p className="preview-filename">{fileName}</p>}
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="cloud-icon">
              <div className="cloud-shape cloud-main" />
              <div className="cloud-shape cloud-left" />
              <div className="cloud-shape cloud-right" />
              <div className="cloud-arrow">
                <div className="arrow-line" />
                <div className="arrow-head" />
              </div>
            </div>
            <p className="upload-text">拖拽或点击上传植物照片</p>
          </div>
        )}
        {isIdentifying && (
          <div className="identifying-overlay">
            <div className="spinner" />
            <span>识别中...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
