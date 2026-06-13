import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { DocInfo } from './App';

interface FileUploaderProps {
  onUploadComplete: (docInfo: DocInfo) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const formData = new FormData();
    formData.append('file', file);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) {
          progress = 90;
          if (progressInterval) clearInterval(progressInterval);
        }
        setUploadProgress(Math.floor(progress));
      }, 100);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            if (percent > progress) {
              setUploadProgress(percent);
            }
          }
        },
      });

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);

      const docInfo: DocInfo = {
        id: response.data.id,
        name: response.data.name,
        pageCount: response.data.pageCount,
        paragraphCount: response.data.paragraphCount,
        uploadedAt: Date.now(),
        preview: '',
      };

      setTimeout(() => {
        onUploadComplete(docInfo);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(error.response?.data?.error || '上传失败');
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
    if (files.length > 0) {
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
    fileInputRef.current?.click();
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
        />
        <div className="upload-icon">{isUploading ? '⏳' : '📁'}</div>
        <p className="drop-text">
          {isUploading ? '正在解析文档...' : '拖拽PDF文件到此处'}
        </p>
        <p className="drop-hint">或点击选择文件</p>
        <p className="size-hint">最大支持 50MB</p>

        {isUploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
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
