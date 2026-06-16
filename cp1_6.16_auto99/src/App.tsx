import React, { useState } from 'react';
import { Upload, Wand2, Download, RotateCcw, Settings, AlertCircle, Loader2 } from 'lucide-react';
import { CanvasView } from './ui/CanvasView';
import { PathPanel } from './ui/PathPanel';
import { usePathStore } from './store/usePathStore';

const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop';

function App() {
  const [imageUrlInput, setImageUrlInput] = useState(DEFAULT_IMAGE_URL);
  const [threshold, setThreshold] = useState(80);
  const [rdpEpsilon, setRdpEpsilon] = useState(2.0);
  const [showSettings, setShowSettings] = useState(false);

  const {
    setImage,
    generatePaths,
    exportSVG,
    resetImageTransform,
    paths,
    imageUrl,
    isProcessing,
    error,
  } = usePathStore();

  const handleUpload = async () => {
    if (!imageUrlInput.trim()) {
      return;
    }
    await setImage(imageUrlInput.trim());
  };

  const handleGenerate = async () => {
    await generatePaths(threshold, rdpEpsilon);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpload();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
          </svg>
          SketchToVector
        </h1>
        <p className="app-subtitle">手绘草图转可编辑矢量路径工具</p>
      </header>

      <div className="upload-section glass-panel">
        <div className="upload-input-group">
          <div className="input-wrapper">
            <input
              type="text"
              className="url-input"
              placeholder="输入图片URL..."
              value={imageUrlInput}
              onChange={e => setImageUrlInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={isProcessing || !imageUrlInput.trim()}
          >
            {isProcessing ? <Loader2 className="spin" size={18} /> : <Upload size={18} />}
            上传图片
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleGenerate}
            disabled={isProcessing || !imageUrl}
          >
            {isProcessing ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
            生成路径
          </button>
          <button
            className="btn btn-secondary"
            onClick={exportSVG}
            disabled={paths.length === 0}
          >
            <Download size={18} />
            导出SVG
          </button>
          <button
            className="btn btn-icon"
            onClick={resetImageTransform}
            disabled={!imageUrl}
            title="重置视图"
          >
            <RotateCcw size={18} />
          </button>
          <button
            className={`btn btn-icon ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="参数设置"
          >
            <Settings size={18} />
          </button>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="setting-item">
              <label>边缘检测阈值: {threshold}</label>
              <input
                type="range"
                min="20"
                max="200"
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>路径简化精度: {rdpEpsilon.toFixed(1)}</label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={rdpEpsilon}
                onChange={e => setRdpEpsilon(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        <div className="upload-hints">
          <span>💡 提示：上传清晰的线稿图片效果最佳</span>
          <span>🖱️ 滚轮缩放 · 左键拖动平移 · 拖拽红色节点调整路径</span>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="canvas-wrapper">
          <CanvasView />
        </div>
        <PathPanel />
      </div>

      <footer className="app-footer">
        <p>拖拽红色节点可实时调整曲线形状 · 右侧面板管理路径 · 支持导出SVG格式</p>
      </footer>
    </div>
  );
}

export default App;
