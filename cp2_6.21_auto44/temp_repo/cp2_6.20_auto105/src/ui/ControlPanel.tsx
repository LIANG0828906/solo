import React, { useState, useCallback } from 'react';
import { Play, Pause, Share2, Menu, X, Check } from 'lucide-react';
import { SliderInput } from './SliderInput';
import { useSceneStore } from '@/store/useSceneStore';
import { SLIDER_CONFIGS, ANIMATION_DURATION } from '@/types';
import { getShareUrl, saveStateToUrl } from '@/utils/urlState';

export const ControlPanel: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const hypocenter = useSceneStore((state) => state.hypocenter);
  const magnitude = useSceneStore((state) => state.magnitude);
  const density = useSceneStore((state) => state.density);
  const elasticity = useSceneStore((state) => state.elasticity);
  const isPlaying = useSceneStore((state) => state.isPlaying);
  const currentTime = useSceneStore((state) => state.currentTime);

  const setHypocenter = useSceneStore((state) => state.setHypocenter);
  const setMagnitude = useSceneStore((state) => state.setMagnitude);
  const setDensity = useSceneStore((state) => state.setDensity);
  const setElasticity = useSceneStore((state) => state.setElasticity);
  const setPlaying = useSceneStore((state) => state.setPlaying);

  const handlePlayPause = useCallback(() => {
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  const handleShare = useCallback(async () => {
    const state = useSceneStore.getState();
    saveStateToUrl(state);
    const url = getShareUrl(state);
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, []);

  const toggleMobilePanel = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const progress = (currentTime / ANIMATION_DURATION) * 100;

  const panelContent = (
    <div className="control-panel">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-lg font-bold text-white mb-1">地震波传播可视化</h1>
        <p className="text-xs text-[#8892a6]">Seismic Wave Visualizer</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="play-control-section">
          <div className="flex items-center justify-center mb-4">
            <button
              type="button"
              onClick={handlePlayPause}
              className={`play-btn ${isPlaying ? 'playing' : 'paused'}`}
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>
          <div className="w-full bg-[#3a3a6a] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${isPlaying ? 'bg-[#66bb6a]' : 'bg-[#ffa726]'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-[#8892a6]">
            <span>{currentTime.toFixed(1)}s</span>
            <span>{ANIMATION_DURATION.toFixed(1)}s</span>
          </div>
        </div>

        <div className="param-group">
          <h3 className="text-sm font-semibold text-[#c8d6e5] mb-3">震源位置</h3>
          <SliderInput
            value={hypocenter.x}
            min={SLIDER_CONFIGS.hypocenterX.min}
            max={SLIDER_CONFIGS.hypocenterX.max}
            step={SLIDER_CONFIGS.hypocenterX.step}
            label={SLIDER_CONFIGS.hypocenterX.label}
            onChange={(v) => setHypocenter({ x: v })}
            formatValue={(v) => v.toFixed(1)}
          />
          <SliderInput
            value={hypocenter.y}
            min={SLIDER_CONFIGS.hypocenterY.min}
            max={SLIDER_CONFIGS.hypocenterY.max}
            step={SLIDER_CONFIGS.hypocenterY.step}
            label={SLIDER_CONFIGS.hypocenterY.label}
            onChange={(v) => setHypocenter({ y: v })}
            formatValue={(v) => v.toFixed(1)}
          />
          <SliderInput
            value={hypocenter.z}
            min={SLIDER_CONFIGS.hypocenterZ.min}
            max={SLIDER_CONFIGS.hypocenterZ.max}
            step={SLIDER_CONFIGS.hypocenterZ.step}
            label={SLIDER_CONFIGS.hypocenterZ.label}
            onChange={(v) => setHypocenter({ z: v })}
            formatValue={(v) => v.toFixed(1)}
          />
        </div>

        <div className="param-group">
          <h3 className="text-sm font-semibold text-[#c8d6e5] mb-3">地震参数</h3>
          <SliderInput
            value={magnitude}
            min={SLIDER_CONFIGS.magnitude.min}
            max={SLIDER_CONFIGS.magnitude.max}
            step={SLIDER_CONFIGS.magnitude.step}
            label={SLIDER_CONFIGS.magnitude.label}
            onChange={setMagnitude}
          />
        </div>

        <div className="param-group">
          <h3 className="text-sm font-semibold text-[#c8d6e5] mb-3">介质参数</h3>
          <SliderInput
            value={density}
            min={SLIDER_CONFIGS.density.min}
            max={SLIDER_CONFIGS.density.max}
            step={SLIDER_CONFIGS.density.step}
            label={SLIDER_CONFIGS.density.label}
            unit={SLIDER_CONFIGS.density.unit}
            onChange={setDensity}
            formatValue={(v) => Math.round(v).toString()}
          />
          <SliderInput
            value={elasticity}
            min={SLIDER_CONFIGS.elasticity.min}
            max={SLIDER_CONFIGS.elasticity.max}
            step={SLIDER_CONFIGS.elasticity.step}
            label={SLIDER_CONFIGS.elasticity.label}
            unit={SLIDER_CONFIGS.elasticity.unit}
            onChange={setElasticity}
          />
        </div>

        <div className="param-group">
          <h3 className="text-sm font-semibold text-[#c8d6e5] mb-3">图例</h3>
          <div className="legend-item">
            <span className="legend-dot bg-[#ef5350]" />
            <span className="text-xs text-[#c8d6e5]">震源</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot bg-[#42a5f5]" />
            <span className="text-xs text-[#c8d6e5]">P波（纵波）</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot bg-[#66bb6a]" />
            <span className="text-xs text-[#c8d6e5]">S波（横波）</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot bg-[#ffa726]" />
            <span className="text-xs text-[#c8d6e5]">面波</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleShare}
          className={`share-btn ${copySuccess ? 'success' : ''}`}
        >
          {copySuccess ? (
            <>
              <Check size={16} />
              <span>已复制链接</span>
            </>
          ) : (
            <>
              <Share2 size={16} />
              <span>保存并分享</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={toggleMobilePanel}
        className="mobile-menu-btn lg:hidden"
        aria-label={isMobileOpen ? '关闭面板' : '打开面板'}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobilePanel}
        />
      )}

      <div className={`fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:transform-none`}>
        {panelContent}
      </div>
    </>
  );
};
