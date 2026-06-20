import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from './stores/editorStore';
import { ParticleEngine } from './ParticleEngine';
import { ParticleRenderer } from './ParticleRenderer';
import { AnimationController } from './AnimationController';
import { Exporter } from './Exporter';
import { THEME_LIST } from './themes';
import type { ThemeType } from './types';
import type { AnimationEvent } from './AnimationController';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const rendererRef = useRef<ParticleRenderer | null>(null);
  const controllerRef = useRef<AnimationController | null>(null);
  const isInitializedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const textConfig = useEditorStore((s) => s.textConfig);
  const theme = useEditorStore((s) => s.theme);
  const particleParams = useEditorStore((s) => s.particleParams);
  const animationState = useEditorStore((s) => s.animationState);
  const exportProgress = useEditorStore((s) => s.exportProgress);
  const isExporting = useEditorStore((s) => s.isExporting);

  const setText = useEditorStore((s) => s.setText);
  const setTheme = useEditorStore((s) => s.setTheme);
  const setParticleSize = useEditorStore((s) => s.setParticleSize);
  const setDissipateSpeed = useEditorStore((s) => s.setDissipateSpeed);
  const setDirectionRandomness = useEditorStore((s) => s.setDirectionRandomness);
  const setProgress = useEditorStore((s) => s.setProgress);
  const setRemainingTime = useEditorStore((s) => s.setRemainingTime);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const setIsPaused = useEditorStore((s) => s.setIsPaused);
  const resetAnimation = useEditorStore((s) => s.resetAnimation);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const setSpeedMultiplier = useEditorStore((s) => s.setSpeedMultiplier);
  const setExportProgress = useEditorStore((s) => s.setExportProgress);
  const setIsExporting = useEditorStore((s) => s.setIsExporting);
  const generateExportConfig = useEditorStore((s) => s.generateExportConfig);
  const loadExportConfig = useEditorStore((s) => s.loadExportConfig);

  const getCanvasSize = useCallback(() => {
    if (!previewAreaRef.current) return { width: 800, height: 600 };
    const rect = previewAreaRef.current.getBoundingClientRect();
    return {
      width: Math.max(320, Math.floor(rect.width)),
      height: Math.max(240, Math.floor(rect.height))
    };
  }, []);

  const initController = useCallback(() => {
    if (!canvasRef.current) return;

    const engine = new ParticleEngine();
    const renderer = new ParticleRenderer();
    const controller = new AnimationController(engine, renderer);

    renderer.attach(canvasRef.current);
    engineRef.current = engine;
    rendererRef.current = renderer;
    controllerRef.current = controller;

    const { width, height } = getCanvasSize();
    renderer.resize(width, height);

    controller.init(
      {
        textConfig,
        theme,
        particleParams,
        dissipateDuration: particleParams.dissipateSpeed
      },
      width,
      height
    );

    controller.events.subscribe((event: AnimationEvent) => {
      if (event.type === 'state') {
        setIsPlaying(event.isPlaying);
        setIsPaused(event.isPaused);
        setProgress(event.progress);
        setRemainingTime(event.remainingTime);
      } else if (event.type === 'complete') {
        setTimeout(() => {
          setIsPlaying(false);
          setIsPaused(false);
        }, 100);
      } else if (event.type === 'reset') {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
      }
    });

    isInitializedRef.current = true;
  }, [
    textConfig,
    theme,
    particleParams,
    getCanvasSize,
    setIsPlaying,
    setIsPaused,
    setProgress,
    setRemainingTime
  ]);

  const regenerateParticles = useCallback(() => {
    if (!controllerRef.current) return;
    
    const wasPlaying = controllerRef.current.getIsPlaying();
    
    controllerRef.current.regenerate({
      textConfig,
      theme,
      particleParams,
      dissipateDuration: particleParams.dissipateSpeed
    });

    if (wasPlaying) {
      controllerRef.current.play();
    }
  }, [textConfig, theme, particleParams]);

  const debouncedRegenerate = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      regenerateParticles();
    }, 150);
  }, [regenerateParticles]);

  const handleTriggerAnimation = useCallback(() => {
    if (!controllerRef.current) return;
    if (isExporting) return;

    const controller = controllerRef.current;
    if (controller.getIsPlaying() && !controller.getIsPaused()) {
      return;
    }
    controller.play();
  }, [isExporting]);

  const handleReset = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.reset();
    resetAnimation();
  }, [resetAnimation]);

  const handleTogglePlay = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.togglePlay();
  }, []);

  const handleResize = useCallback(() => {
    if (!controllerRef.current || !previewAreaRef.current) return;
    
    const { width, height } = getCanvasSize();
    controllerRef.current.resize(width, height);
    
    if (controllerRef.current && !controllerRef.current.getIsPlaying()) {
      const { width, height } = getCanvasSize();
      controllerRef.current.regenerate({
        textConfig,
        theme,
        particleParams,
        dissipateDuration: particleParams.dissipateSpeed
      });
    }
  }, [getCanvasSize, textConfig, theme, particleParams]);

  useEffect(() => {
    initController();

    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [initController]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleReset]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (previewAreaRef.current) {
      resizeObserver.observe(previewAreaRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    if (!isInitializedRef.current) return;
    debouncedRegenerate();
  }, [textConfig, theme, debouncedRegenerate]);

  useEffect(() => {
    if (!controllerRef.current || !isInitializedRef.current) return;
    controllerRef.current.updateParams(particleParams);
    controllerRef.current.setSpeedMultiplier(animationState.speedMultiplier);
  }, [particleParams, animationState.speedMultiplier]);

  const handleExportGIF = useCallback(async () => {
    if (!controllerRef.current || isExporting) return;
    setShowExportMenu(false);

    const controller = controllerRef.current;
    const { width, height } = controller.getCanvasDimensions();
    const duration = particleParams.dissipateSpeed;

    setIsExporting(true);
    setExportProgress(0);

    try {
      controller.reset();
      await new Promise((r) => setTimeout(r, 100));
      controller.play();

      const gifData = await Exporter.exportGIF(
        () => controller.captureFrame(),
        {
          fps: 15,
          duration,
          width,
          height,
          onProgress: (p) => setExportProgress(Math.floor(p * 100))
        }
      );

      if (gifData.startsWith('data:image/gif')) {
        Exporter.downloadGIF(gifData);
      } else if (gifData.startsWith('data:image/png')) {
        const link = document.createElement('a');
        link.download = `particle-preview-${Date.now()}.png`;
        link.href = gifData;
        link.click();
      }

      controller.reset();
    } catch (err) {
      console.error('导出GIF失败:', err);
      alert('导出失败：' + (err as Error).message);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [isExporting, particleParams.dissipateSpeed, setExportProgress, setIsExporting]);

  const handleExportJSON = useCallback(() => {
    setShowExportMenu(false);
    const config = generateExportConfig();
    Exporter.exportJSON(config);
  }, [generateExportConfig]);

  const handleImportJSON = useCallback(async () => {
    setShowExportMenu(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const config = await Exporter.importJSON(file);
          loadExportConfig(config);
        } catch (err) {
          alert('导入失败：' + (err as Error).message);
        }
      }
      document.body.removeChild(input);
    };

    input.click();
  }, [loadExportConfig]);

  const progressPercent = (animationState.progress * 100).toFixed(0);
  const timeDisplay = animationState.remainingTime.toFixed(1) + 's';

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">✦</div>
          <span>文字粒子编辑器</span>
        </div>
        <div className="navbar-actions">
          <button className="btn btn-secondary" onClick={handleImportJSON}>
            导入配置
          </button>
          <div className="export-dropdown">
            <button
              className="btn btn-primary"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
            >
              导出 ↓
            </button>
            {showExportMenu && (
              <div className="export-menu" onMouseLeave={() => setShowExportMenu(false)}>
                <div className="export-menu-item" onClick={handleExportGIF}>
                  <div className="export-menu-item-icon">🎬</div>
                  <span>导出 GIF 动图</span>
                </div>
                <div className="export-menu-item" onClick={handleExportJSON}>
                  <div className="export-menu-item-icon">📄</div>
                  <span>导出 JSON 配置</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="main-content">
        <aside className="control-panel">
          <div className="control-section">
            <div className="section-title">输入文字</div>
            <input
              type="text"
              className="text-input"
              value={textConfig.text}
              onChange={(e) => setText(e.target.value)}
              placeholder="最多20个中文字符或40个英文字符"
              maxLength={60}
            />
          </div>

          <div className="control-section">
            <div className="section-title">消散主题</div>
            <div className="theme-grid">
              {THEME_LIST.map((t) => (
                <div
                  key={t.type}
                  className={`theme-card ${theme === t.type ? 'active' : ''}`}
                  onClick={() => setTheme(t.type as ThemeType)}
                >
                  <div className={`theme-preview theme-${t.type}`} />
                  <div className="theme-name">{t.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="control-section">
            <div className="section-title">粒子参数</div>

            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">粒子大小</span>
                <span className="slider-value">{particleParams.particleSize}px</span>
              </div>
              <input
                type="range"
                className="slider"
                min={2}
                max={8}
                step={1}
                value={particleParams.particleSize}
                onChange={(e) => setParticleSize(Number(e.target.value))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">消散速度</span>
                <span className="slider-value">{particleParams.dissipateSpeed}s</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0.5}
                max={5}
                step={0.5}
                value={particleParams.dissipateSpeed}
                onChange={(e) => setDissipateSpeed(Number(e.target.value))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">方向随机性</span>
                <span className="slider-value">{particleParams.directionRandomness}%</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0}
                max={100}
                step={1}
                value={particleParams.directionRandomness}
                onChange={(e) => setDirectionRandomness(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="control-section">
            <div className="section-title">动画控制</div>
            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">播放倍速</span>
                <span className="slider-value">{animationState.speedMultiplier}x</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0.5}
                max={3}
                step={0.25}
                value={animationState.speedMultiplier}
                onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
              />
            </div>
            <div className="button-row">
              <button className="btn btn-secondary" onClick={handleReset}>
                重置
              </button>
              <button className="btn btn-primary" onClick={handleTogglePlay}>
                {animationState.isPlaying && !animationState.isPaused ? '暂停' : '播放'}
              </button>
            </div>
          </div>
        </aside>

        <main
          className="preview-area"
          ref={previewAreaRef}
          onClick={handleTriggerAnimation}
        >
          <div className="preview-header">
            <div className="progress-bar-container">
              <div
                className={`progress-bar-fill progress-${theme}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="time-display">{timeDisplay}</div>
          </div>

          <div className="preview-canvas-container">
            <canvas
              ref={canvasRef}
              className="preview-canvas"
              width={800}
              height={600}
            />
          </div>

          <div className="preview-overlay">
            <div className="preview-hint">
              点击预览区触发动画 · <kbd>空格</kbd> 暂停 · <kbd>R</kbd> 重置
            </div>
          </div>

          {isExporting && (
            <div className="export-progress-overlay">
              <div className="export-progress-text">正在导出... {exportProgress}%</div>
              <div className="export-progress-bar">
                <div
                  className="export-progress-fill"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
