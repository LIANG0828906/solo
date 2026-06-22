import { useState, useRef, useCallback } from 'react';
import type { ParsedDoc } from './types';

interface FileUploaderProps {
  onSuccess: (doc: ParsedDoc) => void;
  variant?: 'button' | 'large';
}

export default function FileUploader({ onSuccess, variant = 'button' }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;

    const validExtensions = ['.json', '.yaml', '.yml'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setStatus('error');
      setErrorMsg('仅支持 JSON、YAML、YML 格式文件');
      return;
    }

    setUploading(true);
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      setProgress(30);
      
      const text = await file.text();
      
      setProgress(60);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
          filename: file.name
        })
      });

      setProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }

      const data = await response.json();
      
      setProgress(100);
      setStatus('success');
      
      setTimeout(() => {
        onSuccess(data);
        setStatus('idle');
        setProgress(0);
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setErrorMsg(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
    }
  }, [onSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

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

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (variant === 'large') {
    return (
      <div className="upload-zone">
        <div
          className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            拖拽文件到此处，或 <strong>点击选择文件</strong>
          </div>
          <div className="upload-hint">支持 OpenAPI v3 规范的 JSON / YAML 文件</div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        {status !== 'idle' && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className={`upload-status ${status}`}>
              {status === 'uploading' && `正在解析文件... ${progress}%`}
              {status === 'success' && '✓ 解析成功！'}
              {status === 'error' && `✗ ${errorMsg}`}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="upload-zone">
      <button
        className="upload-btn"
        onClick={handleClick}
        disabled={uploading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        上传文档
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.yaml,.yml"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
    </div>
  );
}
