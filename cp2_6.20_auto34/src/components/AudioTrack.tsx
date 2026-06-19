import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Track, Effect, useMixerStore } from '../stores/mixerStore';
import Waveform from './Waveform';
import Knob from './Knob';
import VUMeter from './VUMeter';

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
      setIsDraggingClip(true);

      const rect = clipRef.current.getBoundingClientRect();
      setClipOffset(e.clientX - rect.left);
    },
    [track.audioBuffer]
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

  const clipWidth = track.audioBuffer
    ? (track.audioBuffer.length / track.audioBuffer.sampleRate) *
      (waveformHeight / (track.audioBuffer.length / track.audioBuffer.sampleRate))
    : 0;

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
            width={width - 48 - 200}
            height={waveformHeight}
            bpm={bpm}
            currentTime={currentTime}
            isDragOver={isDragOver}
          />

          {track.audioBuffer && (
            <div
              ref={clipRef}
              onMouseDown={handleClipMouseDown}
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
                  : `0 2px 8px rgba(0,0,0,0.3)`,
              }}
            >
              <div className="absolute top-1 left-2 text-xs font-medium text-white/80">
                {track.name}
              </div>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 font-medium">效果器槽位</span>
          <div className="flex-1 h-px bg-gray-700/50" />
          <span className="text-[10px] text-gray-500">{track.effects.length}/4</span>
        </div>
        <div className="flex gap-3 flex-wrap">
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
    </div>
  );
};

interface EffectSlotProps {
  effect: Effect;
  trackColor: string;
  onRemove: () => void;
  onParamChange: (paramName: string, value: number) => void;
  onResetParam: (paramName: string) => void;
}

const EffectSlot: React.FC<EffectSlotProps> = ({
  effect,
  trackColor,
  onRemove,
  onParamChange,
  onResetParam,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <div className="relative group">
      <div
        className="relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02]"
        style={{
          minWidth: 200,
          background: 'linear-gradient(145deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)',
          border: `1px solid ${trackColor}60`,
          boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px ${trackColor}20 inset`,
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-base"
                style={{
                  background: `linear-gradient(135deg, ${trackColor}40 0%, ${trackColor}20 100%)`,
                }}
              >
                {getEffectIcon(effect.type)}
              </div>
              <span className="text-white font-medium text-sm">{effect.type}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="w-6 h-6 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
              <div
                className="text-gray-400 transition-transform duration-200"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
              >
                ▾
              </div>
            </div>
          </div>

          {isExpanded && params && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex justify-center gap-4 flex-wrap">
                {Object.entries(params).map(([key, config]) => (
                  <div key={key} className="flex flex-col items-center">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResetParam(key);
                        }}
                        className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 hover:text-blue-400 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors z-10"
                        title="重置"
                      >
                        ↺
                      </button>
                      <div
                        className="mt-3"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Knob
                          value={effect.params[key] ?? config.value}
                          min={config.min}
                          max={config.max}
                          step={config.step ?? 0.01}
                          label={config.label}
                          defaultValue={config.value}
                          onChange={(value) => onParamChange(key, value)}
                          size={50}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
      className={`rounded-lg flex items-center justify-center transition-all duration-200 ${
        isDragOver ? 'scale-105' : ''
      }`}
      style={{
        width: 120,
        height: 60,
        border: `2px dashed ${isDragOver ? trackColor : '#4b5563'}`,
        background: isDragOver ? `${trackColor}15` : 'transparent',
        boxShadow: isDragOver ? `0 0 20px ${trackColor}30` : 'none',
      }}
    >
      <span className={`text-sm transition-colors ${isDragOver ? 'text-blue-300' : 'text-gray-500'}`}>
        {isDragOver ? '释放添加' : '+ 添加效果'}
      </span>
    </div>
  );
};

export default AudioTrack;
