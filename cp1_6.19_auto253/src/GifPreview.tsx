import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from './store';
import { drawFrameToCanvas } from './utils/frame';
import { GRID_SIZE, PREVIEW_SIZE } from './utils/palette';
import { exportFramesAsZip, downloadGif } from './utils/zip';
import type { FrameData } from './types';

const PIXEL = PREVIEW_SIZE / GRID_SIZE;
const FRAME_DELAY = 100;

const GifPreview: React.FC = () => {
  const frames = useAppStore((s) => s.frames);
  const gifUrl = useAppStore((s) => s.gifUrl);
  const setGifUrl = useAppStore((s) => s.setGifUrl);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const editCount = useAppStore((s) => s.editCount);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const playIndexRef = useRef(0);
  const playTimerRef = useRef<number | null>(null);
  const lastSyncedEditRef = useRef(0);

  const generateGif = async () => {
    if (frames.length < 2 || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/gif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: frames.map((f) => ({ data: f.data })),
          delay: FRAME_DELAY
        })
      });

      const data = await res.json();
      if (data.success && data.url) {
        setGifUrl(data.url);
      } else if (data.success && data.base64) {
        setGifUrl(`data:image/gif;base64,${data.base64}`);
      }
    } catch (err) {
      console.error('GIF生成失败:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (frames.length >= 2 && editCount > 0 && editCount % 5 === 0 && editCount !== lastSyncedEditRef.current) {
      lastSyncedEditRef.current = editCount;
      generateGif();
    }
  }, [editCount, frames.length]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || frames.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const frameData = frames[playIndexRef.current]?.data;
      if (frameData) {
        drawFrameToCanvas(ctx, frameData, PREVIEW_SIZE, PIXEL);
      }
    };

    render();

    if (isPlaying && frames.length > 1) {
      playTimerRef.current = window.setInterval(() => {
        playIndexRef.current = (playIndexRef.current + 1) % frames.length;
        render();
      }, FRAME_DELAY);
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [frames, isPlaying]);

  useEffect(() => {
    playIndexRef.current = 0;
  }, [frames.length]);

  const handleTogglePlay = () => {
    if (!isPlaying) {
      playIndexRef.current = 0;
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownloadGif = () => {
    if (gifUrl) {
      downloadGif(gifUrl);
    }
  };

  const handleExportZip = () => {
    const dataList: FrameData[] = frames.map((f) => f.data);
    exportFramesAsZip(dataList);
  };

  return (
    <div className="preview-panel">
      <div className="animation-preview">
        <div className="preview-title">动画预览</div>
        <canvas
          ref={previewCanvasRef}
          className="preview-canvas"
          width={PREVIEW_SIZE}
          height={PREVIEW_SIZE}
        />
        <div className="play-controls">
          <button className="btn btn-secondary" onClick={handleTogglePlay} disabled={frames.length < 2}>
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
        </div>
      </div>

      <div className="gif-preview-section">
        <div className="preview-title">GIF 预览</div>
        {gifUrl ? (
          <img src={gifUrl} alt="GIF预览" className="gif-image" />
        ) : (
          <div className="gif-placeholder">
            {frames.length < 2
              ? '至少需要2帧才能合成GIF'
              : isGenerating
              ? '正在生成GIF...'
              : '每5次编辑自动合成\n或手动点击按钮'}
          </div>
        )}
        <button
          className="btn btn-generate"
          onClick={generateGif}
          disabled={frames.length < 2 || isGenerating}
        >
          {isGenerating ? '生成中...' : '⚡ 合成GIF'}
        </button>
        <div className="export-buttons">
          <button
            className="btn btn-secondary"
            onClick={handleDownloadGif}
            disabled={!gifUrl}
          >
            ⬇ 下载GIF
          </button>
          <button className="btn btn-secondary" onClick={handleExportZip} disabled={frames.length === 0}>
            📦 导出帧序列
          </button>
        </div>
      </div>
    </div>
  );
};

export default GifPreview;
