import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAnimStore } from '../store';
import { computeAnimationFrame, AnimationFrameData } from '../engine/animationEngine';
import { useFpsMonitor } from '../hooks/useFpsMonitor';
import { SvgRenderer } from './SvgRenderer';
import { PlaybackControls } from './PlaybackControls';
import { ExportButton } from './ExportButton';
import { Eye, Zap, Activity } from 'lucide-react';

interface PreviewPanelProps {
  isMobileVertical?: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ isMobileVertical = false }) => {
  const blocks = useAnimStore(s => s.blocks);
  const sequences = useAnimStore(s => s.sequences);
  const preview = useAnimStore(s => s.preview);
  const setPreview = useAnimStore(s => s.setPreview);

  const [shapeStates, setShapeStates] = useState<Map<string, any>>(new Map());

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const animTimeRef = useRef<number>(0);

  const { fps, isDegraded } = useFpsMonitor(preview.isPlaying);

  useEffect(() => {
    setPreview({ fps });
  }, [fps, setPreview]);

  const staticFrame = useCallback(() => {
    const frame = computeAnimationFrame(blocks, sequences, 0, false);
    setShapeStates(frame.shapeStates);
  }, [blocks, sequences]);

  useEffect(() => {
    staticFrame();
  }, [staticFrame]);

  useEffect(() => {
    if (!preview.isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      staticFrame();
      return;
    }

    lastTimeRef.current = performance.now();
    animTimeRef.current = preview.currentTime;

    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      animTimeRef.current += delta * preview.speed;
      setPreview({ currentTime: animTimeRef.current });

      const frame = computeAnimationFrame(
        blocks,
        sequences,
        animTimeRef.current,
        isDegraded
      );
      setShapeStates(frame.shapeStates);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [preview.isPlaying, preview.speed, blocks, sequences, isDegraded, setPreview, preview.currentTime]);

  const handleReset = useCallback(() => {
    animTimeRef.current = 0;
    staticFrame();
  }, [staticFrame]);

  const shapeCount = blocks.filter(b => b.type === 'shape').length;
  const animationCount = blocks.filter(b => b.type === 'animation').length;

  return (
    <div
      className={`
        relative flex flex-col overflow-hidden
        bg-[#0f3460]
        ${isMobileVertical ? 'h-[40%]' : 'w-[35%] min-w-[340px]'}
      `}
      style={{
        boxShadow: 'inset 0 0 120px rgba(78, 205, 196, 0.05)'
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          animation: 'pulseGlow 3s ease-in-out infinite',
          background: `
            radial-gradient(ellipse at center,
              rgba(78, 205, 196, 0.15) 0%,
              rgba(233, 69, 96, 0.08) 40%,
              transparent 70%
            )
          `
        }}
      />

      <div className="relative z-10 p-4 border-b border-white/5 bg-[#0f3460]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Eye size={18} className="text-[#e94560]" />
              <h2 className="text-base font-bold text-[#e0e0e0]">实时预览</h2>
            </div>
            <p className="text-xs text-white/50">点击播放查看动画效果</p>
          </div>
          <div className="flex items-center gap-2">
            {isDegraded && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#ffe66d]/10 border border-[#ffe66d]/20">
                <Zap size={10} className="text-[#ffe66d]" />
                <span className="text-[10px] text-[#ffe66d] font-semibold">低性能模式</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
              <Activity size={10} className="text-[#4ecdc4]" />
              <span className="text-[10px] font-mono text-white/60">{fps}fps</span>
            </div>
          </div>
        </div>

        <PlaybackControls onReset={handleReset} />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-6 overflow-auto">
        <div
          className="relative rounded-3xl overflow-hidden transition-all duration-500"
          style={{
            boxShadow: preview.isPlaying
              ? '0 20px 60px rgba(0,0,0,0.4), 0 0 80px rgba(78, 205, 196, 0.1)'
              : '0 10px 40px rgba(0,0,0,0.3)',
            transform: preview.isPlaying ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <SvgRenderer blocks={blocks} shapeStates={shapeStates} />

          {preview.isPlaying && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full
                bg-black/40 backdrop-blur-md border border-white/10"
            >
              <span className="w-2 h-2 rounded-full bg-[#e94560] animate-pulse" />
              <span className="text-[10px] text-white/80 font-semibold">PLAYING</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 p-3 px-4 border-t border-white/5 bg-[#0f3460]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatPill label="形状" value={shapeCount} color="#4ecdc4" />
            <StatPill label="动画" value={animationCount} color="#e94560" />
          </div>
          <div className="text-[10px] text-white/30 font-mono">
            {Math.round(preview.currentTime)}ms
          </div>
        </div>
      </div>

      <ExportButton />
    </div>
  );
};

const StatPill: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center gap-1.5">
    <div
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
    />
    <span className="text-[11px] text-white/50">{label}</span>
    <span
      className="text-[11px] font-bold font-mono"
      style={{ color }}
    >
      {value}
    </span>
  </div>
);
