import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Track, Effect, useMixerStore } from '../stores/mixerStore';
import Waveform from './Waveform';
import VUMeter from './VUMeter';
import { audioEngine } from '../utils/audioEngine';

interface AudioTrackProps {
  track: Track;
  width?: number;
  waveformHeight?: number;
}

const effectDefaultParams: Record<string, Record<string, { value: number; min: number; max: number; step?: number; label: string }>> = {
  Echo: {
    delayTime: { value: 0.3, min: 0, max: 2, step: 0.01, label: '延迟' },
    feedback: { value: 0.3, min: 0, max: 0.95, step: 0.01, label: '反馈' },
    mix: { value: 0.5, min: 0, max: 1, step: 0.01, label: '混合' },
  },
  Compressor: {
    threshold: { value: -24, min: -60, max: 0, step: 1, label: '阈值' },
    ratio: { value: 12, min: 1, max: 20, step: 0.5, label: '比率' },
    attack: { value: 0.003, min: 0, max: 1, step: 0.001, label: '启动' },
    release: { value: 0.25, min: 0, max: 1, step: 0.01, label: '释放' },
  },
  Filter: {
    frequency: { value: 1000, min: 20, max: 20000, step: 10, label: '频率' },
    Q: { value: 1, min: 0.1, max: 20, step: 0.1, label: 'Q值' },
    gain: { value: 0, min: -40, max: 40, step: 1, label: '增益' },
  },
};

const PREVIEW_DURATION = 2;
const PREVIEW_VOLUME = 0.3;

const AudioTrack: React.FC<AudioTrackProps> = ({
  track,
  width = 800,
  waveformHeight = 120,
}) => {
  const updateTrack = useMixerStore((state) => state.updateTrack);
  const addEffect = useMixerStore((state) => state.addEffect);
  const removeEffect = useMixerStore((state) => state.removeEffect);
  const updateEffect = useMixerStore((state) => state.updateEffect);
  const bpm = useMixerStore((state) => state.bpm);
  const currentTime = useMixerStore((state) => state.currentTime);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [clipOffset, setClipOffset] = useState(0);
  const clipRef = useRef<HTMLDivElement>(null);
  const [vuLevels, setVuLevels] = useState({ left: 0, right: 0 });

  const [isHoveringClip, setIsHoveringClip] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewGainRef = useRef<GainNode | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const previewStopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let animationId: number;
    const updateVU = () => {
      if (track.audioBuffer && !track.muted) {
        const baseLevel = track.volume * 0.6;
        const variation = Math.random() * 0.3;
        setVuLevels({
          left: Math.min(1, baseLevel + variation * Math.random()),
          right: Math.min(1, baseLevel + variation * Math.random()),
        });
      } else {
        setVuLevels({ left: 0, right: 0 });
      }
      animationId = requestAnimationFrame(updateVU);
    };
    updateVU();
    return () => cancelAnimationFrame(animationId);
  }, [track.audioBuffer, track.muted, track.volume]);

  const stopPreview = useCallback(() => {
    if (previewStopTimerRef.current) {
      window.clearTimeout(previewStopTimerRef.current);
      previewStopTimerRef.current = null;
    }
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop();
      } catch (e) {
        // ignore stop errors
      }
      previewSourceRef.current.disconnect();
      previewSourceRef.current = null;
    }
    if (previewGainRef.current) {
      previewGainRef.current.disconnect();
      previewGainRef.current = null;
    }
    setIsPreviewing(false);
  }, []);

  const startPreview = useCallback(() => {
    if (!track.audioBuffer || isDraggingClip) return;

    stopPreview();

    try {
      const ctx = audioEngine.getContext();
      const source = ctx.createBufferSource();
      source.buffer = track.audioBuffer;

      const previewGain = ctx.createGain();
      previewGain.gain.value = PREVIEW_VOLUME;

      previewGain.connect(ctx.destination);
      source.connect(previewGain);

      const duration = Math.min(PREVIEW_DURATION, track.audioBuffer.duration);
      source.start(ctx.currentTime, 0, duration);

      previewSourceRef.current = source;
      previewGainRef.current = previewGain;
      setIsPreviewing(true);

      previewStopTimerRef.current = window.setTimeout(() => {
        stopPreview();
      }, duration * 1000);

      source.onended = () => {
        setIsPreviewing(false);
      };
    } catch (e) {
      console.error('Preview failed:', e);
    }
  }, [track.audioBuffer, isDraggingClip, stopPreview]);

  const handleClipMouseEnter = useCallback(() => {
    if (isDraggingClip) return;
    setIsHoveringClip(true);

    hoverTimerRef.current = window.setTimeout(() => {
      startPreview();
    }, 300);
  }, [isDraggingClip, startPreview]);

  const handleClipMouseLeave = useCallback(() => {
    setIsHoveringClip(false);

    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    stopPreview();
  }, [stopPreview]);

  useEffect(() => {
    return () => {
      stopPreview();
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, [stopPreview]);

  const handleToggleMute = useCallback(() => {
    updateTrack(track.id, { muted: !track.muted });
  }, [track.id, track.muted, updateTrack]);

  const handleToggleSolo = useCallback(() => {
    updateTrack(track.id, { solo: !track.solo });
  }, [track.id, track.solo, updateTrack]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const volume = parseFloat(e.target.value);
      updateTrack(track.id, { volume });
    },
    [track.id, updateTrack]
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateTrack(track.id, { name: e.target.value });
    },
    [track.id, updateTrack]
  );

  const snapToBeat = useCallback(
    (time: number): number => {
      const beatDuration = 60 / bpm;
      return Math.round(time / beatDuration) * beatDuration;
    },
    [bpm]
  );

  const handleClipMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!clipRef.current || !track.audioBuffer) return;
      e.preventDefault();
      stopPreview();
      setIsDraggingClip(true);

      const rect = clipRef.current.getBoundingClientRect();
      setClipOffset(e.clientX - rect.left);
    },
    [track.audioBuffer, stopPreview]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingClip || !track.audioBuffer) return;

      const waveformRect = clipRef.current?.parentElement?.getBoundingClientRect();
      if (!waveformRect) return;

      const duration = track.audioBuffer.length / track.audioBuffer.sampleRate;
      const pixelsPerSecond = waveformHeight / duration;
      const newX = e.clientX - waveformRect.left - clipOffset;
      const newStartTime = snapToBeat(Math.max(0, newX / pixelsPerSecond));

      updateTrack(track.id, { startTime: newStartTime });
    },
    [isDraggingClip, track.audioBuffer, track.id, clipOffset, snapToBeat, updateTrack, waveformHeight]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingClip(false);
  }, []);

  useEffect(() => {
    if (isDraggingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingClip, handleMouseMove, handleMouseUp]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const effectType = e.dataTransfer.getData('effectType');
    if (effectType && effectDefaultParams[effectType]) {
      const params: Record<string, number> = {};
      Object.entries(effectDefaultParams[effectType]).forEach(([key, config]) => {
        params[key] = config.value;
      });
      addEffect({
        type: effectType,
        params,
        trackId: track.id,
      });
    }
  };

  const handleEffectSlotDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const effectType = e.dataTransfer.getData('effectType');
    if (effectType && effectDefaultParams[effectType]) {
      const params: Record<string, number> = {};
      Object.entries(effectDefaultParams[effectType]).forEach(([key, config]) => {
        params[key] = config.value;
      });
      addEffect({
        type: effectType,
        params,
        trackId: track.id,
      });
    }
  };

  const handleParamChange = (effectId: string, paramName: string, value: number) => {
    const effect = track.effects.find((e) => e.id === effectId);
    if (effect) {
      updateEffect(effectId, {
        params: { ...effect.params, [paramName]: value },
      });
    }
  };

  const handleResetParam = (effectId: string, paramName: string) => {
    const effect = track.effects.find((e) => e.id === effectId);
    if (effect && effectDefaultParams[effect.type]?.[paramName]) {
      const defaultValue = effectDefaultParams[effect.type][paramName].value;
      updateEffect(effectId, {
        params: { ...effect.params, [paramName]: defaultValue },
      });
    }
  };

  const handleToggleEffect = (effectId: string, enabled: boolean) => {
    const effect = track.effects.find((e) => e.id === effectId);
    if (effect) {
      updateEffect(effectId, {
        params: { ...effect.params, _enabled: enabled ? 1 : 0 },
      });
    }
  };

  const clipWidth = track.audioBuffer
    ? (track.audioBuffer.length / track.audioBuffer.sampleRate) *
      (waveformHeight / (track.audioBuffer.length / track.audioBuffer.sampleRate))
    : 0;

  const waveformWidth = Math.max(200, width - 192 - 48);

  return (
    <div
      className="bg-gray-800/80 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm"
      style={{ width }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-3 w-48 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <button
                onClick={handleToggleMute}
                className={`w-8 h-8 rounded-md font-bold text-xs transition-all duration-200 flex items-center justify-center
                  ${track.muted
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-95'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                  }`}
              >
                <span className={track.muted ? 'scale-90 transition-transform' : 'scale-100 transition-transform'}>
                  M
                </span>
              </button>
              <button
                onClick={handleToggleSolo}
                className={`w-8 h-8 rounded-md font-bold text-xs transition-all duration-200 flex items-center justify-center
                  ${track.solo
                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30 scale-95'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                  }`}
              >
                <span className={track.solo ? 'scale-90 transition-transform' : 'scale-100 transition-transform'}>
                  S
                </span>
              </button>
            </div>
            <input
              type="text"
              value={track.name}
              onChange={handleNameChange}
              className="flex-1 bg-gray-700/50 text-white text-sm px-2 py-1 rounded-md border border-gray-600/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              style={{ borderLeftColor: track.color, borderLeftWidth: 3 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-10">音量</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={track.volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${track.color} 0%, ${track.color} ${track.volume * 100}%, #374151 ${track.volume * 100}%, #374151 100%)`,
              }}
            />
            <span className="text-gray-300 text-xs w-10 text-right font-mono">
              {Math.round(track.volume * 100)}%
            </span>
          </div>

          <VUMeter
            levelLeft={vuLevels.left}
            levelRight={vuLevels.right}
            width={180}
            height={50}
          />
        </div>

        <div className="flex-1 relative">
          <Waveform
            audioBuffer={track.audioBuffer}
            width={waveformWidth}
            height={waveformHeight}
            bpm={bpm}
            currentTime={currentTime}
            isDragOver={isDragOver}
          />

          {track.audioBuffer && (
            <div
              ref={clipRef}
              onMouseDown={handleClipMouseDown}
              onMouseEnter={handleClipMouseEnter}
              onMouseLeave={handleClipMouseLeave}
              className={`absolute top-0 h-full cursor-move rounded-md transition-all
                ${isDraggingClip ? 'opacity-80 scale-[1.02]' : 'hover:opacity-90'}
              `}
              style={{
                left: (track.startTime / (track.audioBuffer.length / track.audioBuffer.sampleRate)) * (waveformHeight / (track.audioBuffer.length / track.audioBuffer.sampleRate)),
                width: clipWidth,
                background: `linear-gradient(180deg, ${track.color}40 0%, ${track.color}20 100%)`,
                border: `2px solid ${track.color}`,
                boxShadow: isDraggingClip
                  ? `0 0 20px ${track.color}60, 0 8px 16px rgba(0,0,0,0.4)`
                  : isHoveringClip
                    ? `0 0 15px ${track.color}40, 0 2px 8px rgba(0,0,0,0.3)`
                    : `0 2px 8px rgba(0,0,0,0.3)`,
              }}
            >
              <div className="absolute top-1 left-2 text-xs font-medium text-white/80 pr-8">
                {track.name}
              </div>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div
                className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
                  ${isHoveringClip || isPreviewing ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                `}
                style={{
                  background: isPreviewing
                    ? `linear-gradient(135deg, ${track.color}dd, ${track.color}99)`
                    : 'rgba(0,0,0,0.6)',
                  boxShadow: isPreviewing
                    ? `0 0 12px ${track.color}, 0 0 4px rgba(255,255,255,0.5) inset`
                    : '0 1px 4px rgba(0,0,0,0.4)',
                }}
              >
                {isPreviewing ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <polygon points="7,4 20,12 7,20" />
                  </svg>
                )}
              </div>

              {isPreviewing && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-white/60 rounded-r transition-all duration-75"
                  style={{
                    animation: 'previewProgress 2s linear forwards',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400 font-medium">效果器链</span>
          <div className="flex-1 h-px bg-gray-700/50" />
          <span className="text-[10px] text-gray-500">{track.effects.length}/4</span>
        </div>
        <div className="space-y-2">
          {track.effects.map((effect) => (
            <EffectSlot
              key={effect.id}
              effect={effect}
              trackColor={track.color}
              onRemove={() => removeEffect(effect.id)}
              onParamChange={(paramName, value) =>
                handleParamChange(effect.id, paramName, value)
              }
              onResetParam={(paramName) =>
                handleResetParam(effect.id, paramName)
              }
              onToggle={(enabled) => handleToggleEffect(effect.id, enabled)}
            />
          ))}
          {track.effects.length < 4 && (
            <EmptyEffectSlot
              onDrop={handleEffectSlotDrop}
              trackColor={track.color}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes previewProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

interface EffectSlotProps {
  effect: Effect;
  trackColor: string;
  onRemove: () => void;
  onParamChange: (paramName: string, value: number) => void;
  onResetParam: (paramName: string) => void;
  onToggle: (enabled: boolean) => void;
}

const EffectSlot: React.FC<EffectSlotProps> = ({
  effect,
  trackColor,
  onRemove,
  onParamChange,
  onResetParam,
  onToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isEnabled = effect.params._enabled !== 0;

  const getEffectIcon = (type: string) => {
    switch (type) {
      case 'Echo':
        return '〰️';
      case 'Compressor':
        return '📊';
      case 'Filter':
        return '🎚️';
      default:
        return '🎛️';
    }
  };

  const params = effectDefaultParams[effect.type];

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(!isEnabled);
  };

  const handleResetAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (params) {
      Object.keys(params).forEach((key) => {
        onResetParam(key);
      });
    }
  };

  return (
    <div className="relative group">
      <div
        className={`relative rounded-lg overflow-hidden transition-all duration-200
          ${!isEnabled ? 'opacity-60' : ''}
        `}
        style={{
          background: isExpanded
            ? 'linear-gradient(145deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)'
            : 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
          border: `1px solid ${trackColor}${isExpanded ? '80' : '40'}`,
          boxShadow: isExpanded
            ? `0 6px 16px rgba(0,0,0,0.4), 0 0 0 1px ${trackColor}30 inset, 0 0 20px ${trackColor}15`
            : `0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px ${trackColor}15 inset`,
        }}
      >
        <div
          className="p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="relative w-9 h-9 rounded-md flex items-center justify-center text-base flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${trackColor}${isEnabled ? '50' : '30'} 0%, ${trackColor}${isEnabled ? '25' : '15'} 100%)`,
                  transition: 'all 0.2s ease',
                }}
              >
                {getEffectIcon(effect.type)}
                {isEnabled && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#16213e]"
                    style={{
                      background: trackColor,
                      boxShadow: `0 0 6px ${trackColor}`,
                    }}
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-medium transition-colors
                  ${isEnabled ? 'text-white' : 'text-gray-500'}
                `}>
                  {effect.type}
                </span>
                <span className="text-[10px] text-gray-500">
                  {params ? `${Object.keys(params).length} 个参数` : ''}
                  {!isEnabled && ' · 已禁用'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`relative w-9 h-5 rounded-full transition-all duration-300 cursor-pointer
                  ${isEnabled ? '' : 'opacity-70'}
                `}
                style={{
                  background: isEnabled
                    ? `linear-gradient(90deg, ${trackColor}, ${trackColor}cc)`
                    : 'rgba(75,85,99,0.8)',
                  boxShadow: isEnabled ? `0 0 10px ${trackColor}60` : 'none',
                }}
                onClick={handleToggleClick}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ease-out
                  `}
                  style={{
                    left: isEnabled ? 'calc(100% - 18px)' : '2px',
                    transform: isEnabled ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="w-7 h-7 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 flex items-center justify-center text-sm transition-all hover:scale-110"
                title="移除效果器"
              >
                ✕
              </button>

              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all
                  ${isExpanded ? 'rotate-180 bg-white/10 text-white' : ''}
                `}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div
            className="px-3 pb-3 border-t"
            style={{ borderTopColor: `${trackColor}25` }}
          >
            <div className="flex items-center justify-between py-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">参数调节</span>
              </div>
              <button
                onClick={handleResetAll}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-400 px-2 py-1 rounded hover:bg-white/10 transition-all"
                title="重置所有参数"
              >
                <span>↺</span>
                <span>全部重置</span>
              </button>
            </div>

            <div className="space-y-3">
              {params && Object.entries(params).map(([key, config]) => {
                const currentValue = effect.params[key] ?? config.value;
                const percentage = ((currentValue - config.min) / (config.max - config.min)) * 100;
                const isModified = Math.abs(currentValue - config.value) > 0.0001;

                return (
                  <div key={key} className="group/param">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-300 font-medium">{config.label}</span>
                        {isModified && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: trackColor, boxShadow: `0 0 4px ${trackColor}` }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-mono bg-black/30 px-1.5 py-0.5 rounded min-w-[48px] text-center">
                          {Number(currentValue.toFixed(2))}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResetParam(key);
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all
                            ${isModified
                              ? 'text-gray-400 hover:text-white hover:bg-white/20 opacity-100'
                              : 'opacity-0 pointer-events-none'
                            }
                          `}
                          title={`重置 ${config.label}`}
                          style={{ color: isModified ? trackColor : undefined }}
                        >
                          ↺
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="range"
                        min={config.min}
                        max={config.max}
                        step={config.step ?? 0.01}
                        value={currentValue}
                        onChange={(e) => {
                          e.stopPropagation();
                          onParamChange(key, parseFloat(e.target.value));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full h-6 appearance-none bg-transparent cursor-pointer z-10 relative"
                        style={{
                          WebkitAppearance: 'none',
                        }}
                      />
                      <div
                        className="absolute top-1/2 left-0 right-0 h-1.5 rounded-full -translate-y-1/2 pointer-events-none"
                        style={{
                          background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${percentage}%, rgba(75,85,99,0.6) ${percentage}%, rgba(75,85,99,0.6) 100%)`,
                          boxShadow: `inset 0 1px 2px rgba(0,0,0,0.4)`,
                        }}
                      />
                      <div
                        className="absolute top-1/2 w-3.5 h-3.5 rounded-full -translate-y-1/2 pointer-events-none transition-transform hover:scale-125"
                        style={{
                          left: `calc(${percentage}% - 7px)`,
                          background: 'linear-gradient(145deg, #ffffff, #e5e7eb)',
                          boxShadow: `0 2px 6px rgba(0,0,0,0.4), 0 0 0 2px ${trackColor}80, 0 0 8px ${trackColor}40`,
                          border: '1px solid rgba(255,255,255,0.8)',
                        }}
                      />
                    </div>

                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] text-gray-600">{config.min}</span>
                      <span className="text-[9px] text-gray-600">{config.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${trackColor} 50%, transparent 100%)`,
          }}
        />
      </div>
    </div>
  );
};

interface EmptyEffectSlotProps {
  onDrop: (e: React.DragEvent) => void;
  trackColor: string;
}

const EmptyEffectSlot: React.FC<EmptyEffectSlotProps> = ({ onDrop, trackColor }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      className={`rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer group
        ${isDragOver ? 'scale-[1.01]' : 'hover:bg-white/[0.02]'}
      `}
      style={{
        minHeight: 56,
        border: `2px dashed ${isDragOver ? trackColor : 'rgba(75,85,99,0.6)'}`,
        background: isDragOver ? `${trackColor}12` : 'transparent',
        boxShadow: isDragOver ? `0 0 24px ${trackColor}25, inset 0 0 12px ${trackColor}10` : 'none',
      }}
    >
      <div className={`flex items-center gap-3 transition-all
        ${isDragOver ? 'scale-105' : ''}
      `}>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
            ${isDragOver ? 'scale-110' : 'group-hover:scale-105'}
          `}
          style={{
            background: isDragOver
              ? `linear-gradient(135deg, ${trackColor}40, ${trackColor}20)`
              : 'rgba(75,85,99,0.3)',
            border: `1px solid ${isDragOver ? trackColor : 'rgba(75,85,99,0.5)'}`,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDragOver ? trackColor : '#9ca3af'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-medium transition-colors
            ${isDragOver ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'}
          `}>
            {isDragOver ? '释放以添加效果器' : '添加效果器'}
          </span>
          <span className="text-[10px] text-gray-600">
            从右侧面板拖拽效果器到此处
          </span>
        </div>
      </div>
    </div>
  );
};

export default AudioTrack;
