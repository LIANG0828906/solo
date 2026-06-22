import React, { useState, useCallback, useRef } from 'react';
import { parseCSVFile, generateSampleData } from '../utils/csvParser';
import type { ParsedCSVData } from '../types';

interface FileUploaderProps {
  onDataLoaded: (data: ParsedCSVData) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const startTime = performance.now();
      const data = await parseCSVFile(file);
      const endTime = performance.now();
      
      console.log(`CSV解析耗时: ${(endTime - startTime).toFixed(2)}ms`);
      onDataLoaded(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const handleLoadSample = useCallback(() => {
    setError(null);
    const data = generateSampleData();
    onDataLoaded(data);
  }, [onDataLoaded]);

  return (
    <div className="uploader-container">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>正在解析CSV文件...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="upload-text">拖拽CSV文件到此处，或点击选择文件</p>
            <p className="upload-hint">支持时间序列数据，最多200行</p>
          </>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <div className="sample-data-section">
        <p className="sample-hint">没有CSV文件？</p>
        <button className="sample-btn" onClick={handleLoadSample}>
          加载示例数据
        </button>
      </div>
      
      <style>{`
        .uploader-container {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
        }
        
        .upload-zone {
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 60px 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.02);
        }
        
        .upload-zone:hover,
        .upload-zone.dragging {
          border-color: #3357FF;
          background: rgba(51, 87, 255, 0.1);
          transform: scale(1.01);
        }
        
        .upload-zone.dragging {
          border-color: #33FF57;
          background: rgba(51, 255, 87, 0.1);
        }
        
        .upload-icon {
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 20px;
          transition: color 0.3s ease;
        }
        
        .upload-zone:hover .upload-icon {
          color: #3357FF;
        }
        
        .upload-text {
          font-size: 18px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 8px 0;
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .upload-hint {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #3357FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .loading-state p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 16px;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(255, 51, 51, 0.1);
          border: 1px solid rgba(255, 51, 51, 0.3);
          border-radius: 8px;
          color: #FF6B6B;
          font-size: 14px;
        }
        
        .sample-data-section {
          margin-top: 24px;
          text-align: center;
        }
        
        .sample-hint {
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 12px 0;
          font-size: 14px;
        }
        
        .sample-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #3357FF 0%, #33FFF5 100%);
          border: none;
          border-radius: 8px;
          color: #1a1a2e;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }
        
        .sample-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(51, 87, 255, 0.4);
        }
      `}</style>
    </div>
  );
};

export default FileUploader;
