import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Download, FileImage, FileCode } from 'lucide-react';
import { useStore } from '@/store/slice';
import { getPresetsMap } from '@/utils/presets';
import { triggerDownload } from '@/utils/svgSerializer';
import type { ExportOptions } from '@/types';
import ExportWorker from '@/workers/export.worker.ts?worker';

interface Props {
  open: boolean;
  onClose: () => void;
}

type ExportStage = 'select' | 'progress' | 'done';

export default function ExportModal({ open, onClose }: Props) {
  const elements = useStore((s) => s.elements);
  const [options, setOptions] = useState<ExportOptions>({ format: 'png', scale: 2 });
  const [stage, setStage] = useState<ExportStage>('select');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const rippleIdRef = useRef(0);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (open) {
      setStage('select');
      setProgress(0);
      setError(null);
    }
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [open]);

  const handleRipple = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((rr) => rr.id !== id)), 650);
  };

  const exportWidth = 1200;
  const exportHeight = 900;

  const startExport = useCallback(async () => {
    if (elements.length === 0) {
      setError('画布上没有可导出的元素');
      return;
    }
    setStage('progress');
    setProgress(0);
    setError(null);

    if (workerRef.current) workerRef.current.terminate();
    const worker = new ExportWorker();
    workerRef.current = worker;

    worker.onmessage = (ev) => {
      const msg = ev.data;
      if (msg.type === 'progress') {
        setProgress(msg.percent);
      } else if (msg.type === 'done') {
        setProgress(100);
        setStage('done');
        try {
          triggerDownload(msg.blob, msg.filename);
        } catch (e) {
          setError(e instanceof Error ? e.message : '下载失败');
        }
        setTimeout(() => {
          onClose();
          worker.terminate();
          workerRef.current = null;
        }, 900);
      } else if (msg.type === 'error') {
        setError(msg.message);
        setStage('select');
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = (err) => {
      setError(`Worker 错误: ${err.message || '未知错误'}`);
      setStage('select');
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({
      type: 'export',
      format: options.format,
      scale: options.scale,
      elements,
      width: exportWidth,
      height: exportHeight,
      presetsMap: getPresetsMap(),
    });
  }, [elements, options, onClose]);

  const backdrop = useMemo(
    () => (
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5,5,10,0.75)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease-out',
          zIndex: 100,
        }}
      />
    ),
    [onClose]
  );

  if (!open) return null;

  return (
    <>
      {backdrop}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 440,
          maxWidth: 'calc(100vw - 32px)',
          zIndex: 101,
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        <div
          className="glass-panel"
          style={{
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.14em',
                background:
                  'linear-gradient(90deg, var(--neon-magenta), var(--neon-cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              EXPORT
            </div>
            <button
              className="btn-neon"
              style={{ padding: '4px 6px', minWidth: 28 }}
              onClick={onClose}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ padding: 20 }}>
            {stage === 'select' && (
              <>
                <div className="panel-title">格式</div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <div
                    className={`option-card ${
                      options.format === 'png' ? 'active' : ''
                    }`}
                    onClick={() => setOptions((o) => ({ ...o, format: 'png' }))}
                  >
                    <FileImage
                      size={32}
                      style={{
                        margin: '0 auto 8px',
                        color:
                          options.format === 'png'
                            ? 'var(--neon-cyan)'
                            : 'var(--text-muted)',
                      }}
                    />
                    <div style={{ fontSize: 13, fontWeight: 700 }}>PNG</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      位图 · 高清透明
                    </div>
                  </div>
                  <div
                    className={`option-card ${
                      options.format === 'svg' ? 'active' : ''
                    }`}
                    onClick={() => setOptions((o) => ({ ...o, format: 'svg' }))}
                  >
                    <FileCode
                      size={32}
                      style={{
                        margin: '0 auto 8px',
                        color:
                          options.format === 'svg'
                            ? 'var(--neon-magenta)'
                            : 'var(--text-muted)',
                      }}
                    />
                    <div style={{ fontSize: 13, fontWeight: 700 }}>SVG</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      矢量 · 无限缩放
                    </div>
                  </div>
                </div>

                <div className="panel-title">
                  分辨率
                  <span style={{ float: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {exportWidth * options.scale} × {exportHeight * options.scale}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {([1, 2, 4] as const).map((s) => (
                    <button
                      key={s}
                      className={`option-card ${
                        options.scale === s ? 'active' : ''
                      }`}
                      onClick={() => setOptions((o) => ({ ...o, scale: s }))}
                      style={{ padding: '12px 8px' }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{s}x</div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        {s === 1
                          ? '标准'
                          : s === 2
                          ? '高清 (推荐)'
                          : '超清'}
                      </div>
                    </button>
                  ))}
                </div>

                {error && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      marginTop: 14,
                      background: 'rgba(255,45,149,0.1)',
                      border: '1px solid rgba(255,45,149,0.35)',
                      fontSize: 11,
                      color: 'var(--neon-magenta)',
                    }}
                  >
                    ⚠ {error}
                  </div>
                )}

                <button
                  className="btn-neon btn-neon-primary"
                  style={{
                    width: '100%',
                    marginTop: 18,
                    padding: '12px 16px',
                    fontSize: 13,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onClick={(e) => {
                    handleRipple(e);
                    startExport();
                  }}
                >
                  {ripples.map((r) => (
                    <span
                      key={r.id}
                      className="btn-ripple"
                      style={{
                        left: r.x - 15,
                        top: r.y - 15,
                        width: 30,
                        height: 30,
                      }}
                    />
                  ))}
                  <Download size={16} />
                  开始导出
                </button>
              </>
            )}

            {(stage === 'progress' || stage === 'done') && (
              <div style={{ padding: '16px 4px 8px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color:
                        stage === 'done' ? 'var(--neon-green)' : 'var(--neon-cyan)',
                    }}
                  >
                    {stage === 'done' ? '✓ 完成' : '合成中...'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 22,
                      fontWeight: 800,
                      background:
                        'linear-gradient(90deg, var(--neon-magenta), var(--neon-cyan))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {progress}%
                  </div>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {stage === 'progress'
                    ? `使用 OffscreenCanvas 在 Worker 线程合成 ${options.format.toUpperCase()} · ${options.scale}x 分辨率`
                    : `已生成 ${exportWidth * options.scale} × ${
                        exportHeight * options.scale
                      }，正在触发下载...`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
