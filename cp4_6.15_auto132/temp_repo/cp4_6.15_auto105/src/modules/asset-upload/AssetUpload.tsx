import { useState, useRef, useCallback } from 'react';
import { Upload, FileType, X, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAssetStore } from '../asset-store/store';
import { generateThumbnail } from '../asset-detail/ThumbnailGenerator';
import type { Asset } from '../asset-store/types';
import './AssetUpload.css';

interface UploadingFile {
  id: string;
  file: File;
  name: string;
  progress: number;
  status: 'uploading' | 'processing' | 'done' | 'error';
  format: 'gltf' | 'glb' | 'obj';
  size: string;
}

const lerpColor = (color1: string, color2: string, t: number): string => {
  const hex = (x: string) => parseInt(x, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getProgressColor = (progress: number): string => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  if (clampedProgress < 50) {
    const t = clampedProgress / 50;
    return lerpColor('#ef4444', '#3b82f6', t);
  } else {
    const t = (clampedProgress - 50) / 50;
    return lerpColor('#3b82f6', '#10b981', t);
  }
};

const lightenColor = (color: string, amount: number): string => {
  const hex = (x: string) => parseInt(x, 16);
  const r = Math.min(255, hex(color.slice(1, 3)) + amount);
  const g = Math.min(255, hex(color.slice(3, 5)) + amount);
  const b = Math.min(255, hex(color.slice(5, 7)) + amount);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function AssetUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addAsset, updateThumbnail, assets } = useAssetStore();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatFromFileName = (name: string): 'gltf' | 'glb' | 'obj' => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'glb') return 'glb';
    if (ext === 'gltf') return 'gltf';
    if (ext === 'obj') return 'obj';
    return 'glb';
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      progress = Math.min(progress, 100);

      setUploadingFiles((prev) =>
        prev.map((f) => {
          if (f.id === fileId) {
            return { ...f, progress: Math.floor(progress) };
          }
          return f;
        })
      );

      if (progress >= 100) {
        clearInterval(interval);
        processFile(fileId);
      }
    }, 200);
  };

  const processFile = async (fileId: string) => {
    setUploadingFiles((prev) =>
      prev.map((f) => {
      if (f.id === fileId) {
        return { ...f, status: 'processing' as const };
      }
      return f;
    })
  );

    const fileData = uploadingFiles.find((f) => f.id === fileId);
    if (!fileData) return;

    const file = fileData.file;
    const url = URL.createObjectURL(file);
    const format = getFormatFromFileName(file.name);

    const newAsset = addAsset({
      name: file.name.replace(/\.[^/.]+$/, ''),
      modelUrl: url,
      thumbnail: '',
      format: format,
      faceCount: Math.floor(Math.random() * 20000) + 2000,
      size: formatFileSize(file.size),
      fileSize: file.size,
      tags: ['新上传'],
      rating: 0,
      description: '',
    });

    setTimeout(async () => {
      try {
        const thumbnail = await generateThumbnail(url, format);
        updateThumbnail(newAsset.id, thumbnail);
      } catch (e) {
        console.error('Thumbnail generation failed:', e);
      }

      setUploadingFiles((prev) =>
        prev.map((f) => {
          if (f.id === fileId) {
            return { ...f, status: 'done' as const };
          }
          return f;
        })
      );
    }, 1000);
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const validExtensions = ['.glb', '.gltf', '.obj'];

      Array.from(files).forEach((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!validExtensions.includes(ext)) {
          alert(`不支持的文件格式: ${file.name}`);
          return;
        }

        const newFile: UploadingFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          progress: 0,
          status: 'uploading',
          format: getFormatFromFileName(file.name),
          size: formatFileSize(file.size),
        };

        setUploadingFiles((prev) => [...prev, newFile]);
        simulateUpload(newFile.id);
      });
    },
    [addAsset, updateThumbnail]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const goToList = () => {
    window.location.hash = '#/';
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
      <h1 className="upload-title">上传模型</h1>
      <p className="upload-subtitle">支持 glTF、GLB、OBJ 格式</p>
    </div>

      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf,.obj"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <div className="drop-icon">
          <Upload size={48} />
        </div>
        <h2 className="drop-title">拖拽文件到这里</h2>
        <p className="drop-hint">
          或点击选择文件</p>
        <div className="drop-formats">
          <span className="format-badge">GLB</span>
          <span className="format-badge">glTF</span>
          <span className="format-badge">OBJ</span>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="upload-list">
          <h3 className="list-title">上传队列</h3>
          <div className="file-list">
            {uploadingFiles.map((fileItem) => (
              <div key={fileItem.id} className="file-item">
                <div className="file-icon">
                {fileItem.status === 'done' ? (
                  <Check size={20} />
                ) : fileItem.status === 'error' ? (
                  <X size={20} />
                ) : fileItem.status === 'processing' ? (
                  <Loader2 size={20} className="spinner" />
                ) : (
                  <FileType size={20} />
                )}
              </div>

                <div className="file-info">
                  <div className="file-name">{fileItem.name}</div>
                  <div className="file-meta">
                    <span>{fileItem.size}</span>
                    <span className="meta-dot">·</span>
                    <span>{fileItem.format.toUpperCase()}</span>
                  </div>
                  {fileItem.status !== 'done' && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${fileItem.progress}%`,
                          background: `linear-gradient(90deg, ${getProgressColor(fileItem.progress)} 0%, ${lightenColor(getProgressColor(fileItem.progress), 30)} 100%)`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="file-status">
                  {fileItem.status === 'uploading' && (
                    <span className="status-text uploading">
                      {fileItem.progress}%
                    </span>
                  )}
                  {fileItem.status === 'processing' && (
                    <span className="status-text processing">生成缩略图</span>
                  )}
                  {fileItem.status === 'done' && (
                      <span className="status-text done">完成</span>
                    )}
                  {fileItem.status === 'error' && (
                    <span className="status-text error">失败</span>
                  )}
                </div>

                {fileItem.status !== 'uploading' && fileItem.status !== 'processing' && (
                  <button
                    className="remove-btn"
                    onClick={() => removeFile(fileItem.id)}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="upload-footer">
        <button className="footer-btn secondary" onClick={goToList}>
          返回列表
        </button>
        <button
          className="footer-btn primary"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} />
          继续上传
        </button>
      </div>
    </div>
  );
}
