import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getUserMedia, stopStream, captureFrame } from './cameraUtils';
import { useAppStore } from '../../store';

const CAMERA_WIDTH = 640;
const CAMERA_HEIGHT = 480;

export const CameraModule: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    capturedImage,
    wrinkleStats,
    setCapturedImage,
    resetAll,
  } = useAppStore();

  const initCamera = useCallback(async () => {
    setError(null);
    const stream = await getUserMedia(videoRef, CAMERA_WIDTH, CAMERA_HEIGHT);

    if (!stream) {
      setError('无法访问摄像头，请检查权限设置');
      return;
    }

    streamRef.current = stream;
  }, []);

  useEffect(() => {
    initCamera();

    return () => {
      stopStream(streamRef.current);
    };
  }, [initCamera]);

  const handleCapture = useCallback(() => {
    const imageData = captureFrame(videoRef, CAMERA_WIDTH, CAMERA_HEIGHT);
    if (imageData) {
      setCapturedImage(imageData);
    }
  }, [setCapturedImage]);

  const handleReset = useCallback(() => {
    resetAll();
  }, [resetAll]);

  const handleDownload = useCallback(() => {
    if (!capturedImage) return;

    const workspaceCanvas = document.getElementById('workspace-canvas') as HTMLCanvasElement | null;
    if (!workspaceCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 768;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    exportCtx.drawImage(workspaceCanvas, 0, 0, 1024, 768);

    const link = document.createElement('a');
    link.download = `wrinkle-texture-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [capturedImage]);

  const averageIntensity = wrinkleStats
    ? Math.round(wrinkleStats.averageIntensity * 100)
    : 0;

  return (
    <div className="left-panel">
      <div className="section-title">摄像头预览</div>

      <div className="camera-wrapper">
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          width={CAMERA_WIDTH}
          height={CAMERA_HEIGHT}
        />

        {error && (
          <div className="camera-error">
            <p>{error}</p>
            <button className="btn" style={{ marginTop: 12 }} onClick={initCamera}>
              重试
            </button>
          </div>
        )}

        <div className="camera-controls">
          <button className="btn" onClick={handleCapture} disabled={!!error}>
            拍照抓取
          </button>
          <button
            className="btn"
            onClick={handleReset}
            disabled={!capturedImage}
          >
            重置
          </button>
          <button
            className="btn"
            onClick={handleDownload}
            disabled={!capturedImage}
          >
            下载纹理图
          </button>
        </div>
      </div>

      <div className="stats-panel">
        <div className="section-title" style={{ marginBottom: 8 }}>
          褶皱分析统计
        </div>
        <div className="stats-row">
          <span className="stats-label">平均褶皱强度</span>
          <span className="stats-value">{averageIntensity}%</span>
        </div>
        <div className="stats-row">
          <span className="stats-label">最大褶皱区域</span>
          <span className="stats-value">
            {wrinkleStats
              ? `(${wrinkleStats.maxRegionX}, ${wrinkleStats.maxRegionY})`
              : '—'}
          </span>
        </div>
        <div className="stats-row">
          <span className="stats-label">网格密度</span>
          <span className="stats-value">
            {wrinkleStats
              ? `${wrinkleStats.gridWidth} × ${wrinkleStats.gridHeight}`
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
