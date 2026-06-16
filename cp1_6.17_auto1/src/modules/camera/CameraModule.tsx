import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '../../store';
import { getUserMedia, stopStream, captureFrame } from './cameraUtils';
import { exportTextureImage } from '../texture/textureEngine';

const PREVIEW_WIDTH = 640;
const PREVIEW_HEIGHT = 480;
const EXPORT_WIDTH = 1024;
const EXPORT_HEIGHT = 768;

export default function CameraModule() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const capturedImage = useAppStore((state) => state.capturedImage);
  const setCapturedImage = useAppStore((state) => state.setCapturedImage);
  const wrinkleStats = useAppStore((state) => state.wrinkleStats);
  const sensitivity = useAppStore((state) => state.sensitivity);
  const reset = useAppStore((state) => state.reset);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const isLoading = useAppStore((state) => state.isLoading);

  useEffect(() => {
    initCamera();
    return () => {
      stopStream(streamRef.current);
    };
  }, []);

  const initCamera = async () => {
    try {
      setCameraError(null);
      const stream = await getUserMedia(PREVIEW_WIDTH, PREVIEW_HEIGHT);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      setCameraError('无法访问摄像头，请检查权限设置');
      console.error('Camera error:', error);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    try {
      const imageData = captureFrame(
        videoRef.current,
        PREVIEW_WIDTH,
        PREVIEW_HEIGHT
      );
      setCapturedImage(imageData);
    } catch (error) {
      console.error('Capture error:', error);
    }
  };

  const handleReset = () => {
    reset();
  };

  const handleDownload = async () => {
    if (!capturedImage) return;

    setIsLoading(true);

    try {
      const dataUrl = await exportTextureImage(
        capturedImage,
        sensitivity,
        EXPORT_WIDTH,
        EXPORT_HEIGHT
      );

      const link = document.createElement('a');
      link.download = `wrinkle-texture-${uuidv4()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <div className="camera-module">
      <div className="camera-preview-container">
        {cameraError ? (
          <div className="camera-error">
            <p>{cameraError}</p>
            <button onClick={initCamera} className="retry-btn">
              重试
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="camera-video"
            width={PREVIEW_WIDTH}
            height={PREVIEW_HEIGHT}
            playsInline
            muted
          />
        )}

        <div className="camera-controls">
          <button
            onClick={handleCapture}
            className="control-btn capture-btn"
            disabled={!!cameraError}
          >
            拍照抓取
          </button>
          <button onClick={handleReset} className="control-btn reset-btn">
            重置
          </button>
          <button
            onClick={handleDownload}
            className="control-btn download-btn"
            disabled={!capturedImage || isLoading}
          >
            下载纹理图
          </button>
        </div>
      </div>

      <div className="camera-stats">
        {wrinkleStats ? (
          <>
            <div className="stat-item">
              <span className="stat-label">平均褶皱强度：</span>
              <span className="stat-value">
                {wrinkleStats.averageIntensity.toFixed(1)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">最大褶皱位置：</span>
              <span className="stat-value">
                ({Math.round(wrinkleStats.maxLocation.x)},{' '}
                {Math.round(wrinkleStats.maxLocation.y)})
              </span>
            </div>
          </>
        ) : (
          <p className="stats-placeholder">抓取照片后显示褶皱统计信息</p>
        )}
      </div>
    </div>
  );
}
