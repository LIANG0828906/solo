import React, { useRef, useState, useEffect } from 'react';
import { usePuzzleStore } from '../store/puzzleStore';

const Toolbar: React.FC = () => {
  const {
    gridSize,
    pieces,
    setGridSize,
    setImageAndSplit,
    shufflePieces,
    resetPuzzle,
    saveCurrentSnapshot,
    loadSnapshotFromFile,
  } = usePuzzleStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const snapshotInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const vmin = Math.min(window.innerWidth, window.innerHeight);
    const canvasSize = isMobile ? vmin * 0.95 : vmin * 0.8;
    setImageAndSplit(file, canvasSize);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSnapshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadSnapshotFromFile(file);
    if (snapshotInputRef.current) {
      snapshotInputRef.current.value = '';
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setGridSize(newSize);
  };

  const buttonScale = isMobile ? 0.8 : 1;
  const buttonStyle: React.CSSProperties = {
    padding: `${8 * buttonScale}px ${16 * buttonScale}px`,
    fontSize: `${14 * buttonScale}px`,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    border: '1px solid #CCC',
    borderRadius: '6px',
    backgroundColor: '#FFF',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    color: '#333',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#EEE';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#FFF';
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#DDD';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#EEE';
  };

  return (
    <div
      style={{
        height: '60px',
        backgroundColor: '#F5F5F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '8px' : '16px',
        flexWrap: 'wrap',
        padding: '0 16px',
        borderTop: '1px solid #E0E0E0',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <button
        style={buttonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={() => fileInputRef.current?.click()}
      >
        上传图片
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: `${12 * buttonScale}px`,
          color: '#666',
        }}
      >
        <span>分割:</span>
        <input
          type="range"
          min="2"
          max="6"
          step="1"
          value={gridSize}
          onChange={handleSliderChange}
          style={{
            width: `${100 * buttonScale}px`,
            accentColor: '#888',
          }}
        />
        <span style={{ minWidth: '30px', textAlign: 'center' }}>
          {gridSize}×{gridSize}
        </span>
      </div>

      <button
        style={{ ...buttonStyle, opacity: pieces.length > 0 ? 1 : 0.5 }}
        onMouseEnter={pieces.length > 0 ? handleMouseEnter : undefined}
        onMouseLeave={pieces.length > 0 ? handleMouseLeave : undefined}
        onMouseDown={pieces.length > 0 ? handleMouseDown : undefined}
        onMouseUp={pieces.length > 0 ? handleMouseUp : undefined}
        onClick={() => pieces.length > 0 && shufflePieces(true)}
        disabled={pieces.length === 0}
      >
        随机打乱
      </button>

      <button
        style={{ ...buttonStyle, opacity: pieces.length > 0 ? 1 : 0.5 }}
        onMouseEnter={pieces.length > 0 ? handleMouseEnter : undefined}
        onMouseLeave={pieces.length > 0 ? handleMouseLeave : undefined}
        onMouseDown={pieces.length > 0 ? handleMouseDown : undefined}
        onMouseUp={pieces.length > 0 ? handleMouseUp : undefined}
        onClick={() => pieces.length > 0 && saveCurrentSnapshot()}
        disabled={pieces.length === 0}
      >
        保存快照
      </button>

      <input
        ref={snapshotInputRef}
        type="file"
        accept="application/json"
        onChange={handleSnapshotUpload}
        style={{ display: 'none' }}
      />
      <button
        style={buttonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={() => snapshotInputRef.current?.click()}
      >
        加载快照
      </button>

      <button
        style={{ ...buttonStyle, opacity: pieces.length > 0 ? 1 : 0.5 }}
        onMouseEnter={pieces.length > 0 ? handleMouseEnter : undefined}
        onMouseLeave={pieces.length > 0 ? handleMouseLeave : undefined}
        onMouseDown={pieces.length > 0 ? handleMouseDown : undefined}
        onMouseUp={pieces.length > 0 ? handleMouseUp : undefined}
        onClick={() => pieces.length > 0 && resetPuzzle()}
        disabled={pieces.length === 0}
      >
        重置
      </button>
    </div>
  );
};

export default Toolbar;
