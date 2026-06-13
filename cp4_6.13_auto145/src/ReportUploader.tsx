import React, { useState, useRef, useCallback } from 'react';

interface ReportUploaderProps {
  onUploadComplete: (result: any) => void;
  setIsGrading: (isGrading: boolean) => void;
}

const ReportUploader: React.FC<ReportUploaderProps> = ({ onUploadComplete, setIsGrading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFilename, setUploadingFilename] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['.txt', '.pdf'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    const isValidSize = file.size <= 10 * 1024 * 1024;

    if (!isValidType) {
      alert('仅支持 .txt 和 .pdf 格式文件');
      return false;
    }
    if (!isValidSize) {
      alert('文件大小不能超过 10MB');
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadingFilename(file.name);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      const responsePromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('网络错误'));
      });

      xhr.open('POST', '/api/upload');
      setIsGrading(true);
      xhr.send(formData);

      const result = await responsePromise;
      setUploadProgress(100);
      
      setTimeout(() => {
        onUploadComplete(result);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadingFilename('');
        setIsGrading(false);
      }, 500);
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
      setIsUploading(false);
      setIsGrading(false);
      setUploadProgress(0);
      setUploadingFilename('');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  }, [onUploadComplete, setIsGrading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="panel-section">
      <h3 className="section-title">上传报告</h3>
      
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <div className="upload-icon">📄</div>
        <div className="upload-text">
          {isUploading ? '上传中...' : '拖拽文件到此处或点击上传'}
        </div>
        <div className="upload-hint">支持 .txt 和 .pdf 格式，最大 10MB</div>
      </div>

      {isUploading && (
        <div className="upload-progress">
          <div className="upload-progress-text">
            <span>{uploadingFilename}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportUploader;
