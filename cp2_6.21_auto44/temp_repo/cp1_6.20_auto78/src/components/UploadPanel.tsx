import React, { useCallback, useRef, useState } from 'react';
import { THEME } from '../types';

interface UploadPanelProps {
  onImageUpload: (file: File) => void;
  pages: { id: string; imageUrl: string }[];
  currentPageId: string | null;
  onPageSelect: (id: string) => void;
}

export default function UploadPanel({
  onImageUpload,
  pages,
  currentPageId,
  onPageSelect,
}: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
      }
    },
    [onImageUpload]
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
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [handleFile]
  );

  return (
    <div
      style={{
        width: '200px',
        minWidth: '200px',
        background: THEME.card,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto',
        borderRadius: THEME.radius,
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: isDragging ? `2px solid ${THEME.gold}` : '2px dashed #555',
          borderRadius: THEME.radius,
          padding: '24px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          background: isDragging ? 'rgba(255,215,0,0.08)' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={isDragging ? THEME.gold : '#888'} strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span style={{ fontSize: '12px', color: isDragging ? THEME.gold : '#888' }}>
          {isDragging ? '释放以上传' : '拖拽或点击上传'}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {pages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: THEME.text }}>
            页面列表
          </span>
          {pages.map((page, idx) => (
            <div
              key={page.id}
              onClick={() => onPageSelect(page.id)}
              style={{
                padding: '8px',
                borderRadius: THEME.radius,
                cursor: 'pointer',
                border:
                  currentPageId === page.id
                    ? `2px solid ${THEME.orange}`
                    : '2px solid transparent',
                background:
                  currentPageId === page.id
                    ? 'rgba(255,140,66,0.15)'
                    : 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              className="btn-hover"
            >
              <img
                src={page.imageUrl}
                alt={`page-${idx}`}
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }}
              />
              <span style={{ fontSize: '12px' }}>第 {idx + 1} 页</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
