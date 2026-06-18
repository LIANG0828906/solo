import React, { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '../store/audioStore';

export const Controls: React.FC = () => {
  const { isPlaying, setIsPlaying, duration, currentTime, setCurrentTime } =
    useAudioStore();
  const progressRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const timeUpdateRef = useRef<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const analysis = (window as any).__audioAnalysis;
      if (analysis?.audioContext && analysis.audioContext.state === 'running') {
        const ctx = analysis.audioContext;
        const elapsed = ctx.currentTime - (analysis as any)._startTime;
        useAudioStore.getState().setCurrentTime(Math.min(elapsed, useAudioStore.getState().duration));
      }
      timeUpdateRef.current = requestAnimationFrame(updateTime);
    };
    timeUpdateRef.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(timeUpdateRef.current);
  }, []);

  const togglePlay = useCallback(() => {
    const analysis = (window as any).__audioAnalysis;
    if (!analysis) return;

    if (isPlaying) {
      analysis.audioContext.suspend();
      setIsPlaying(false);
    } else {
      analysis.audioContext.resume();
      setIsPlaying(true);
    }
  }, [isPlaying, setIsPlaying]);

  const seekTo = useCallback(
    (ratio: number) => {
      const analysis = (window as any).__audioAnalysis;
      if (!analysis) return;

      const targetTime = ratio * duration;
      analysis.source.stop();
      const newSource = analysis.audioContext.createBufferSource();
      newSource.buffer = analysis.audioBuffer;
      newSource.connect(analysis.analyser);
      analysis.analyser.connect(analysis.gainNode);
      newSource.onended = () => {
        useAudioStore.getState().setIsPlaying(false);
      };
      newSource.start(0, targetTime);
      analysis.source = newSource;
      (analysis as any)._startTime = analysis.audioContext.currentTime - targetTime;
      setCurrentTime(targetTime);
      setIsPlaying(true);
    },
    [duration, setCurrentTime, setIsPlaying]
  );

  const onProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = e.currentTarget;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekTo(ratio);
    },
    [seekTo]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="controls-bar">
      <div className="controls-inner">
        <button className="play-btn" onClick={togglePlay}>
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <path d="M4 2 L14 8 L4 14 Z" />
            </svg>
          )}
        </button>
        <div className="progress-wrapper" onClick={onProgressBarClick}>
          <div className="progress-bg">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
