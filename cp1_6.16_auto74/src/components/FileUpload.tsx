import React, { useState, useRef, useCallback } from 'react';
import type { FileItem, FileType } from '../types';
import { generateId } from '../data/mockData';
import '../styles/FileUpload.css';

interface FileUploadProps {
  files: FileItem[];
  onChange: (files: FileItem[]) => void;
  accept?: string;
  maxFiles?: number;
}

function getFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return 'image';
  }
  if (ext === 'pdf') {
    return 'pdf';
  }
  return 'document';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function FileUpload({ files, onChange, accept, maxFiles = 10 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: FileItem[] = [];
      for (let i = 0; i < fileList.length && files.length + newFiles.length < maxFiles; i++) {
        const file = fileList[i];
        const fileItem: FileItem = {
          id: generateId(),
          name: file.name,
          type: getFileType(file.name),
          size: file.size,
        };

        if (fileItem.type === 'image') {
          const url = URL.createObjectURL(file);
          fileItem.url = url;
        }

        newFiles.push(fileItem);
      }
      onChange([...files, ...newFiles]);
    },
    [files, maxFiles, onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
      onChange(files.filter((f) => f.id !== id));
    },
    [files, onChange]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'pdf':
        return '📄';
      case 'document':
        return '📁';
    }
  };

  return (
    <div className="file-upload">
      <div
        className={`file-upload__dropzone ${isDragging ? 'file-upload__dropzone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="file-upload__icon">📤</div>
        <p className="file-upload__text">拖拽文件到此处，或点击上传</p>
        <p className="file-upload__hint">支持图片、PDF、文档格式</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div className="file-upload__list">
          {files.map((file, index) => (
            <div
              key={file.id}
              className="file-upload__item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {file.type === 'image' && file.url ? (
                <img src={file.url} alt={file.name} className="file-upload__thumbnail" />
              ) : (
                <div className="file-upload__icon-file">{getFileIcon(file.type)}</div>
              )}
              <div className="file-upload__info">
                <span className="file-upload__name">{file.name}</span>
                <span className="file-upload__size">{formatFileSize(file.size)}</span>
              </div>
              <button
                className="file-upload__delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
