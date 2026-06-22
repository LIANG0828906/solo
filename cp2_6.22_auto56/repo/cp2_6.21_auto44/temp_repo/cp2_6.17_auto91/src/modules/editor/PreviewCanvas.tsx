import { useEffect, useRef, useState, useCallback } from 'react';
import { useVideoStore } from '../video/videoStore';
import { useEditorStore } from './editStore';
import { LoadingSpinner } from './LoadingSpinner';
import './PreviewCanvas.css';

const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const sequenceTimeRef = useRef<number>(0);
  const isDocumentVisible = useRef<boolean>(true);

  const isLoading = useVideoStore((state) => state.isLoading);
  const loadError = useVideoStore((state) => state.loadError);
  const metadata = useVideoStore((state) => state.metadata);
  const getFrameAtTime = useVideoStore((state) => state.getFrameAtTime);

  const clips = useEditorStore((state) => state.clips);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const isLooping = useEditorStore((state) => state.isLooping);
  const playheadTime = useEditorStore((state) => state.playheadTime);
  const selectedClipId = useEditorStore((state) => state.selectedClipId);
  const currentClipIndex = useEditorStore((state) => state.currentClipIndex);
  const setPlayheadTime = useEditorStore((state) => state.setPlayheadTime);
  const stop = useEditorStore((state) => state.stop);

  const [renderError, setRenderError] = useState<string | null>(null);

  const sortedClips = [...clips].sort((a, b) => a.orderIndex - b.orderIndex);

  const getSequenceTotalDuration = useCallback(() => {
    if (sortedClips.length === 0) return 0;
    return sortedClips.reduce((total, clip) => total + (clip.endTime - clip.startTime), 0);
  }, [sortedClips]);

  const getClipAtSequenceTime = useCallback(
    (sequenceTime: number) => {
      let accumulatedTime = 0;
      for (let i = 0; i < sortedClips.length; i++) {
        const clip = sortedClips[i];
        const clipDuration = clip.endTime - clip.startTime;
        if (sequenceTime >= accumulatedTime && sequenceTime < accumulatedTime + clipDuration) {
          return {
            clip,
            clipIndex: i,
            localTime: sequenceTime - accumulatedTime,
            sourceTime: clip.startTime + (sequenceTime - accumulatedTime),
          };
        }
        accumulatedTime += clipDuration;
      }
      return null;
    },
    [sortedClips]
  );

  const renderFrame = useCallback(
    async (sourceTime: number, overlayText: string | null) => {
      const canvas = canvasRef.current;
      if (!canvas || !metadata) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      try {
        const imageData = await getFrameAtTime(sourceTime);
        if (imageData) {
          ctx.putImageData(imageData, 0, 0);
        }
      } catch {
        setRenderError('帧渲染失败');
        return;
      }

      if (overlayText) {
        ctx.save();
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(overlayText, canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = '#fff';
        ctx.fillText(overlayText, canvas.width / 2, canvas.height / 2);

        ctx.restore();
      }

      setRenderError(null);
    },
    [metadata, getFrameAtTime]
  );

  const animationLoop = useCallback(
    (timestamp: number) => {
      if (!isPlaying || !metadata || sortedClips.length === 0) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;
      const effectiveFrameInterval = isDocumentVisible.current ? FRAME_INTERVAL : FRAME_INTERVAL * 3;

      if (elapsed >= effectiveFrameInterval) {
        lastFrameTimeRef.current = timestamp - (elapsed % effectiveFrameInterval);

        const deltaTime = effectiveFrameInterval / 1000;
        sequenceTimeRef.current += deltaTime;

        const totalDuration = getSequenceTotalDuration();

        if (sequenceTimeRef.current >= totalDuration) {
          if (isLooping) {
            sequenceTimeRef.current = 0;
          } else {
            stop();
            return;
          }
        }

        const clipInfo = getClipAtSequenceTime(sequenceTimeRef.current);
        if (clipInfo) {
          setPlayheadTime(clipInfo.sourceTime);
          renderFrame(clipInfo.sourceTime, clipInfo.clip.text || null);
        } else {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animationLoop);
    },
    [
      isPlaying,
      metadata,
      sortedClips.length,
      isLooping,
      getSequenceTotalDuration,
      getClipAtSequenceTime,
      renderFrame,
      setPlayheadTime,
      stop,
    ]
  );

  useEffect(() => {
    if (isPlaying && metadata && sortedClips.length > 0) {
      sequenceTimeRef.current = 0;
      lastFrameTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, metadata, sortedClips.length, animationLoop]);

  useEffect(() => {
    if (!isPlaying && metadata) {
      const selectedClip = clips.find((c) => c.id === selectedClipId);
      if (selectedClip && playheadTime >= selectedClip.startTime && playheadTime <= selectedClip.endTime) {
        renderFrame(playheadTime, selectedClip.text || null);
      } else {
        const activeClip = sortedClips.find(
          (c) => playheadTime >= c.startTime && playheadTime <= c.endTime
        );
        renderFrame(playheadTime, activeClip?.text || null);
      }
    }
  }, [isPlaying, playheadTime, selectedClipId, clips, sortedClips, metadata, renderFrame]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisible.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="preview-container">
      <div className="preview-wrapper">
        {isLoading ? (
          <div className="preview-loading">
            <LoadingSpinner size={44} />
            <span className="loading-text">正在加载视频...</span>
          </div>
        ) : loadError || renderError ? (
          <div className="preview-error">
            <span className="error-text">{loadError || renderError}</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="preview-canvas"
          />
        )}

        {!isLoading && !loadError && metadata && (
          <div className="preview-info">
            <span className="info-text">
              时长: {metadata.duration.toFixed(1)}s · {sortedClips.length} 个剪辑片段
            </span>
            {currentClipIndex >= 0 && sortedClips[currentClipIndex] && (
              <span className="current-clip">
                当前: 片段 {currentClipIndex + 1}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
