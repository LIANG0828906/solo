import React, { useState } from 'react';
import { FileItem } from './fileData';

interface FileManagerProps {
  files: FileItem[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onUpload: () => void;
}

const FileManager: React.FC<FileManagerProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  onUpload,
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleExpand = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="left-panel">
      <div className="panel-header">
        <span>文件列表</span>
        <button className="upload-btn" onClick={onUpload}>
          + 上传
        </button>
      </div>
      <div className="file-list">
        {files.map(file => (
          <div key={file.id}>
            <div
              className={`file-item ${selectedFileId === file.id ? 'selected' : ''}`}
              onClick={() => onSelectFile(file.id)}
            >
              <div className={`file-icon ${file.type}`}></div>
              <span className="file-name" title={file.name}>
                {file.name}
              </span>
              <div
                className={`file-expand ${expandedFiles.has(file.id) ? 'expanded' : ''}`}
                onClick={(e) => toggleExpand(file.id, e)}
              >
                ▶
              </div>
            </div>
            {expandedFiles.has(file.id) && (
              <div className="version-history">
                <div className="version-item">
                  <div>当前版本</div>
                  <div className="version-time">{formatTime(file.timestamp)}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileManager;
