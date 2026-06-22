import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import type { ContentType } from '../utils/types';
import './CreateModal.css';

export function CreateModal() {
  const { showCreateModal, setShowCreateModal, activeTab, setActiveTab, addCard } =
    useStore();

  const [textContent, setTextContent] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#2a2a2e');
  const [lineWidth, setLineWidth] = useState(3);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (showCreateModal) {
      setTextContent('');
      setImageData(null);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [showCreateModal]);

  useEffect(() => {
    if (activeTab === 'drawing' && showCreateModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeTab, showCreateModal]);

  const handleClose = () => {
    setShowCreateModal(false);
  };

  const handleConfirm = () => {
    if (activeTab === 'text' && textContent.trim()) {
      addCard(textContent.trim(), 'text');
    } else if (activeTab === 'image' && imageData) {
      addCard(imageData, 'image');
    } else if (activeTab === 'drawing' && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      addCard(dataUrl, 'drawing');
    }
    setTextContent('');
    setImageData(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageFile = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(progress);
      }
    };

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageData(result);
      setIsUploading(false);
      setUploadProgress(100);
    };

    reader.readAsDataURL(file);
  };

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    lastPosRef.current = pos;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);

    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPosRef.current = pos;
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  if (!showCreateModal) return null;

  const canConfirm =
    (activeTab === 'text' && textContent.trim()) ||
    (activeTab === 'image' && imageData) ||
    activeTab === 'drawing';

  return (
    <div className="create-modal-overlay" onClick={handleClose}>
      <div className="create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>新建灵感</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-tabs">
          {(['text', 'image', 'drawing'] as ContentType[]).map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'text' && '📝 文字'}
              {tab === 'image' && '🖼️ 图片'}
              {tab === 'drawing' && '✏️ 绘图'}
            </button>
          ))}
        </div>

        <div className="modal-content">
          {activeTab === 'text' && (
            <div className="text-tab">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="写下你的灵感碎片..."
                className="inspiration-textarea"
                autoFocus
                rows={5}
              />
              <div className="char-count">{textContent.length} 字</div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="image-tab">
              {!imageData ? (
                <div
                  className="upload-area"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {isUploading ? (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span>上传中 {uploadProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <div className="upload-icon">📤</div>
                      <p>点击或拖拽图片到此处上传</p>
                      <p className="upload-hint">支持 JPG、PNG、GIF 等格式</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="image-preview">
                  <img src={imageData} alt="预览" />
                  <button
                    className="reupload-btn"
                    onClick={() => {
                      setImageData(null);
                      setUploadProgress(0);
                    }}
                  >
                    重新上传
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'drawing' && (
            <div className="drawing-tab">
              <div className="drawing-toolbar">
                <div className="color-picker">
                  {['#2a2a2e', '#ff8c42', '#4a90d9', '#e8a0bf', '#7ed6a0', '#e74c3c'].map(
                    (color) => (
                      <button
                        key={color}
                        className={`color-dot ${drawColor === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setDrawColor(color)}
                      />
                    )
                  )}
                </div>
                <div className="line-width-picker">
                  <span>粗细</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                  />
                </div>
                <button className="clear-btn" onClick={handleClearCanvas}>
                  清空
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={560}
                height={300}
                className="drawing-canvas"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleClose}>
            取消
          </button>
          <button
            className={`confirm-btn ${canConfirm ? '' : 'disabled'}`}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            添加到画布
          </button>
        </div>
      </div>
    </div>
  );
}
