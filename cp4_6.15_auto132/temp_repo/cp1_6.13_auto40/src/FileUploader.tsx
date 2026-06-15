import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import type { DocInfo } from './App';
import type { ApiTypes } from './apiTypes';

interface FileUploaderProps {
  onUploadComplete: (docInfo: DocInfo) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'done'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProgressUpdateRef = useRef<number>(0);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('请上传PDF格式的文件');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('文件大小不能超过50MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadStatus('uploading');
    lastProgressUpdateRef.current = 0;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post<ApiTypes['upload']['response']>('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const now = Date.now();
            const elapsedSinceLastUpdate = now - lastProgressUpdateRef.current;
            const percent = Math.min(95, Math.round((progressEvent.loaded * 100) / progressEvent.total));

            if (elapsedSinceLastUpdate >= 100 || percent >= 95) {
              setUploadProgress(percent);
              lastProgressUpdateRef.current = now;
            }
          }
        },
      });

      setUploadStatus('parsing');
      setUploadProgress(98);

      await new Promise((resolve) => setTimeout(resolve, 100));

      setUploadProgress(100);
      setUploadStatus('done');

      const docInfo: DocInfo = {
        id: response.data.id,
        name: response.data.name,
        pageCount: response.data.pageCount,
        paragraphCount: response.data.paragraphCount,
        uploadedAt: Date.now(),
        preview: response.data.preview || '',
      };

      setTimeout(() => {
        onUploadComplete(docInfo);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus('idle');
      }, 400);
    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('idle');
      setUploadError(error.response?.data?.error || '上传失败，请重试');
    }
  }, [onUploadComplete]);

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

    const files = e.dataTransfer.files;
    if (files.length > 0 && !isUploading) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return '正在上传...';
      case 'parsing':
        return '正在解析文档...';
      case 'done':
        return '解析完成!';
      default:
        return isUploading ? '处理中...' : '拖拽PDF文件到此处';
    }
  };

  return (
    <div className="file-uploader card">
      <h3 className="section-title">📤 上传文档</h3>
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="file-input"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <div className="upload-icon">
          {uploadStatus === 'uploading'
            ? '📤'
            : uploadStatus === 'parsing'
            ? '�'
            : uploadStatus === 'done'
            ? '✅'
            : '📁'}
        </div>
        <p className="drop-text">{getStatusText()}</p>
        <p className="drop-hint">{isUploading ? '' : '或点击选择文件'}</p>
        <p className="size-hint">最大支持 50MB</p>

        {isUploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${uploadProgress}%`,
                  background:
                    uploadStatus === 'parsing'
                      ? 'linear-gradient(90deg, #81C784, #4CAF50)'
                      : 'linear-gradient(90deg, #FFD54F, #FF9800)',
                }}
              />
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="upload-error">
          <span>⚠️</span> {uploadError}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
