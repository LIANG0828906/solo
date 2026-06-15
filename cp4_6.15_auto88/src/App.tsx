import React, { useState, useRef, useEffect, useCallback } from 'react';
import BgSelector from './BgSelector';
import { BackgroundTemplate, backgroundGenerator } from './BackgroundGenerator';
import { imageProcessor, SegmentationResult, ProcessOptions } from './ImageProcessor';
import './App.css';

type TabType = 'background' | 'adjust';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [segmentation, setSegmentation] = useState<SegmentationResult | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('background');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isDraggingPerson, setIsDraggingPerson] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [options, setOptions] = useState<ProcessOptions>({
    edgeSoftness: 30,
    personScale: 1.0,
    personOffset: { x: 0, y: 0 }
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#667eea');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const isColorBackgroundRef = useRef(false);

  const templates = backgroundGenerator.getPresetTemplates();

  const CANVAS_WIDTH = 960;
  const CANVAS_HEIGHT = 540;

  useEffect(() => {
    imageProcessor.loadModel();
  }, []);

  useEffect(() => {
    if (uploadedImage && segmentation && backgroundImage) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      imageProcessor.compositeImage(
        ctx,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        uploadedImage,
        backgroundImage,
        segmentation,
        options
      );
    }
  }, [uploadedImage, segmentation, backgroundImage, options]);

  useEffect(() => {
    if (isColorBackgroundRef.current && uploadedImage && segmentation) {
      const animateParticles = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (particlesRef.current.length < 50 && Math.random() > 0.7) {
          particlesRef.current.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 4 + 1,
            opacity: Math.random() * 0.5 + 0.2
          });
        }

        particlesRef.current = particlesRef.current.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.opacity *= 0.995;
          return p.opacity > 0.1 && p.x > 0 && p.x < CANVAS_WIDTH && p.y > 0 && p.y < CANVAS_HEIGHT;
        });

        if (uploadedImage && segmentation && backgroundImage) {
          imageProcessor.compositeImage(
            ctx,
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            uploadedImage,
            backgroundImage,
            segmentation,
            options
          );
        }

        particlesRef.current.forEach(p => {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        animationFrameRef.current = requestAnimationFrame(animateParticles);
      };

      animationFrameRef.current = requestAnimationFrame(animateParticles);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isColorBackgroundRef.current, uploadedImage, segmentation, backgroundImage, options]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过5MB');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('仅支持JPG和PNG格式');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    try {
      const img = await backgroundGenerator.generateFromUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(async () => {
        setUploadedImage(img);
        setIsUploading(false);
        setIsProcessing(true);

        try {
          const segResult = await imageProcessor.segmentPerson(img);
          setSegmentation(segResult);
          setIsProcessing(false);

          if (!backgroundImage) {
            const defaultBg = await backgroundGenerator.generateByStyle('gradient', CANVAS_WIDTH, CANVAS_HEIGHT);
            setBackgroundImage(defaultBg);
            setSelectedTemplateId(templates[0].id);
          }
        } catch (err) {
          console.error('人像分割失败:', err);
          setIsProcessing(false);
          alert('人像处理失败，请重试');
        }
      }, 300);
    } catch (err) {
      clearInterval(progressInterval);
      setIsUploading(false);
      console.error('图片加载失败:', err);
      alert('图片加载失败，请重试');
    }
  }, [backgroundImage, templates]);

  const handleSelectTemplate = useCallback(async (template: BackgroundTemplate) => {
    setSelectedTemplateId(template.id);
    isColorBackgroundRef.current = false;
    particlesRef.current = [];

    setBackgroundImage(null);
    setTimeout(async () => {
      const bg = await backgroundGenerator.generateByStyle(template.style, CANVAS_WIDTH, CANVAS_HEIGHT);
      setBackgroundImage(bg);
    }, 50);
  }, []);

  const handleSelectColor = useCallback(async (color: string) => {
    setSelectedColor(color);
    setSelectedTemplateId(null);
    isColorBackgroundRef.current = true;
    particlesRef.current = [];

    setBackgroundImage(null);
    setTimeout(async () => {
      const bg = await backgroundGenerator.generateFromColor(color, CANVAS_WIDTH, CANVAS_HEIGHT);
      setBackgroundImage(bg);
    }, 50);
  }, []);

  const handleUploadBackground = useCallback(async (file: File) => {
    setSelectedTemplateId(null);
    isColorBackgroundRef.current = false;
    particlesRef.current = [];

    try {
      const bg = await backgroundGenerator.generateFromUpload(file);
      setBackgroundImage(bg);
    } catch (err) {
      console.error('背景图片加载失败:', err);
      alert('背景图片加载失败，请重试');
    }
  }, []);

  const handleExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage || !segmentation) {
      alert('请先上传照片并选择背景');
      return;
    }

    setIsScanning(true);

    setTimeout(async () => {
      try {
        const blob = await imageProcessor.exportToPNG(canvas, { width: 1920, height: 1080 });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `virtual-background-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('导出失败:', err);
        alert('导出失败，请重试');
      } finally {
        setTimeout(() => setIsScanning(false), 500);
      }
    }, 1500);
  }, [uploadedImage, segmentation]);

  const handleApplyToMeeting = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage || !segmentation) {
      alert('请先上传照片并选择背景');
      return;
    }

    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
          } catch {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meeting-background-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
          }
        }
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请重试');
    }
  }, [uploadedImage, segmentation]);

  const handleSliderChange = useCallback((key: keyof ProcessOptions, value: number) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handlePersonDragStart = useCallback((e: React.MouseEvent) => {
    if (!uploadedImage || !segmentation) return;
    setIsDraggingPerson(true);
    setDragStart({
      x: e.clientX - options.personOffset.x,
      y: e.clientY - options.personOffset.y
    });
  }, [uploadedImage, segmentation, options.personOffset]);

  const handlePersonDragMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingPerson) return;
    setOptions(prev => ({
      ...prev,
      personOffset: {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }
    }));
  }, [isDraggingPerson, dragStart]);

  const handlePersonDragEnd = useCallback(() => {
    setIsDraggingPerson(false);
  }, []);

  const handleResetPosition = useCallback(() => {
    setOptions(prev => ({
      ...prev,
      personOffset: { x: 0, y: 0 }
    }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">🎨</span>
          虚拟会议背景生成器
        </h1>
        <p className="app-subtitle">上传照片，一键生成专业会议背景</p>
      </header>

      <div className="main-content">
        <div className="canvas-section">
          {!uploadedImage && !isUploading && !isProcessing && (
            <div
              className="upload-area"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="upload-content">
                <div className="upload-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <h2 className="upload-title">点击或拖拽上传照片</h2>
                <p className="upload-desc">支持 JPG/PNG 格式，文件大小不超过 5MB</p>
                <button className="upload-btn-primary">
                  选择照片
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          )}

          {(isUploading || isProcessing) && (
            <div className="processing-area">
              {isUploading && (
                <>
                  <div className="wave-progress">
                    <svg className="wave-svg" viewBox="0 0 120 30" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#e94560" />
                          <stop offset="100%" stopColor="#ff6b6b" />
                        </linearGradient>
                      </defs>
                      <path
                        className="wave-path"
                        d="M0,15 Q15,5 30,15 T60,15 T90,15 T120,15 L120,30 L0,30 Z"
                        fill="url(#waveGradient)"
                      />
                      <path
                        className="wave-path wave-path-2"
                        d="M0,15 Q15,25 30,15 T60,15 T90,15 T120,15 L120,30 L0,30 Z"
                        fill="rgba(233, 69, 96, 0.3)"
                      />
                    </svg>
                    <div className="progress-text">
                      {Math.round(uploadProgress)}%
                    </div>
                  </div>
                  <p className="processing-text">正在上传图片...</p>
                </>
              )}
              {isProcessing && (
                <>
                  <div className="loading-spinner" />
                  <p className="processing-text">正在识别人像，请稍候...</p>
                </>
              )}
            </div>
          )}

          {uploadedImage && !isUploading && !isProcessing && (
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className={`main-canvas ${isScanning ? 'scanning' : ''}`}
                onMouseDown={handlePersonDragStart}
                onMouseMove={handlePersonDragMove}
                onMouseUp={handlePersonDragEnd}
                onMouseLeave={handlePersonDragEnd}
                style={{ cursor: isDraggingPerson ? 'grabbing' : 'grab' }}
              />
              {isScanning && <div className="scan-line" />}
              {showCopied && <div className="copied-toast">✅ 已复制到剪贴板</div>}
            </div>
          )}

          {uploadedImage && !isUploading && !isProcessing && (
            <div className="canvas-toolbar">
              <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                重新上传
              </button>
              <button className="btn-primary" onClick={handleExport}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                导出图片 (1920×1080)
              </button>
              <button className="btn-secondary" onClick={handleApplyToMeeting}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                应用到会议软件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          )}
        </div>

        <div className="control-panel">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'background' ? 'active' : ''}`}
              onClick={() => setActiveTab('background')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              背景选择
            </button>
            <button
              className={`tab-btn ${activeTab === 'adjust' ? 'active' : ''}`}
              onClick={() => setActiveTab('adjust')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24"/>
              </svg>
              调节参数
            </button>
            <div className="tab-indicator" style={{ transform: `translateX(${activeTab === 'background' ? 0 : 100}%)` }} />
          </div>

          <div className="tab-content">
            <div className={`tab-pane ${activeTab === 'background' ? 'active' : ''}`}>
              <BgSelector
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={handleSelectTemplate}
                onSelectColor={handleSelectColor}
                onUploadBackground={handleUploadBackground}
                selectedColor={selectedColor}
              />
            </div>
            <div className={`tab-pane ${activeTab === 'adjust' ? 'active' : ''}`}>
              <div className="adjust-panel">
                <div className="slider-group">
                  <div className="slider-header">
                    <label className="slider-label">边缘柔化</label>
                    <span className="slider-value">{options.edgeSoftness}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={options.edgeSoftness}
                    onChange={(e) => handleSliderChange('edgeSoftness', parseInt(e.target.value))}
                    className="custom-slider"
                  />
                  <div className="slider-track">
                    <div
                      className="slider-fill"
                      style={{ width: `${options.edgeSoftness}%` }}
                    />
                  </div>
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <label className="slider-label">人像缩放</label>
                    <span className="slider-value">{options.personScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.01"
                    value={options.personScale}
                    onChange={(e) => handleSliderChange('personScale', parseFloat(e.target.value))}
                    className="custom-slider"
                  />
                  <div className="slider-track">
                    <div
                      className="slider-fill"
                      style={{ width: `${((options.personScale - 0.8) / 0.7) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <label className="slider-label">
                      人像偏移
                      <span className="offset-hint">（拖拽画布调整）</span>
                    </label>
                    <span className="slider-value">
                      X: {Math.round(options.personOffset.x)} Y: {Math.round(options.personOffset.y)}
                    </span>
                  </div>
                  <div className="offset-control">
                    <div className="crosshair">
                      <div className="crosshair-h" />
                      <div className="crosshair-v" />
                      <div
                        className="crosshair-dot"
                        style={{
                          transform: `translate(${Math.max(-50, Math.min(50, options.personOffset.x / 2))}px, ${Math.max(-50, Math.min(50, options.personOffset.y / 2))}px)`
                        }}
                      />
                    </div>
                    <button className="btn-reset" onClick={handleResetPosition}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                      </svg>
                      重置位置
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
