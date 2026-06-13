import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ImageItem, ColorSwatch } from '../../types';
import { ColorAnalyzer } from '../analyzer/ColorAnalyzer';
import styles from './UploadPanel.module.css';

interface UploadPanelProps {
  onImagesAdded: (images: ImageItem[]) => void;
  activeColorFilter: string | null;
  onColorFilterChange: (color: string | null) => void;
}

interface UploadingItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'analyzing' | 'done' | 'error';
  thumbnail?: string;
  errorMessage?: string;
}

const COLOR_FILTERS = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
  '#0000FF', '#4B0082', '#9400D3', '#FFFFFF',
  '#000000', '#808080',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const UploadPanel: React.FC<UploadPanelProps> = ({
  onImagesAdded,
  activeColorFilter,
  onColorFilterChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingItemsRef = useRef<Map<string, UploadingItem>>(new Map());

  useEffect(() => {
    uploadingItemsRef.current = new Map(uploadingItems.map(item => [item.id, item]));
  }, [uploadingItems]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '仅支持 JPG/PNG 格式';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '文件大小不能超过 5MB';
    }
    return null;
  };

  const updateItemProgress = (id: string, updates: Partial<UploadingItem>) => {
    setUploadingItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const processFile = useCallback(async (file: File) => {
    const id = generateId();
    const error = validateFile(file);

    const uploadItem: UploadingItem = {
      id,
      name: file.name,
      progress: 0,
      status: error ? 'error' : 'uploading',
      errorMessage: error || undefined,
    };

    setUploadingItems(prev => [...prev, uploadItem]);

    if (error) return;

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 60);
        updateItemProgress(id, { progress });
      }
    };

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        updateItemProgress(id, { status: 'error', errorMessage: '读取文件失败' });
        return;
      }

      const img = new Image();
      img.onload = async () => {
        updateItemProgress(id, {
          progress: 70,
          status: 'analyzing',
          thumbnail: dataUrl,
        });

        try {
          const colors: ColorSwatch[] = await ColorAnalyzer.analyze(dataUrl);

          updateItemProgress(id, { progress: 100, status: 'done' });

          const newImage: ImageItem = {
            id,
            name: file.name,
            url: dataUrl,
            width: img.width,
            height: img.height,
            colors,
            uploadedAt: Date.now(),
            progress: 100,
          };

          onImagesAdded([newImage]);
        } catch (err) {
          updateItemProgress(id, {
            status: 'error',
            errorMessage: '颜色分析失败',
          });
        }
      };

      img.onerror = () => {
        updateItemProgress(id, { status: 'error', errorMessage: '图片加载失败' });
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      updateItemProgress(id, { status: 'error', errorMessage: '文件读取失败' });
    };

    reader.readAsDataURL(file);
  }, [onImagesAdded]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    fileArray.forEach(file => processFile(file));
  }, [processFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>素材上传</h3>

      <div
        className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className={styles.dropZoneContent}>
          <span className={styles.icon}>🎨</span>
          <div className={styles.dropText}>
            {isDragging ? '松开以上传图片' : '拖拽图片到此处或点击选择'}
          </div>
          <div className={styles.dropHint}>
            支持 JPG/PNG 格式，单张不超过 5MB
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleInputChange}
        />
      </div>

      {uploadingItems.length > 0 && (
        <div className={styles.uploadList}>
          {uploadingItems.map(item => (
            <div key={item.id} className={styles.uploadItem}>
              {item.thumbnail && (
                <img src={item.thumbnail} alt="" className={styles.uploadThumb} />
              )}
              <div className={styles.uploadInfo}>
                <div className={styles.uploadName}>{item.name}</div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div
                  className={`${styles.statusText} ${
                    item.status === 'done'
                      ? styles.statusSuccess
                      : item.status === 'error'
                      ? styles.statusError
                      : ''
                  }`}
                >
                  {item.status === 'uploading' && `上传中 ${item.progress}%`}
                  {item.status === 'analyzing' && '分析配色中...'}
                  {item.status === 'done' && '✓ 分析完成'}
                  {item.status === 'error' && `✗ ${item.errorMessage}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.filterSection}>
        <span className={styles.filterLabel}>按主色调筛选</span>
        <div className={styles.colorFilters}>
          <button
            className={`${styles.colorFilterBtn} ${
              activeColorFilter === null ? styles.colorFilterActive : ''
            }`}
            style={{
              background:
                'repeating-linear-gradient(45deg, #ccc, #ccc 2px, #fff 2px, #fff 4px)',
              borderColor: '#666',
            }}
            onClick={() => onColorFilterChange(null)}
            title="全部"
          />
          {COLOR_FILTERS.map(color => (
            <button
              key={color}
              className={`${styles.colorFilterBtn} ${
                activeColorFilter === color ? styles.colorFilterActive : ''
              }`}
              style={{ background: color }}
              onClick={() => onColorFilterChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(UploadPanel);
