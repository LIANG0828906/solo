import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Track, Effect, useMixerStore } from '../stores/mixerStore';
import Waveform from './Waveform';
import Knob from './Knob';
import VUMeter from './VUMeter';
import { audioEngine } from '../utils/audioEngine';

// ============================================================
// 全局常量配置
// ============================================================

/** 悬停触发预览的延迟时间（毫秒）。防止用户快速扫过时误触发预览 */
const HOVER_PREVIEW_DELAY_MS = 300;

/** 悬停预览的播放时长（秒）。默认取前2秒，若音频更短则播放完整内容 */
const PREVIEW_DURATION_SECONDS = 2;

/**
 * 悬停预览音量相对于主音量的比例。
 * - 设置为30%是为了在用户快速判断内容时不干扰主混音或其他预览
 * - 可根据需要与audioEngine或全局store同步调整
 */
const PREVIEW_VOLUME_RATIO = 0.3;

/** 效果器折叠/展开状态在localStorage中的存储键名前缀 */
const EFFECT_EXPANDED_STORAGE_KEY = 'mcs_effect_expanded_';

// ============================================================
// 效果器参数配置
// ============================================================

type ParamControl = 'slider' | 'knob';

interface ParamConfig {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  /** 指定使用旋钮还是滑块。对数级/大范围/需要精细调节的参数优先使用knob */
  control?: ParamControl;
  /** 该参数是否在对数尺度下分布，会影响滑块视觉体验 */
  logarithmic?: boolean;
}

const effectDefaultParams: Record<string, Record<string, ParamConfig>> = {
  Echo: {
    delayTime: {
      value: 0.3,
      min: 0,
      max: 2,
      step: 0.01,
      label: '延迟',
      control: 'slider',
    },
    feedback: {
      value: 0.3,
      min: 0,
      max: 0.95,
      step: 0.01,
      label: '反馈',
      control: 'slider',
    },
    mix: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      label: '混合',
      control: 'slider',
    },
  },
  Compressor: {
    threshold: {
      value: -24,
      min: -60,
      max: 0,
      step: 1,
      label: '阈值 (dB)',
      control: 'slider',
    },
    ratio: {
      value: 12,
      min: 1,
      max: 20,
      step: 0.5,
      label: '压缩比',
      control: 'knob',
    },
    attack: {
      value: 0.003,
      min: 0,
      max: 1,
      step: 0.001,
      label: '启动 (s)',
      control: 'knob',
    },
    release: {
      value: 0.25,
      min: 0,
      max: 1,
      step: 0.01,
      label: '释放 (s)',
      control: 'knob',
    },
  },
  Filter: {
    frequency: {
      value: 1000,
      min: 20,
      max: 20000,
      step: 10,
      label: '频率 (Hz)',
      control: 'knob',
      logarithmic: true,
    },
    Q: {
      value: 1,
      min: 0.1,
      max: 20,
      step: 0.1,
      label: 'Q值',
      control: 'knob',
      logarithmic: true,
    },
    gain: {
      value: 0,
      min: -40,
      max: 40,
      step: 1,
      label: '增益 (dB)',
      control: 'slider',
    },
  },
};

// ============================================================
// AudioTrackProps
// ============================================================

interface AudioTrackProps {
  track: Track;
  width?: number;
  waveformHeight?: number;
}

// ============================================================
// AudioTrack 主组件
// ============================================================

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

  // ---------- 拖拽相关状态 ----------
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [clipOffset, setClipOffset] = useState(0);
  const clipRef = useRef<HTMLDivElement>(null);

  // ---------- VU表状态 ----------
  const [vuLevels, setVuLevels] = useState({ left: 0, right: 0 });

  // ---------- 悬停预览相关状态 ----------
  const [isHoveringClip, setIsHoveringClip] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  /** JS控制的预览进度条宽度百分比（0-100） */
  const [previewProgress, setPreviewProgress] = useState(0);

  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewGainRef = useRef<GainNode | null>(null);

  /** 悬停延迟定时器。mouseleave必须立即清除，避免快速扫过多个片段误触发 */
  const hoverTimerRef = useRef<number | null>(null);
  /** 预览自动停止定时器 */
  const previewStopTimerRef = useRef<number | null>(null);
  /** 预览进度条requestAnimationFrame编号 */
  const previewProgressRafRef = useRef<number | null>(null);
  /** 预览启动时的AudioContext.currentTime，用于计算进度 */
  const previewStartAudioTimeRef = useRef<number>(0);
  /** 本次预览的实际播放时长，用于进度条计算 */
  const previewActualDurationRef = useRef<number>(0);

  // ============================================================
  // VU表动画
  // ============================================================
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

  // ============================================================
  // 预览停止 - 完整的资源清理逻辑
  // ============================================================
  const stopPreview = useCallback(() => {
    // 1) 清除预览停止定时器
    if (previewStopTimerRef.current !== null) {
      window.clearTimeout(previewStopTimerRef.current);
      previewStopTimerRef.current = null;
    }

    // 2) 清除预览进度条RAF
    if (previewProgressRafRef.current !== null) {
      cancelAnimationFrame(previewProgressRafRef.current);
      previewProgressRafRef.current = null;
    }

    // 3) 停止并断开音频源节点
    if (previewSourceRef.current !== null) {
      try {
        previewSourceRef.current.onended = null;
        previewSourceRef.current.stop();
      } catch {
        // 已停止或未启动，忽略错误
      }
      try {
        previewSourceRef.current.disconnect();
      } catch {
        // ignore disconnect errors
      }
      previewSourceRef.current = null;
    }

    // 4) 断开增益节点
    if (previewGainRef.current !== null) {
      try {
        previewGainRef.current.disconnect();
      } catch {
        // ignore disconnect errors
      }
      previewGainRef.current = null;
    }

    // 5) 重置UI状态
    setIsPreviewing(false);
    setPreviewProgress(0);
  }, []);

  // ============================================================
  // 预览进度条动画 (JS控制，保证与实际音频严格同步)
  // ============================================================
  const runPreviewProgressAnimation = useCallback(() => {
    const step = () => {
      const ctx = audioEngine.getContext();
      const elapsed = ctx.currentTime - previewStartAudioTimeRef.current;
      const duration = previewActualDurationRef.current;
      const percent = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 100;
      setPreviewProgress(percent);
      if (percent < 100) {
        previewProgressRafRef.current = requestAnimationFrame(step);
      }
    };
    previewProgressRafRef.current = requestAnimationFrame(step);
  }, []);

  // ============================================================
  // 启动预览
  // ============================================================
  const startPreview = useCallback(() => {
    // 防御性检查：正在拖拽或无音频不播放
    if (!track.audioBuffer || isDraggingClip) return;

    // 先停止任何正在播放的预览，避免多个音频节点资源竞争、内存泄漏
    stopPreview();

    try {
      const ctx = audioEngine.getContext();
      const source = ctx.createBufferSource();
      source.buffer = track.audioBuffer;

      // 预览音量 = 主音量 × 预览比例。始终保持预览比主混音安静。
      const masterVol = useMixerStore.getState().masterVolume;
      const previewGain = ctx.createGain();
      previewGain.gain.value = masterVol * PREVIEW_VOLUME_RATIO;

      previewGain.connect(ctx.destination);
      source.connect(previewGain);

      // 计算实际预览时长（音频更短则播放完整内容）
      const duration = Math.min(PREVIEW_DURATION_SECONDS, track.audioBuffer.duration);
      source.start(ctx.currentTime, 0, duration);

      // 保存引用以便后续清理
      previewSourceRef.current = source;
      previewGainRef.current = previewGain;
      previewStartAudioTimeRef.current = ctx.currentTime;
      previewActualDurationRef.current = duration;

      setIsPreviewing(true);

      // 启动进度条动画 (JS严格同步)
      runPreviewProgressAnimation();

      // 音频播放完毕自动停止
      previewStopTimerRef.current = window.setTimeout(() => {
        stopPreview();
      }, duration * 1000 + 50);

      source.onended = () => {
        stopPreview();
      };
    } catch (e) {
      console.error('Preview failed:', e);
      stopPreview();
    }
  }, [track.audioBuffer, isDraggingClip, stopPreview, runPreviewProgressAnimation]);

  // ============================================================
  // 悬停进入片段
  // ============================================================
  const handleClipMouseEnter = useCallback(() => {
    if (isDraggingClip) return;
    setIsHoveringClip(true);

    // 清除旧的定时器（理论上mouseleave时已清除，此处双保险）
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // 延迟触发预览，防止快速扫过多个片段时误触发
    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null;
      startPreview();
    }, HOVER_PREVIEW_DELAY_MS);
  }, [isDraggingClip, startPreview]);

  // ============================================================
  // 悬停离开片段 - 立即清理所有预览相关资源
  // ============================================================
  const handleClipMouseLeave = useCallback(() => {
    setIsHoveringClip(false);

    // 关键修复1：立即清除悬停延迟定时器，防止延迟触发
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // 关键修复2：立即停止正在播放的预览，避免音频资源竞争
    stopPreview();
  }, [stopPreview]);

  // ============================================================
  // 组件卸载：兜底清理所有定时器和音频节点
  // ============================================================
  useEffect(() => {
    return () => {
      // 悬停定时器
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      // 预览停止定时器
      if (previewStopTimerRef.current !== null) {
        window.clearTimeout(previewStopTimerRef.current);
        previewStopTimerRef.current = null;
      }
      // 进度条动画
      if (previewProgressRafRef.current !== null) {
        cancelAnimationFrame(previewProgressRafRef.current);
        previewProgressRafRef.current = null;
      }
      // 音频节点
      stopPreview();
    };
  }, [stopPreview]);

  // ============================================================
  // 静音/独奏/音量控制
  // ============================================================
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

  // ============================================================
  // 节拍吸附
  // ============================================================
  const snapToBeat = useCallback(
    (time: number): number => {
      const beatDuration = 60 / bpm;
      return Math.round(time / beatDuration) * beatDuration;
    },
    [bpm]
  );

  // ============================================================
  // 音频片段拖拽（位置调整）
  // ============================================================
  const handleClipMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!clipRef.current || !track.audioBuffer) return;
      e.preventDefault();

      // 开始拖拽前立即停止预览，确保不影响拖拽逻辑
      stopPreview();
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }

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

  // ============================================================
  // 效果器拖放
  // ============================================================
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
        {/* -------- 左侧控制面板 -------- */}
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

        {/* -------- 中间波形区域 -------- */}
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

              {/* 悬停预览图标提示 */}
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

              {/* 修复4：JS控制的预览进度条，与实际音频时长严格同步 */}
              {isPreviewing && previewProgress > 0 && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-white/60 rounded-r"
                  style={{ width: `${previewProgress}%` }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* -------- 效果器链区域 -------- */}
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
    </div>
  );
};

// ============================================================
// EffectSlot 效果器槽位组件
// ============================================================

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
  // 修复6：从localStorage读取折叠状态，刷新后保留
  const storageKey = `${EFFECT_EXPANDED_STORAGE_KEY}${effect.id}`;
  const getInitialExpanded = (): boolean => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === '1';
      }
    } catch {
      // localStorage 不可用时（隐私模式等），默认折叠
    }
    return false;
  };

  const [isExpanded, setIsExpanded] = useState<boolean>(getInitialExpanded);

  // 修复3：动态计算内容实际高度，避免动画截断或延迟
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  const isEnabled = effect.params._enabled !== 0;

  // 折叠状态变化时：1) 测量实际高度并设置；2) 持久化到localStorage
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      // 使用requestAnimationFrame确保DOM已渲染后测量
      const measure = () => {
        if (contentRef.current) {
          const h = contentRef.current.getBoundingClientRect().height;
          setContentHeight(Math.ceil(h) + 1); // +1px避免亚像素截断
        }
      };
      requestAnimationFrame(measure);
      // 再次测量以防字体/布局在首帧后变化
      const id = window.setTimeout(measure, 50);
      return () => window.clearTimeout(id);
    } else {
      setContentHeight(0);
    }
  }, [isExpanded, effect.type, effect.params]);

  // 持久化折叠状态
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, isExpanded ? '1' : '0');
    } catch {
      // ignore storage errors
    }
  }, [isExpanded, storageKey]);

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

  const handleToggleExpanded = () => {
    setIsExpanded((prev) => !prev);
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
          className="p-3 cursor-pointer select-none"
          onClick={handleToggleExpanded}
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
              {/* 开关 */}
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
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ease-out`}
                  style={{
                    left: isEnabled ? 'calc(100% - 18px)' : '2px',
                    transform: isEnabled ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
              </div>

              {/* 删除按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    localStorage.removeItem(storageKey);
                  } catch {
                    /* ignore */
                  }
                  onRemove();
                }}
                className="w-7 h-7 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 flex items-center justify-center text-sm transition-all hover:scale-110"
                title="移除效果器"
              >
                ✕
              </button>

              {/* 展开箭头 */}
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

        {/* 修复3：使用动态计算的max-height值，避免动画截断或延迟 */}
        <div
          className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
          style={{
            maxHeight: `${contentHeight}px`,
            opacity: isExpanded ? 1 : 0,
          }}
        >
          {/* 用这个容器测量实际高度 */}
          <div
            ref={contentRef}
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

            {/* 修复5：根据参数配置动态选择旋钮(Knob)或滑块(Slider) */}
            <div className="space-y-3">
              {params && Object.entries(params).map(([key, config]) => {
                const currentValue = effect.params[key] ?? config.value;
                const control = config.control ?? 'slider';

                return control === 'knob' ? (
                  <KnobParamRow
                    key={key}
                    paramKey={key}
                    config={config}
                    currentValue={currentValue}
                    trackColor={trackColor}
                    onChange={(val) => onParamChange(key, val)}
                    onReset={() => onResetParam(key)}
                  />
                ) : (
                  <SliderParamRow
                    key={key}
                    paramKey={key}
                    config={config}
                    currentValue={currentValue}
                    trackColor={trackColor}
                    onChange={(val) => onParamChange(key, val)}
                    onReset={() => onResetParam(key)}
                  />
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

// ============================================================
// SliderParamRow - 滑块参数行 (适合直观的大范围线性调节)
// ============================================================

interface ParamRowProps {
  paramKey: string;
  config: ParamConfig;
  currentValue: number;
  trackColor: string;
  onChange: (value: number) => void;
  onReset: () => void;
}

const SliderParamRow: React.FC<ParamRowProps> = ({
  config,
  currentValue,
  trackColor,
  onChange,
  onReset,
}) => {
  const isModified = Math.abs(currentValue - config.value) > 0.0001;
  const percentage = ((currentValue - config.min) / (config.max - config.min)) * 100;

  const formatValue = (v: number) => {
    if (config.step && config.step >= 1) return String(Math.round(v));
    return Number(v.toFixed(3)).toString();
  };

  return (
    <div className="group/param">
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
            {formatValue(currentValue)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReset();
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
            onChange(parseFloat(e.target.value));
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full h-6 appearance-none bg-transparent cursor-pointer z-10 relative"
          style={{ WebkitAppearance: 'none' }}
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
        <span className="text-[9px] text-gray-600">{formatValue(config.min)}</span>
        <span className="text-[9px] text-gray-600">{formatValue(config.max)}</span>
      </div>
    </div>
  );
};

// ============================================================
// KnobParamRow - 旋钮参数行 (适合精细调节的参数如频率/Q值/压缩比)
// ============================================================

const KnobParamRow: React.FC<ParamRowProps> = ({
  config,
  currentValue,
  trackColor,
  onChange,
  onReset,
}) => {
  const isModified = Math.abs(currentValue - config.value) > 0.0001;

  const formatValue = (v: number) => {
    if (config.step && config.step >= 1) return String(Math.round(v));
    return Number(v.toFixed(3)).toString();
  };

  return (
    <div className="group/param flex items-center gap-3 py-1">
      <div className="relative flex-shrink-0" style={{ width: 56, height: 56 }}>
        <Knob
          value={currentValue}
          min={config.min}
          max={config.max}
          step={config.step ?? 0.01}
          defaultValue={config.value}
          label=""
          size={56}
          onChange={onChange}
          accentColor={trackColor}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-300 font-medium">{config.label}</span>
            {isModified && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: trackColor, boxShadow: `0 0 4px ${trackColor}` }}
              />
            )}
            {config.logarithmic && (
              <span className="text-[9px] text-gray-600 px-1 rounded bg-black/20">
                LOG
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReset();
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
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-mono bg-black/30 px-1.5 py-0.5 rounded">
            {formatValue(currentValue)}
          </span>
          <div className="flex gap-1">
            <span className="text-[9px] text-gray-600">{formatValue(config.min)}</span>
            <span className="text-[9px] text-gray-700">~</span>
            <span className="text-[9px] text-gray-600">{formatValue(config.max)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EmptyEffectSlot - 空效果器槽位
// ============================================================

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
