import React, { useState, useCallback, useRef, useEffect } from 'react';
import { compressImage, formatSize, calculateCompressionRatio } from './ImageProcessor';
import { exportAsZip } from './ExportManager';

interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  previewUrl: string;
  compressedBlob: Blob | null;
  compressedSize: number | null;
  isSelected: boolean;
  isCompressed: boolean;
  isCompressing: boolean;
}

type QualityLevel = 'low' | 'medium' | 'high' | 'lossless';

const QUALITY_MAP: Record<QualityLevel, number> = {
  low: 0.5,
  medium: 0.7,
  high: 0.85,
  lossless: 1.0,
};

const QUALITY_LABELS: Record<QualityLevel, string> = {
  low: '低 (50%)',
  medium: '中 (70%)',
  high: '高 (85%)',
  lossless: '无损 (100%)',
};

const MAX_FILES = 10;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState<QualityLevel>('medium');
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCompressingRef = useRef(false);

  const totalCount = images.length;
  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalCompressedSize = images.reduce((sum, img) => sum + (img.compressedSize || 0), 0);
  const compressedCount = images.filter((img) => img.isCompressed).length;
  const averageRatio = compressedCount > 0
    ? images
        .filter((img) => img.isCompressed)
        .reduce((sum, img) => sum + calculateCompressionRatio(img.originalSize, img.compressedSize!), 0) / compressedCount
    : 0;

  const selectedImages = images.filter((img) => img.isSelected && img.isCompressed);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `不支持的格式: ${file.name}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件过大: ${file.name}`;
    }
    return null;
  };

  const addFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageItem[] = [];
    const errors: string[] = [];
    const currentCount = images.length;

    for (let i = 0; i < files.length && newImages.length + currentCount < MAX_FILES; i++) {
      const file = files[i];
      const error = validateFile(file);
      if (error) {
        errors.push(error);
        continue;
      }

      const id = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      newImages.push({
        id,
        file,
        name: file.name,
        originalSize: file.size,
        previewUrl: URL.createObjectURL(file),
        compressedBlob: null,
        compressedSize: null,
        isSelected: true,
        isCompressed: false,
        isCompressing: false,
      });
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
    }
  }, [images.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const uncompressedImages = images.filter((img) => !img.isCompressed && !img.isCompressing);
    if (uncompressedImages.length === 0 || isCompressingRef.current) return;

    const compressAll = async () => {
      isCompressingRef.current = true;
      setIsCompressing(true);

      const qualityValue = QUALITY_MAP[quality];
      const totalToCompress = images.filter((img) => !img.isCompressed).length;
      let completed = 0;

      const imagesToCompress = images.filter((img) => !img.isCompressed);

      for (const imageItem of imagesToCompress) {
        if (!isCompressingRef.current) break;

        setImages((prev) =>
          prev.map((img) =>
            img.id === imageItem.id ? { ...img, isCompressing: true } : img,
          ),
        );

        try {
          const result = await compressImage(imageItem.file, qualityValue);
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageItem.id
                ? {
                    ...img,
                    compressedBlob: result.blob,
                    compressedSize: result.sizeAfter,
                    isCompressed: true,
                    isCompressing: false,
                  }
                : img,
            ),
          );
        } catch (error) {
          console.error('压缩失败:', error);
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageItem.id ? { ...img, isCompressing: false } : img,
            ),
          );
        }

        completed++;
        setProgress(Math.round((completed / totalToCompress) * 100));
      }

      isCompressingRef.current = false;
      setIsCompressing(false);
    };

    compressAll();
  }, [images, quality]);

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuality = e.target.value as QualityLevel;
    setQuality(newQuality);
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        compressedBlob: null,
        compressedSize: null,
        isCompressed: false,
        isCompressing: false,
      })),
    );
    setProgress(0);
  };

  const toggleSelect = (id: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, isSelected: !img.isSelected } : img)),
    );
  };

  const handleExport = async () => {
    if (selectedImages.length === 0) {
      alert('请至少选择一张图片');
      return;
    }

    setIsExporting(true);
    try {
      const exportData = selectedImages.map((img) => ({
        name: img.name,
        blob: img.compressedBlob!,
      }));
      await exportAsZip(exportData);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = (image: ImageItem) => {
    setPreviewImage(image);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>图片批量压缩转换</h1>
        <p>支持 PNG、JPG、GIF 格式，一键转换为 WebP 格式</p>
      </header>

      <div className="stats-panel">
        <div className="stat-card">
          <div className="stat-value">{totalCount}</div>
          <div className="stat-label">总图片数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatSize(totalOriginalSize)}</div>
          <div className="stat-label">总原始大小</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{compressedCount > 0 ? formatSize(totalCompressedSize) : '--'}</div>
          <div className="stat-label">总压缩后大小</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{compressedCount > 0 ? averageRatio.toFixed(1) + '%' : '--'}</div>
          <div className="stat-label">平均压缩率</div>
        </div>
      </div>

      <div className="card upload-section">
        <div
          className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
          onClick={handleUploadClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">点击或拖拽图片到此处上传</div>
          <div className="upload-hint">
            支持 PNG、JPG、GIF 格式，最多 10 张，单张不超过 2MB
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="upload-input"
            accept=".png,.jpg,.jpeg,.gif"
            multiple
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {images.length > 0 && (
        <>
          <div className="controls-section card">
            <div className="quality-selector">
              <label htmlFor="quality">压缩质量:</label>
              <select
                id="quality"
                value={quality}
                onChange={handleQualityChange}
                disabled={isCompressing}
              >
                {(Object.keys(QUALITY_LABELS) as QualityLevel[]).map((level) => (
                  <option key={level} value={level}>
                    {QUALITY_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="export-btn"
              onClick={handleExport}
              disabled={selectedImages.length === 0 || isCompressing || isExporting}
            >
              {isExporting ? '导出中...' : `导出 WebP (${selectedImages.length}张)`}
            </button>
          </div>

          {isCompressing && (
            <div className="progress-section card">
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-text">压缩进度: {progress}%</div>
            </div>
          )}

          <div className="card">
            <div className="thumbnails-grid">
              {images.map((image) => {
                const ratio = image.isCompressed
                  ? calculateCompressionRatio(image.originalSize, image.compressedSize!)
                  : 0;
                const isHighRatio = ratio > 40;

                return (
                  <div
                    key={image.id}
                    className="thumbnail-item"
                    onClick={() => handlePreview(image)}
                  >
                    <input
                      type="checkbox"
                      className="thumbnail-checkbox"
                      checked={image.isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(image.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {image.isCompressed && (
                      <div
                        className={`comparison-badge ${isHighRatio ? 'high' : 'low'}`}
                      >
                        {formatSize(image.originalSize)}→{formatSize(image.compressedSize!)}
                      </div>
                    )}
                    <div className="thumbnail-image-wrapper">
                      <img
                        src={image.previewUrl}
                        alt={image.name}
                        className="thumbnail-image"
                      />
                    </div>
                    <div className="thumbnail-info">
                      <div className="thumbnail-name" title={image.name}>
                        {image.name}
                      </div>
                      <div className="thumbnail-size">
                        {image.isCompressed
                          ? `${formatSize(image.compressedSize!)} (-${ratio.toFixed(1)}%)`
                          : formatSize(image.originalSize)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.5)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3,
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
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {images.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">🖼️</div>
          <p>暂无图片，请上传图片开始使用</p>
        </div>
      )}

      {previewImage && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closePreview}>
              ✕
            </button>
            <img
              src={previewImage.compressedBlob
                ? URL.createObjectURL(previewImage.compressedBlob)
                : previewImage.previewUrl}
              alt={previewImage.name}
              className="modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
