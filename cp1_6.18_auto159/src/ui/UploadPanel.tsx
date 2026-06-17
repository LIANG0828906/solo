import React, { useCallback, useRef, useState } from 'react';
import { useImageStore, formatFileSize } from '@/stores/imageStore';

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getImageSize = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
};

const UploadPanel: React.FC = () => {
  const [dragover, setDragover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { images, selectedImageId, addImages, removeImage, selectImage } = useImageStore();

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return;

      const processed = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await fileToDataUrl(file);
          const { width, height } = await getImageSize(dataUrl);
          return { file, dataUrl, width, height };
        })
      );

      addImages(processed);
    },
    [addImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragover(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragover(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragover(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleImageItemDragStart = (e: React.DragEvent<HTMLDivElement>, imageId: string) => {
    e.dataTransfer.setData('imageId', imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="upload-panel">
      <div>
        <h1 className="app-title">光影滤镜相册</h1>
        <p className="app-subtitle">上传照片 · 实时滤镜 · 智能分类</p>
      </div>

      <div>
        <div className="section-title">上传图片</div>
        <div
          className={`upload-area ${dragover ? 'dragover' : ''}`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="upload-icon">📷</div>
          <div className="upload-text">点击或拖拽图片到此区域上传</div>
          <button className="upload-btn" type="button">
            选择图片
          </button>
          <div className="upload-count">
            已上传 {images.length} / 10 张
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleChange}
        />
      </div>

      {images.length > 0 && (
        <div>
          <div className="section-title">图片列表（点击选择，可拖拽到相册）</div>
          <div className="image-list">
            {images.map((img) => (
              <div
                key={img.id}
                className={`image-item ${selectedImageId === img.id ? 'selected' : ''}`}
                onClick={() => selectImage(img.id)}
                draggable
                onDragStart={(e) => handleImageItemDragStart(e, img.id)}
              >
                <img
                  src={img.processedDataUrl ?? img.dataUrl}
                  alt={img.name}
                  className="image-thumb"
                  draggable={false}
                />
                <div className="image-info">
                  <div className="image-name" title={img.name}>
                    {img.name}
                  </div>
                  <div className="image-size">
                    {formatFileSize(img.size)} · {img.width}×{img.height} · 滤镜: {img.currentFilter}
                  </div>
                </div>
                <button
                  type="button"
                  className="image-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                  title="删除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPanel;
