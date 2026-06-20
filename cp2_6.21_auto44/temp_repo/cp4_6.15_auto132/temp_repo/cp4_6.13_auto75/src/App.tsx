import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AudioProcessor, WaveformData } from './AudioProcessor';
import { WaveformRenderer, WaveformStyle } from './WaveformRenderer';
import { TextOverlay, TextItem, FontFamily } from './TextOverlay';
import { BackgroundManager, BackgroundConfig } from './BackgroundManager';
import { ExportManager, ExportScale, PosterConfig } from './ExportManager';
import ControlPanel from './ControlPanel';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const App: React.FC = () => {
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const waveformRendererRef = useRef<WaveformRenderer | null>(null);
  const textOverlayRef = useRef<TextOverlay | null>(null);
  const backgroundManagerRef = useRef<BackgroundManager | null>(null);

  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const wfCanvasRef = useRef<HTMLCanvasElement>(null);
  const txtCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);

  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [waveformStyle, setWaveformStyle] = useState<WaveformStyle>({
    startColor: '#00d4ff',
    endColor: '#9d4edd',
    lineWidth: 2,
    mirror: true,
    barWidth: 3,
    barGap: 2,
    cornerRadius: 2,
    style: 'mirror',
    verticalScale: 1
  });

  const [texts, setTexts] = useState<TextItem[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>('title');
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({
    mode: 'gradient',
    type: 'linear',
    startColor: '#1a1a2e',
    endColor: '#16213e',
    startX: 0,
    startY: 0,
    endX: 1,
    endY: 1
  });

  const [isRecording, setIsRecording] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [draggingGradientPoint, setDraggingGradientPoint] = useState<'start' | 'end' | null>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    audioProcessorRef.current = new AudioProcessor();

    if (bgCanvasRef.current) {
      backgroundManagerRef.current = new BackgroundManager(bgCanvasRef.current);
    }
    if (wfCanvasRef.current) {
      waveformRendererRef.current = new WaveformRenderer(wfCanvasRef.current);
    }
    if (txtCanvasRef.current) {
      textOverlayRef.current = new TextOverlay(txtCanvasRef.current);
      textOverlayRef.current.setSelectionCallback((id) => {
        setSelectedTextId(id);
        if (id) {
          const t = textOverlayRef.current?.getText(id);
          if (t) {
            setTexts(prev => prev.map(p => p.id === id ? t : p));
          }
        }
      });
    }

    const shared = ExportManager.parseShareLink();
    if (shared) {
      applySharedConfig(shared);
    }

    if (textOverlayRef.current) {
      setTexts(textOverlayRef.current.getTexts());
    }

    setTimeout(handleResize, 50);

    return () => {
      waveformRendererRef.current?.destroy();
      textOverlayRef.current?.destroy();
      backgroundManagerRef.current?.destroy();
      audioProcessorRef.current?.destroy();
    };
  }, []);

  const applySharedConfig = (config: PosterConfig) => {
    setWaveformStyle(config.waveform);
    setTimeout(() => {
      waveformRendererRef.current?.setStyle(config.waveform);
    }, 10);

    if (config.waveformData && config.waveformData.length > 0) {
      const syntheticData: WaveformData = {
        peaks: config.waveformData,
        rms: config.waveformData.map(v => v * 0.7),
        duration: 120,
        sampleRate: 44100
      };
      setWaveformData(syntheticData);
      setTimeout(() => waveformRendererRef.current?.setData(syntheticData), 10);
    }

    if (config.texts && config.texts.length > 0) {
      const validTexts = ['title', 'subtitle', 'tag'];
      const merged: TextItem[] = [];
      validTexts.forEach((id, idx) => {
        const shared = config.texts.find(t => t.id === id) || config.texts[idx];
        if (shared) {
          merged.push({ ...shared, id });
        }
      });
      if (merged.length > 0) {
        setTexts(merged);
        setTimeout(() => textOverlayRef.current?.setTexts(merged), 10);
      }
    }

    const bg = config.background;
    if (bg.mode) {
      let newBg: BackgroundConfig;
      if (bg.mode === 'solid') {
        newBg = { mode: 'solid', color: bg.color || '#1a1a2e' };
      } else if (bg.mode === 'gradient') {
        newBg = {
          mode: 'gradient',
          type: bg.type || 'linear',
          startColor: bg.startColor || '#1a1a2e',
          endColor: bg.endColor || '#16213e',
          startX: bg.startX ?? 0,
          startY: bg.startY ?? 0,
          endX: bg.endX ?? 1,
          endY: bg.endY ?? 1
        };
      } else {
        newBg = {
          mode: 'solid',
          color: '#1a1a2e'
        };
      }
      setBackgroundConfig(newBg);
      setTimeout(() => backgroundManagerRef.current?.setConfig(newBg, false), 10);
    }
  };

  const handleResize = useCallback(() => {
    if (!previewAreaRef.current || !overlayRef.current) return;
    const rect = previewAreaRef.current.getBoundingClientRect();
    const padding = 40;
    const availW = Math.max(300, rect.width - padding * 2);
    const availH = Math.max(200, rect.height - padding * 2 - 40);
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    let w = availW;
    let h = w / aspect;
    if (h > availH) {
      h = availH;
      w = h * aspect;
    }
    const scale = w / CANVAS_WIDTH;
    setPreviewScale(scale);
    setPreviewSize({ width: w, height: h });

    setTimeout(() => {
      backgroundManagerRef.current?.resize(w, h);
      waveformRendererRef.current?.resize(w, h);
      textOverlayRef.current?.resize(w, h);
    }, 10);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    waveformRendererRef.current?.setStyle(waveformStyle);
  }, [waveformStyle]);

  useEffect(() => {
    if (texts.length === 0) return;
    textOverlayRef.current?.setTexts(texts);
  }, [texts]);

  useEffect(() => {
    if (backgroundConfig.mode === 'image' && !backgroundConfig.image) return;
    backgroundManagerRef.current?.setConfig(backgroundConfig);
  }, [backgroundConfig]);

  const clearError = useCallback(() => setTimeout(() => setError(null), 3000), []);

  const handleUploadAudio = useCallback(async (file: File) => {
    if (!audioProcessorRef.current) return;
    if (!AudioProcessor.validateFile(file)) {
      setError('不支持的音频格式，请上传 MP3 或 WAV 文件');
      clearError();
      return;
    }
    try {
      setError(null);
      const data = await audioProcessorRef.current.loadFromFile(file);
      setWaveformData(data);
      waveformRendererRef.current?.setData(data);
    } catch (e: any) {
      setError(e.message || '音频加载失败');
      clearError();
    }
  }, [clearError]);

  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      audioProcessorRef.current?.resumeContext();
      await audioProcessorRef.current?.startRecording();
      setIsRecording(true);
    } catch (e: any) {
      setError('无法访问麦克风：' + (e.message || '请检查权限'));
      clearError();
    }
  }, [clearError]);

  const handleStopRecording = useCallback(async () => {
    try {
      const data = await audioProcessorRef.current?.stopRecording();
      if (data) {
        setWaveformData(data);
        waveformRendererRef.current?.setData(data);
      }
    } catch (e: any) {
      setError('录音失败：' + (e.message || ''));
      clearError();
    } finally {
      setIsRecording(false);
    }
  }, [clearError]);

  const handleUploadImage = useCallback(async (file: File) => {
    try {
      setError(null);
      await backgroundManagerRef.current?.loadImage(file);
      const cfg = backgroundManagerRef.current?.getConfig();
      if (cfg) setBackgroundConfig({ ...cfg });
    } catch (e: any) {
      setError('图片加载失败：' + (e.message || ''));
      clearError();
    }
  }, [clearError]);

  const handleSelectText = useCallback((id: string | null) => {
    setSelectedTextId(id);
    textOverlayRef.current?.setSelected(id);
  }, []);

  const handleTextUpdate = useCallback((id: string, updates: any) => {
    textOverlayRef.current?.updateText(id, updates);
    const t = textOverlayRef.current?.getText(id);
    if (t) {
      setTexts(prev => prev.map(p => p.id === id ? t : p));
    }
  }, []);

  const handleWaveformStyleChange = useCallback((style: Partial<WaveformStyle>) => {
    setWaveformStyle(prev => ({ ...prev, ...style }));
  }, []);

  const handleBackgroundChange = useCallback((config: BackgroundConfig) => {
    if (config.mode === 'image') {
      const current = backgroundManagerRef.current?.getConfig();
      if (current && current.mode === 'image') {
        config = { ...config, image: current.image } as any;
      }
    }
    setBackgroundConfig(config);
  }, []);

  const handleExport = useCallback(async (scale: ExportScale) => {
    try {
      const w = CANVAS_WIDTH;
      const h = CANVAS_HEIGHT;

      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);

      backgroundManagerRef.current?.drawToContext(ctx, 0, 0, w, h);

      const tempWf = document.createElement('canvas');
      tempWf.width = w;
      tempWf.height = h;
      const wfStyle = waveformRendererRef.current?.getStyle() || waveformStyle;
      const wfData = waveformRendererRef.current?.getData() || waveformData;

      if (wfData) {
        const tempRenderer = new WaveformRenderer(tempWf);
        tempRenderer.setStyle(wfStyle);
        tempRenderer.resize(w, h);
        tempRenderer.setData(wfData);
        await new Promise(r => setTimeout(r, 30));
        ctx.drawImage(tempWf, 0, 0, w, h);
        tempRenderer.destroy();
      }

      const currentTexts = textOverlayRef.current?.getTexts() || texts;
      const FONT_MAP: Record<string, string> = {
        'serif': 'Georgia, "Times New Roman", Times, serif',
        'sans-serif': '"Helvetica Neue", Helvetica, Arial, sans-serif',
        'handwriting': '"Brush Script MT", "Lucida Handwriting", cursive',
        'decorative': 'Impact, "Arial Black", fantasy',
        'monospace': '"Courier New", Courier, monospace'
      };

      for (const text of currentTexts) {
        if (!text.content.trim()) continue;
        const style = text.style;
        const parts: string[] = [];
        if (style.italic) parts.push('italic');
        parts.push(style.fontWeight);
        parts.push(`${style.fontSize}px`);
        parts.push(FONT_MAP[style.fontFamily] || 'sans-serif');
        ctx.font = parts.join(' ');
        ctx.fillStyle = style.color;
        ctx.textAlign = style.alignment;
        ctx.textBaseline = 'alphabetic';
        const shadow = style.textShadow;
        if (shadow.blur > 0 || shadow.offsetX !== 0 || shadow.offsetY !== 0) {
          ctx.shadowColor = shadow.color;
          ctx.shadowOffsetX = shadow.offsetX;
          ctx.shadowOffsetY = shadow.offsetY;
          ctx.shadowBlur = shadow.blur;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        ctx.fillText(text.content, text.x * w, text.y * h);
      }

      await ExportManager.exportToPNG(canvas, scale);
    } catch (e: any) {
      setError('导出失败：' + (e.message || ''));
      clearError();
    }
  }, [waveformStyle, waveformData, texts, clearError]);

  const handleGenerateShare = useCallback(() => {
    try {
      const currentTexts = textOverlayRef.current?.getTexts() || texts;
      const cfg: PosterConfig = {
        v: 1,
        waveform: waveformRendererRef.current?.getStyle() || waveformStyle,
        waveformData: waveformData ? waveformData.peaks : null,
        texts: currentTexts,
        background: {
          mode: backgroundConfig.mode,
          type: backgroundConfig.mode === 'gradient' ? (backgroundConfig as any).type : undefined,
          color: backgroundConfig.mode === 'solid' ? (backgroundConfig as any).color : undefined,
          startColor: backgroundConfig.mode === 'gradient' ? (backgroundConfig as any).startColor : undefined,
          endColor: backgroundConfig.mode === 'gradient' ? (backgroundConfig as any).endColor : undefined,
          startX: backgroundConfig.mode === 'gradient' ? (backgroundConfig as any).startX : undefined,
          startY: backgroundConfig.mode === 'gradient' ? (backgroundConfig as any).startY : undefined,
          endX: backgroundConfig.mode === 'gradient' ? (backgroundConfig as any).endX : undefined,
          endY: backgroundConfig.mode === 'gradient' ? (backgroundConfig as any).endY : undefined,
          blur: backgroundConfig.mode === 'image' ? (backgroundConfig as any).blur : undefined,
          overlayOpacity: backgroundConfig.mode === 'image' ? (backgroundConfig as any).overlayOpacity : undefined,
          overlayColor: backgroundConfig.mode === 'image' ? (backgroundConfig as any).overlayColor : undefined,
        },
        canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
      };
      const link = ExportManager.generateShareLink(cfg);
      setShareLink(link);
    } catch (e: any) {
      setError('生成分享链接失败');
      clearError();
    }
  }, [waveformStyle, waveformData, texts, backgroundConfig, clearError]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (backgroundConfig.mode === 'gradient') {
      const startX = (backgroundConfig as any).startX * previewSize.width;
      const startY = (backgroundConfig as any).startY * previewSize.height;
      const endX = (backgroundConfig as any).endX * previewSize.width;
      const endY = (backgroundConfig as any).endY * previewSize.height;
      const startDist = Math.hypot(x - startX, y - startY);
      const endDist = Math.hypot(x - endX, y - endY);
      if (startDist < 16) {
        setDraggingGradientPoint('start');
        return;
      }
      if (endDist < 16) {
        setDraggingGradientPoint('end');
        return;
      }
    }

    const text = textOverlayRef.current?.selectAtPoint(x, y);
    if (text) {
      textOverlayRef.current?.startDrag(text.id, x, y);
    } else {
      setSelectedTextId(null);
    }
  }, [backgroundConfig, previewSize]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clampedX = Math.max(0, Math.min(previewSize.width, x));
    const clampedY = Math.max(0, Math.min(previewSize.height, y));

    if (draggingGradientPoint && backgroundConfig.mode === 'gradient') {
      const relX = clampedX / previewSize.width;
      const relY = clampedY / previewSize.height;
      backgroundManagerRef.current?.updateGradientPoint(draggingGradientPoint, relX, relY);
      setBackgroundConfig(prev => {
        if (prev.mode !== 'gradient') return prev;
        if (draggingGradientPoint === 'start') {
          return { ...prev, startX: relX, startY: relY };
        } else {
          return { ...prev, endX: relX, endY: relY };
        }
      });
      return;
    }

    textOverlayRef.current?.moveDrag(clampedX, clampedY);
    textOverlayRef.current?.updateHover(clampedX, clampedY);
  }, [draggingGradientPoint, backgroundConfig, previewSize]);

  const handleCanvasMouseUp = useCallback(() => {
    if (draggingGradientPoint) {
      setDraggingGradientPoint(null);
    }
    textOverlayRef.current?.endDrag();
    const texts = textOverlayRef.current?.getTexts();
    if (texts) setTexts(texts);
  }, [draggingGradientPoint]);

  const renderGradientHandles = () => {
    if (backgroundConfig.mode !== 'gradient') return null;
    const s = previewSize;
    const sx = (backgroundConfig as any).startX * s.width;
    const sy = (backgroundConfig as any).startY * s.height;
    const ex = (backgroundConfig as any).endX * s.width;
    const ey = (backgroundConfig as any).endY * s.height;

    return (
      <>
        <svg style={{
          position: 'absolute', top: 0, left: 0, width: s.width, height: s.height,
          pointerEvents: 'none'
        }}>
          <line x1={sx} y1={sy} x2={ex} y2={ey}
            stroke="#ffffff" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="4 4" />
        </svg>
        <div style={{
          position: 'absolute',
          left: sx - 10, top: sy - 10,
          width: 20, height: 20, borderRadius: '50%',
          background: (backgroundConfig as any).startColor,
          border: '2px solid #ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          cursor: 'grab',
          zIndex: 5
        }} title="渐变起点" />
        <div style={{
          position: 'absolute',
          left: ex - 10, top: ey - 10,
          width: 20, height: 20, borderRadius: '50%',
          background: (backgroundConfig as any).endColor,
          border: '2px solid #ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          cursor: 'grab',
          zIndex: 5
        }} title="渐变终点" />
      </>
    );
  };

  const handleZoom = (factor: number) => {
    const newScale = Math.max(0.25, Math.min(3, previewScale * factor));
    const targetW = CANVAS_WIDTH * newScale;
    const targetH = CANVAS_HEIGHT * newScale;
    setPreviewScale(newScale);
    setPreviewSize({ width: targetW, height: targetH });
    setTimeout(() => {
      backgroundManagerRef.current?.resize(targetW, targetH);
      waveformRendererRef.current?.resize(targetW, targetH);
      textOverlayRef.current?.resize(targetW, targetH);
    }, 10);
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      background: 'var(--bg-main)',
      overflow: 'hidden',
    }}>
      <ControlPanel
        waveformStyle={waveformStyle}
        onWaveformStyleChange={handleWaveformStyleChange}
        texts={texts}
        selectedTextId={selectedTextId}
        onSelectText={handleSelectText}
        onTextUpdate={handleTextUpdate}
        backgroundConfig={backgroundConfig}
        onBackgroundConfigChange={handleBackgroundChange}
        onUploadAudio={handleUploadAudio}
        onUploadImage={handleUploadImage}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        isRecording={isRecording}
        onExport={handleExport}
        onGenerateShare={handleGenerateShare}
        shareLink={shareLink}
        error={error}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}>
        <div ref={previewAreaRef} style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          paddingBottom: '72px',
          overflow: 'auto',
          minWidth: 0,
          minHeight: 0,
        }}>
          <div
            ref={overlayRef}
            style={{
              position: 'relative',
              width: previewSize.width,
              height: previewSize.height,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              borderRadius: 12,
              overflow: 'hidden',
              userSelect: 'none',
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <canvas ref={bgCanvasRef} style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              borderRadius: 12,
            }} />
            <canvas ref={wfCanvasRef} style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              borderRadius: 12,
              pointerEvents: 'none'
            }} />
            <canvas ref={txtCanvasRef} style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              borderRadius: 12,
              pointerEvents: 'none'
            }} />
            {renderGradientHandles()}
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: 'rgba(20, 20, 40, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderTop: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 12,
            color: 'var(--text-secondary)',
            fontFamily: 'monospace'
          }}>
            <span>📐</span>
            <span>画布: {CANVAS_WIDTH} × {CANVAS_HEIGHT}</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>预览: {Math.round(previewSize.width)} × {Math.round(previewSize.height)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => handleZoom(1 / 1.2)}
              className="secondary"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
              title="缩小">−</button>
            <div style={{
              minWidth: 60,
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--accent)',
              fontWeight: 600,
              fontFamily: 'monospace'
            }}>
              {Math.round(previewScale * 100)}%
            </div>
            <button
              onClick={() => handleZoom(1.2)}
              className="secondary"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
              title="放大">+</button>
            <button
              onClick={() => { handleResize(); }}
              className="secondary"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
              title="适配窗口">⛶</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
