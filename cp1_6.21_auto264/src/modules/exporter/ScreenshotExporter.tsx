import React, { useState, useCallback } from 'react';
import domToImage from 'dom-to-image';
import { Image, FileCode, Check } from 'lucide-react';
import { useStyleStore } from '../../store/useStyleStore';
import type { ExportFormat } from '../../types';

interface ExportButtonProps {
  format: ExportFormat;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  targetRef: React.RefObject<HTMLElement | null>;
}

const ExportButton: React.FC<ExportButtonProps> = ({ format, label, Icon, targetRef }) => {
  const status = useStyleStore((state) => state.exportStatus[format]);
  const setExportStatus = useStyleStore((state) => state.setExportStatus);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleExport = useCallback(async () => {
    if (!targetRef.current || status === 'loading') return;

    setExportStatus(format, 'loading');
    setShowOverlay(true);

    let timeoutId: number | undefined;
    try {
      await new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(() => resolve(), 300);
      });

      const target = targetRef.current;
      if (!target) throw new Error('导出目标不存在');

      const originalOverflow = target.style.overflow;
      target.style.overflow = 'visible';

      const exportOptions = {
        bgcolor: '#0F172A',
        quality: 1,
        pixelRatio: Math.min(window.devicePixelRatio || 2, 3),
        cacheBust: true,
      };

      let dataUrl: string;
      let filename: string;
      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === 'png') {
        dataUrl = await domToImage.toPng(target, exportOptions);
        filename = `code-palette-${timestamp}.png`;
      } else {
        dataUrl = await domToImage.toSvg(target, exportOptions);
        filename = `code-palette-${timestamp}.svg`;
      }

      target.style.overflow = originalOverflow;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus(format, 'success');

      window.setTimeout(() => {
        setExportStatus(format, 'idle');
        setShowOverlay(false);
      }, 1500);
    } catch (err) {
      console.error('导出失败:', err);
      setExportStatus(format, 'idle');
      setShowOverlay(false);
      alert('导出失败，请重试');
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  }, [targetRef, status, format, setExportStatus]);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="export-button flex items-center gap-2 text-white text-sm font-medium rounded-lg disabled:opacity-80 disabled:cursor-not-allowed"
        style={{
          backgroundColor: '#3B82F6',
          padding: '10px 20px',
        }}
      >
        {isLoading ? (
          <div
            className="spinner"
            style={{
              width: '20px',
              height: '20px',
            }}
          />
        ) : isSuccess ? (
          <Check size={18} className="success-check" strokeWidth={3} />
        ) : (
          <Icon size={18} />
        )}
        <span className="hidden sm:inline">
          {isLoading ? '导出中...' : isSuccess ? '导出成功' : label}
        </span>
      </button>

      {showOverlay && isLoading && (
        <div
          className="loading-overlay fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
        >
          <div className="flex flex-col items-center gap-4 bg-panel-bg rounded-2xl px-8 py-6 shadow-2xl border border-border-primary">
            <div
              className="spinner"
              style={{
                width: '48px',
                height: '48px',
                borderWidth: '4px',
              }}
            />
            <p className="text-text-primary text-sm font-medium">
              正在生成{format.toUpperCase()}...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface ScreenshotExporterProps {
  targetRef: React.RefObject<HTMLElement | null>;
}

const ScreenshotExporter: React.FC<ScreenshotExporterProps> = ({ targetRef }) => {
  return (
    <div className="flex items-center gap-2">
      <ExportButton
        format="png"
        label="导出 PNG"
        Icon={Image}
        targetRef={targetRef}
      />
      <ExportButton
        format="svg"
        label="导出 SVG"
        Icon={FileCode}
        targetRef={targetRef}
      />
    </div>
  );
};

export default ScreenshotExporter;
