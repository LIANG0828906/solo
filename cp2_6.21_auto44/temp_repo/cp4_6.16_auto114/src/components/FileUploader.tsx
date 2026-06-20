import React, { useRef } from 'react';
import { useStore } from '../store';

const FileUploader: React.FC = () => {
  const { loadBuildingsFromJSON } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadBuildingsFromJSON(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/json') {
      await loadBuildingsFromJSON(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="file-uploader">
      <div className="file-uploader-title">📁 建筑数据</div>
      <div
        className="file-upload-area"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="file-upload-icon">📤</div>
        <div className="file-upload-text">点击或拖拽上传JSON文件</div>
        <div className="file-upload-hint">格式: [{`{"x": 0, "z": 0, "width": 10, "depth": 10, "height": 20}`}]</div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileUploader;
