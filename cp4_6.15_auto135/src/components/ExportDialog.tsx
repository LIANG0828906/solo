import { useEffect, useRef } from 'react';
import { useNebulaStore } from '../store/useNebulaStore';
import { exportNebula } from '../utils/exportUtils';
import { useThree } from '@react-three/fiber';
import './ExportDialog.css';

export function ExportDialog() {
  const showExportDialog = useNebulaStore((state) => state.showExportDialog);
  const setShowExportDialog = useNebulaStore((state) => state.setShowExportDialog);
  const exportFormat = useNebulaStore((state) => state.exportFormat);
  const setExportFormat = useNebulaStore((state) => state.setExportFormat);
  const exportProgress = useNebulaStore((state) => state.exportProgress);
  const setExportProgress = useNebulaStore((state) => state.setExportProgress);
  const isExporting = useNebulaStore((state) => state.isExporting);
  const setIsExporting = useNebulaStore((state) => state.setIsExporting);
  const isPlaying = useNebulaStore((state) => state.isPlaying);
  const setIsPlaying = useNebulaStore((state) => state.setIsPlaying);
  const { gl } = useThree();

  const wasPlayingRef = useRef(false);

  useEffect(() => {
    if (showExportDialog && !isExporting) {
      wasPlayingRef.current = isPlaying;
      if (isPlaying) {
        setIsPlaying(false);
      }
    }
  }, [showExportDialog, isExporting, isPlaying, setIsPlaying]);

  const handleClose = () => {
    if (isExporting) return;
    setShowExportDialog(false);
    if (wasPlayingRef.current) {
      setIsPlaying(true);
    }
  };

  const handleExport = async () => {
    const canvas = gl.domElement;
    if (!canvas) return;

    setIsExporting(true);

    try {
      await exportNebula({
        canvas,
        duration: 5,
        fps: 30,
        format: exportFormat,
        onProgress: (progress) => {
          setExportProgress(progress);
        },
        onComplete: () => {
          setTimeout(() => {
            setIsExporting(false);
            setShowExportDialog(false);
            setExportProgress(0);
            if (wasPlayingRef.current) {
              setIsPlaying(true);
            }
          }, 1000);
        }
      });
    } catch (error) {
      console.error('导出失败:', error);
      setIsExporting(false);
    }
  };

  if (!showExportDialog) return null;

  return (
    <div className="export-dialog-overlay" onClick={handleClose}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={handleClose} disabled={isExporting}>
          ×
        </button>

        <h3 className="dialog-title">导出动效</h3>
        <p className="dialog-subtitle">选择导出格式并开始录制</p>

        {!isExporting ? (
          <>
            <div className="format-selector">
              <button
                className={`format-btn ${exportFormat === 'mp4' ? 'active' : ''}`}
                onClick={() => setExportFormat('mp4')}
              >
                <div className="format-icon">🎬</div>
                <div className="format-info">
                  <span className="format-name">MP4 视频</span>
                  <span className="format-desc">高质量，文件较小</span>
                </div>
              </button>

              <button
                className={`format-btn ${exportFormat === 'gif' ? 'active' : ''}`}
                onClick={() => setExportFormat('gif')}
              >
                <div className="format-icon">🖼️</div>
                <div className="format-info">
                  <span className="format-name">GIF 动图</span>
                  <span className="format-desc">可直接分享，循环播放</span>
                </div>
              </button>
            </div>

            <div className="export-info">
              <div className="info-row">
                <span>时长</span>
                <span>5 秒</span>
              </div>
              <div className="info-row">
                <span>帧率</span>
                <span>30 FPS</span>
              </div>
            </div>

            <button className="start-export-btn" onClick={handleExport}>
              开始导出
            </button>
          </>
        ) : (
          <div className="export-progress">
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <div className="progress-text">
              <span>导出中...</span>
              <span>{exportProgress}%</span>
            </div>
            <p className="export-tip">请勿关闭窗口，录制将在5秒后完成</p>
          </div>
        )}
      </div>
    </div>
  );
}
