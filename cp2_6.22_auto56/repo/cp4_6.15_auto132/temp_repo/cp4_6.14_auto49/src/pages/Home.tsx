import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBook } from '../context/BookContext';
import { parseTxt } from '../utils/parseTxt';
import { parseEpub } from '../utils/parseEpub';

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setCurrentBook } = useBook();

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'txt' && ext !== 'epub') {
      setError('仅支持 TXT 和 EPUB 格式的文件');
      setTimeout(() => setError(''), 2000);
      return;
    }

    setIsParsing(true);
    setError('');

    try {
      let book;
      if (ext === 'txt') {
        const text = await file.text();
        book = parseTxt(text, file.name);
      } else {
        book = await parseEpub(file);
      }
      setCurrentBook(book);
      navigate('/reader');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '文件解析失败，请检查文件格式';
      setError(msg);
      setTimeout(() => setError(''), 2000);
    } finally {
      setIsParsing(false);
    }
  }, [setCurrentBook, navigate]);

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
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="upload-page">
      <div
        className={`upload-area${isDragging ? ' dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-icon">
          {isParsing ? '⏳' : '📚'}
        </div>
        <div className="upload-text">
          {isParsing ? '正在解析书籍...' : '拖拽书籍到此处或点击上传'}
        </div>
        <div className="upload-subtext">支持 TXT、EPUB 格式</div>
        <button
          className="upload-btn"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          disabled={isParsing}
        >
          {isParsing ? '解析中...' : '上传书籍'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.epub"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {error && <div className="error-toast">{error}</div>}
    </div>
  );
}
