import React, { useRef, useState } from 'react';
import { parseJsonFile } from '../data/dataParser';
import { useGraphStore } from '../store/graphStore';
import { generateForceLayout } from '../graph/graphEngine';

const FileUpload: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileName = useGraphStore((s) => s.fileName);
  const setRawData = useGraphStore((s) => s.setRawData);
  const setNodes = useGraphStore((s) => s.setNodes);
  const setEdges = useGraphStore((s) => s.setEdges);
  const setError = useGraphStore((s) => s.setError);
  const setFileName = useGraphStore((s) => s.setFileName);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('请上传 JSON 格式的文件');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const result = await parseJsonFile(file);
      if (!result.success || !result.data) {
        setError(result.error || '解析失败');
        setFileName(null);
        setRawData(null);
        return;
      }

      setFileName(file.name);
      setRawData(result.data);

      const layoutData = await generateForceLayout(result.data, 800, 600);
      setNodes(layoutData.nodes);
      setEdges(layoutData.edges);
    } finally {
      setIsParsing(false);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          background: 'linear-gradient(135deg, #FF6B6B 0%, #45B7D1 100%)',
          color: '#FFFFFF',
          border: isDragging ? '2px dashed #00D4AA' : 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'filter 0.2s, transform 0.1s',
          filter: isDragging ? 'brightness(1.2)' : 'brightness(1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minHeight: '40px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {isParsing ? '解析中...' : fileName ? '重新上传' : '上传 JSON 数据'}
      </button>
      {fileName && !isParsing && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: '#8A8AA0',
          }}
        >
          当前文件: {fileName}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
