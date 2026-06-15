import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './UploadPanel.module.css';

export interface PendingImage {
  id: string;
  name: string;
  url: string;
  file: File;
  progress: number;
  status: 'uploading' | 'analyzing' | 'done' | 'error';
  errorMessage?: string;
}

interface UploadPanelProps {
  onFileReady: (file: File, dataUrl: string, tempId: string) => void;
  onAnalysisProgress: (id: string, progress: number, status: PendingImage['status']) => void;
  pendingImages: PendingImage[];
  activeColorFilter: string | null;
  onColorFilterChange: (color: string | null) => void;
}

const COLOR_FILTERS = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
  '#0000FF', '#4B0082', '#9400D3', '#FFFFFF',
  '#000000', '#808080',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const UploadPanel: React.FC<UploadPanelProps> = ({
  onFileReady,
  onAnalysisProgress,
  pendingImages,
  activeColorFilter,
  onColorFilterChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    return () => {
      progressTimersRef.current.forEach(timer => clearInterval(timer));
    };
  }, []);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      const ext = file.name.split('.').pop()?.toUpperCase();
      return `${ext || '该'}格式不支持，仅支持 JPG/PNG 格式`;
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      return `文件 ${sizeMB}MB 超过限制，最大支持 5MB`;
    }
    return null;
  };

  const startProgressAnimation = useCallback((id: string, startPct: number, endPct: number, duration: number, onComplete?: () => void) => {
    const existingTimer = progressTimersRef.current.get(id);
    if (existingTimer) clearInterval(existingTimer);

    const startTime = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(endPct, startPct + (endPct - startPct) * Math.min(1, elapsed / duration));
      onAnalysisProgress(id, pct, pct >= endPct && !onComplete ? 'uploading' : 'uploading');
      if (elapsed >= duration) {
        clearInterval(timer);
        progressTimersRef.current.delete(id);
        if (onComplete) onComplete();
      }
    }, 30);

    progressTimersRef.current.set(id, timer);
    return timer;
  }, [onAnalysisProgress]);

  const processFile = useCallback(async (file: File) => {
    const id = generateId();
    const error = validateFile(file);

    if (error) {
      onAnalysisProgress(id, 0, 'error');
      const pending: PendingImage = {
        id,
        name: file.name,
        url: '',
        file,
        progress: 0,
        status: 'error',
        errorMessage: error,
      };
      onFileReady(file, '', id);
      return;
    }

    onAnalysisProgress(id, 0, 'uploading');

    const reader = new FileReader();

    reader.onloadstart = () => {
      startProgressAnimation(id, 0, 60, 600);
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 60);
        onAnalysisProgress(id, progress, 'uploading');
      }
    };

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        onAnalysisProgress(id, 60, 'error');
        return;
      }

      const existingTimer = progressTimersRef.current.get(id);
      if (existingTimer) clearInterval(existingTimer);
      onAnalysisProgress(id, 60, 'uploading');

      startProgressAnimation(id, 60, 75, 300, () => {
        onAnalysisProgress(id, 75, 'analyzing');
        onFileReady(file, dataUrl, id);
      });
    };

    reader.onerror = () => {
      onAnalysisProgress(id, 60, 'error');
    };

    const pending: PendingImage = {
      id,
      name: file.name,
      url: '',
      file,
      progress: 0,
      status: 'uploading',
    };
    onFileReady(file, '', id);

    reader.readAsDataURL(file);
  }, [onFileReady, onAnalysisProgress, startProgressAnimation]);

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
    e.dataTransfer.dropEffect = 'copy';
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
        role="button"
        tabIndex={0}
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

      {pendingImages.length > 0 && (
        <div className={styles.uploadList}>
          {pendingImages.map(item => (
            <div key={item.id} className={styles.uploadItem}>
              {item.url && (
                <img src={item.url} alt="" className={styles.uploadThumb} />
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
                  {item.status === 'uploading' && `上传中 ${Math.round(item.progress)}%`}
                  {item.status === 'analyzing' && `分析配色 ${Math.round(item.progress)}%`}
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
