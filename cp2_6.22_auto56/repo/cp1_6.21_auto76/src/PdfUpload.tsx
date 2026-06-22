import React, { useState, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfUploadProps {
  onPagesLoaded: (pages: string[]) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function PdfUpload({ onPagesLoaded, currentPage, onPageChange }: PdfUploadProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderPdf = useCallback(
    async (pdfUrl: string) => {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const renderedPages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        renderedPages.push(canvas.toDataURL('image/png'));
      }

      return renderedPages;
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > 20 * 1024 * 1024) {
        alert('文件大小不能超过20MB');
        return;
      }
      if (file.type !== 'application/pdf') {
        alert('请上传PDF文件');
        return;
      }
      setUploading(true);
      setFileName(file.name);
      try {
        const formData = new FormData();
        formData.append('pdf', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          const renderedPages = await renderPdf(data.url);
          if (renderedPages.length > 0) {
            setPages(renderedPages);
            onPagesLoaded(renderedPages);
            onPageChange(0);
          }
        }
      } catch (err) {
        alert('上传失败，请重试');
      } finally {
        setUploading(false);
      }
    },
    [onPagesLoaded, onPageChange, renderPdf]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid #DEE2E6',
      }}
    >
      {pages.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 360,
            maxWidth: '100%',
            height: 200,
            border: `2px dashed ${dragging ? '#8E44AD' : '#CCCCCC'}`,
            borderRadius: 12,
            background: dragging ? '#F3E5F5' : '#FFF8E1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            margin: '0 auto',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid #E0E0E0',
                  borderTopColor: '#3498DB',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }}
              />
              <div style={{ marginTop: 12, fontSize: 14, color: '#666' }}>
                正在上传 {fileName}...
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, color: '#666' }}>
                拖拽PDF文件到此处
                <br />
                或点击上传（最大20MB）
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: 12,
              color: '#888',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>📄 {fileName}</span>
            <button
              onClick={() => {
                setPages([]);
                onPagesLoaded([]);
                onPageChange(0);
              }}
              style={{
                border: 'none',
                background: 'none',
                color: '#E74C3C',
                cursor: 'pointer',
                fontSize: 12,
                padding: 0,
              }}
            >
              移除
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {pages.map((page, idx) => (
              <div
                key={idx}
                onClick={() => onPageChange(idx)}
                style={{
                  width: 100,
                  height: 140,
                  borderRadius: 4,
                  border: idx === currentPage ? '3px solid #3498DB' : '1px solid #DEE2E6',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                  position: 'relative',
                  transition: 'border 0.2s, transform 0.2s',
                  transform: idx === currentPage ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (idx !== currentPage)
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (idx !== currentPage)
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <img
                  src={page}
                  alt={`第${idx + 1}页`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#FFF',
                    fontSize: 10,
                    textAlign: 'center',
                    padding: '2px 0',
                  }}
                >
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
