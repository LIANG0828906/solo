import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Clock, Palette, Sparkles, Layers } from 'lucide-react';
import { useGalleryStore } from '@/store/galleryStore';
import { PosterCanvasEngine } from './PosterCanvasEngine';
import { DetailPanel } from './DetailPanel';
import type { BehaviorParams, DerivedVersion } from '@/types';
import { generateShortUUID } from '@/utils/uuid';

export const PosterViewer: React.FC = () => {
  const selectedPosterId = useGalleryStore((s) => s.selectedPosterId);
  const getSelectedPoster = useGalleryStore((s) => s.getSelectedPoster);
  const setSelected = useGalleryStore((s) => s.setSelectedPoster);
  const addDerivedVersion = useGalleryStore((s) => s.addDerivedVersion);
  const posters = useGalleryStore((s) => s.posters);

  const poster = posters.find((p) => p.id === selectedPosterId) || getSelectedPoster();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PosterCanvasEngine | null>(null);
  const dwellTimerRef = useRef<number | null>(null);
  const behaviorTimerRef = useRef<number | null>(null);
  const dwellStartRef = useRef<number>(Date.now());

  const [currentUUID, setCurrentUUID] = useState<string>(generateShortUUID());
  const [params, setParams] = useState<BehaviorParams>({
    dwellTime: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    hueShift: 0,
    compositionWeight: 1.0,
    particleCount: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const engineParamsCallback = useCallback((newParams: BehaviorParams) => {
    setParams(newParams);
  }, []);

  useEffect(() => {
    if (!poster || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new PosterCanvasEngine(canvas, poster.template, {
      onParamsChange: engineParamsCallback,
    });
    engineRef.current = engine;

    const resize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    dwellStartRef.current = Date.now();
    dwellTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - dwellStartRef.current) / 1000;
      engine.updateBehavior({ dwellTime: elapsed });
    }, 100);

    behaviorTimerRef.current = window.setInterval(() => {
      setParams({ ...engine.params });
    }, 1000);

    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener('resize', resize);
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
      if (behaviorTimerRef.current) clearInterval(behaviorTimerRef.current);
    };
  }, [poster, engineParamsCallback]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!engineRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      engineRef.current.updateBehavior({ mouseX: x, mouseY: y });
    },
    []
  );

  const handleBack = () => {
    setSelected(null);
  };

  const handleSave = async () => {
    if (!engineRef.current || !poster) return;
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const dataUrl = engineRef.current.getExportDataUrl();

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 160;
      thumbCanvas.height = 224;
      const tctx = thumbCanvas.getContext('2d');
      if (tctx) {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = dataUrl;
        });
        tctx.fillStyle = '#000';
        tctx.fillRect(0, 0, 160, 224);
        const scale = Math.min(160 / img.width, 224 / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        tctx.drawImage(img, (160 - dw) / 2, (224 - dh) / 2, dw, dh);
      }
      const thumbnail = thumbCanvas.toDataURL('image/png', 0.75);

      const snapshot = { ...engineRef.current.params };
      const uuid = currentUUID;
      addDerivedVersion(poster.id, {
        uuid,
        savedAt: new Date().toISOString(),
        thumbnail,
        behaviorSnapshot: snapshot,
      });

      const link = document.createElement('a');
      link.download = `${poster.name}_${uuid}.png`;
      link.href = dataUrl;
      link.click();

      setCurrentUUID(generateShortUUID());
      dwellStartRef.current = Date.now();
      if (engineRef.current) {
        engineRef.current.updateBehavior({ dwellTime: 0 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectVersion = useCallback(
    (version: DerivedVersion) => {
      if (!engineRef.current) return;
      const snap = version.behaviorSnapshot;
      dwellStartRef.current = Date.now() - snap.dwellTime * 1000;
      engineRef.current.updateBehavior({
        dwellTime: snap.dwellTime,
        mouseX: snap.mouseX,
        mouseY: snap.mouseY,
        hueShift: snap.hueShift,
        compositionWeight: snap.compositionWeight,
      });
      setCurrentUUID(version.uuid);
      setParams(snap);
    },
    []
  );

  if (!poster) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-40 flex overflow-hidden"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <div className="absolute top-0 left-0 right-0 h-14 z-30 flex items-center justify-between px-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white active:scale-95 transition-all duration-150"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(255,255,255,0.15)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(255,255,255,0.08)')
            }
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">返回画廊</span>
          </button>

          <div className="text-white/70 text-sm">
            <span className="font-medium text-white">{poster.name}</span>
            <span className="mx-2 opacity-40">|</span>
            <span>{poster.author}</span>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white active:scale-95 transition-all duration-150 disabled:opacity-50"
            style={{ backgroundColor: '#2C2C2C', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3d3d3d')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2C2C2C')
            }
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">{isSaving ? '保存中...' : '保存当前画面'}</span>
          </button>
        </div>

        <div className="flex-1 relative flex items-center justify-center p-6 md:pr-[340px]">
          <div className="relative flex items-center justify-center h-full w-full max-w-[90%] max-h-[90%]">
            <div
              className="absolute inset-0 rounded-2xl opacity-30"
              style={{
                background:
                  'radial-gradient(ellipse at center, #2D2D2D 0%, #1A1A1A 100%)',
                filter: 'blur(40px)',
                transform: 'scale(1.03)',
              }}
            />
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              className="relative w-full h-full aspect-[900/1260] max-h-full"
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ display: 'block' }}
              />

              <div
                className="absolute top-4 left-4 text-white/40 text-xs pointer-events-none select-none"
                style={{ fontFamily: '"Noto Sans SC", sans-serif' }}
              >
                ↑ 鼠标移动影响色相
              </div>
              <div
                className="absolute top-4 right-4 text-white/40 text-xs pointer-events-none select-none"
                style={{ fontFamily: '"Noto Sans SC", sans-serif' }}
              >
                5秒后触发动态变化 →
              </div>
              <div
                className="absolute bottom-4 left-4 text-white/40 text-xs pointer-events-none select-none"
                style={{ fontFamily: '"Noto Sans SC", sans-serif' }}
              >
                ← Y轴位置控制构图
              </div>
              <div
                className="absolute bottom-4 right-4 text-white/40 text-xs pointer-events-none select-none"
                style={{ fontFamily: '"Noto Sans SC", sans-serif' }}
              >
                停留时间越长 变化越丰富 ↓
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="absolute bottom-6 left-6 z-30 rounded-xl p-4 w-64 hidden md:block"
          style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <h4
            className="font-semibold text-xs mb-3 flex items-center gap-1.5"
            style={{ color: '#2C2C2C', fontFamily: '"Noto Sans SC", sans-serif' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            行为参数面板
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5" style={{ color: '#666' }}>
                <Clock className="w-3 h-3" /> 停留时长
              </span>
              <span
                className={`font-mono font-medium ${
                  params.dwellTime > 5 ? 'text-green-600' : ''
                }`}
                style={{ color: params.dwellTime > 5 ? undefined : '#333' }}
              >
                {params.dwellTime.toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5" style={{ color: '#666' }}>
                <Palette className="w-3 h-3" /> 色相偏移
              </span>
              <span className="font-mono font-medium" style={{ color: '#333' }}>
                {params.hueShift > 0 ? '+' : ''}
                {params.hueShift.toFixed(1)}°
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5" style={{ color: '#666' }}>
                <Layers className="w-3 h-3" /> 构图权重
              </span>
              <span className="font-mono font-medium" style={{ color: '#333' }}>
                {params.compositionWeight.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5" style={{ color: '#666' }}>
                <Sparkles className="w-3 h-3" /> 粒子数量
              </span>
              <span
                className="font-mono font-medium"
                style={{ color: params.particleCount >= 80 ? '#ef4444' : '#333' }}
              >
                {params.particleCount}/100
              </span>
            </div>
            {params.dwellTime <= 5 && (
              <div
                className="mt-2 text-[10px] px-2 py-1.5 rounded"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
              >
                还需 {(5 - params.dwellTime).toFixed(1)}s 启动动态效果
              </div>
            )}
            {params.dwellTime > 5 && (
              <div
                className="mt-2 text-[10px] px-2 py-1.5 rounded"
                style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
              >
                ✨ 动态效果已激活，移动鼠标体验变化
              </div>
            )}
          </div>
        </motion.div>

        {poster && (
          <DetailPanel
            poster={poster}
            currentUUID={currentUUID}
            currentSnapshot={params}
            onSelectVersion={handleSelectVersion}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
