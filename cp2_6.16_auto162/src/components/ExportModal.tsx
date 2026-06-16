import { useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store';
import type { ExportParams } from '@/utils/types';
import {
  exportVideo as doExport,
  downloadBlob,
  generateTimestampFilename,
  type ExportProgress,
} from '@/utils/ffmpegService';

export function ExportModal() {
  const {
    showExportModal,
    setShowExportModal,
    frames,
    annotations,
    exportProgress,
    setExportProgress,
    appStatus,
    setAppStatus,
  } = useAppStore();

  const [format, setFormat] = useState<'gif' | 'webm'>('gif');
  const [loop, setLoop] = useState(true);
  const [withAnnotations, setWithAnnotations] = useState(true);
  const [fps, setFps] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [stage, setStage] = useState<'idle' | 'encoding' | 'writing' | 'done'>('idle');

  if (!showExportModal) return null;

  const handleExport = async () => {
    if (frames.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setAppStatus('exporting');
    setStage('encoding');

    const params: ExportParams = {
      format,
      loop,
      withAnnotations,
      fps,
    };

    try {
      const blob = await doExport(frames, annotations, params, (p: ExportProgress) => {
        setExportProgress(Math.round((p.current / p.total) * 100));
        setStage(p.stage === 'writing' ? 'writing' : 'encoding');
      });

      setStage('done');
      const filename = generateTimestampFilename(format);
      downloadBlob(blob, filename);

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
      setIsExporting(false);
      setAppStatus('ready');
    }
  };

  const handleClose = () => {
    setShowExportModal(false);
    setIsExporting(false);
    setStage('idle');
    setExportProgress(0);
    if (appStatus === 'exporting') {
      setAppStatus('ready');
    }
  };

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (exportProgress / 100) * circumference;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      onClick={handleClose}
    >
      <div
        className="glass-heavy rounded-3xl w-full max-w-md p-6 relative"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 btn-transition p-2 rounded-xl"
          style={{ color: 'var(--text-secondary)' }}
          onClick={handleClose}
          disabled={isExporting}
        >
          <X style={{ width: 20, height: 20 }} />
        </button>

        <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
          导出动画
        </h2>

        {isExporting || stage === 'done' ? (
          <div className="flex flex-col items-center py-8">
            <div className="relative mb-6">
              <svg width={140} height={140}>
                <circle
                  cx={70}
                  cy={70}
                  r={radius}
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth={8}
                />
                <circle
                  cx={70}
                  cy={70}
                  r={radius}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={stage === 'done' ? 0 : offset}
                  className="progress-ring-circle"
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {stage === 'done' ? (
                  <Download style={{ width: 36, height: 36, color: 'var(--accent)' }} />
                ) : (
                  <>
                    <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {exportProgress}%
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {stage === 'writing' ? '合成中…' : '编码帧…'}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div
              className="text-sm text-center"
              style={{ color: stage === 'done' ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              {stage === 'done' ? '导出完成，文件已下载 ✓' : '请稍候，帧数越多耗时越久…'}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  导出格式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['gif', 'webm'] as const).map((f) => (
                    <button
                      key={f}
                      className="btn-transition py-3 px-4 rounded-xl text-sm font-medium"
                      style={{
                        background: format === f ? 'var(--accent)' : 'var(--bg-primary)',
                        color: format === f ? '#000' : 'var(--text-primary)',
                        border: format === f ? 'none' : '1px solid var(--border-color)',
                      }}
                      onClick={() => setFormat(f)}
                    >
                      {f === 'gif' ? 'GIF 动图' : 'WebM 视频'}
                    </button>
                  ))}
                </div>
              </div>

              {format === 'gif' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    循环播放
                  </span>
                  <button
                    className="btn-transition relative w-12 h-7 rounded-full"
                    style={{
                      background: loop ? 'var(--accent)' : 'var(--border-color)',
                    }}
                    onClick={() => setLoop(!loop)}
                  >
                    <span
                      className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
                      style={{ left: loop ? 26 : 4 }}
                    />
                  </button>
                </div>
              )}

              {format === 'webm' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    包含标注层
                  </span>
                  <button
                    className="btn-transition relative w-12 h-7 rounded-full"
                    style={{
                      background: withAnnotations ? 'var(--accent)' : 'var(--border-color)',
                    }}
                    onClick={() => setWithAnnotations(!withAnnotations)}
                  >
                    <span
                      className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
                      style={{ left: withAnnotations ? 26 : 4 }}
                    />
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    帧率 (FPS)
                  </label>
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                    {fps}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                />
              </div>

              <div
                className="rounded-xl p-3 text-xs"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}
              >
                将导出 {frames.length} 帧，文件名：
                <span style={{ color: 'var(--text-secondary)' }}>
                  SnapScape_{new Date().toISOString().slice(0, 10).replace(/-/g, '')}…
                </span>
              </div>
            </div>

            <button
              className="btn-transition w-full mt-6 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #00838F 0%, #00BCD4 100%)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(0, 188, 212, 0.3)',
              }}
              onClick={handleExport}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
              }}
            >
              <Download style={{ width: 18, height: 18 }} />
              开始导出
            </button>
          </>
        )}
      </div>
    </div>
  );
}
