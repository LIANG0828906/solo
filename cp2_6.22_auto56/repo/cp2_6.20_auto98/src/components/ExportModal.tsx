import React, { useState, useEffect, useMemo } from 'react';
import type { Color } from '@/types';
import { Copy, Check, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSS, exportToSCSS, exportToSVG } from '@/utils/exportUtils';

type ExportFormat = 'css' | 'scss' | 'svg';

interface ExportModalProps {
  palette: { colors: Color[]; name: string } | null;
  onClose: () => void;
}

const formatLabels: Record<ExportFormat, string> = {
  css: 'CSS变量',
  scss: 'SCSS变量',
  svg: 'SVG图片',
};

const ExportModal: React.FC<ExportModalProps> = ({ palette, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const code = useMemo(() => {
    if (!palette) return '';
    const exportPalette = {
      ...palette,
      id: 'export',
      type: 'extracted' as const,
      tags: [] as string[],
      createdAt: Date.now(),
    };
    switch (format) {
      case 'css':
        return exportToCSS(exportPalette);
      case 'scss':
        return exportToSCSS(exportPalette);
      case 'svg':
        return exportToSVG(exportPalette);
      default:
        return '';
    }
  }, [palette, format]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleDownload = () => {
    if (!palette) return;

    let filename: string;
    let content: string;
    let mimeType: string;

    switch (format) {
      case 'css':
        filename = `${palette.name || 'palette'}.css`;
        content = code;
        mimeType = 'text/css';
        break;
      case 'scss':
        filename = `${palette.name || 'palette'}.scss`;
        content = code;
        mimeType = 'text/x-scss';
        break;
      case 'svg':
        filename = `${palette.name || 'palette'}.svg`;
        content = code;
        mimeType = 'image/svg+xml';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!palette) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            导出配色方案
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {(['css', 'scss', 'svg'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                  format === f
                    ? 'bg-[#7c5cfc] text-white border-[#7c5cfc]'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#7c5cfc]'
                )}
              >
                {formatLabels[f]}
              </button>
            ))}
          </div>

          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {formatLabels[format]}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    copied
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
              </div>
            </div>

            {format === 'svg' ? (
              <div className="p-4 bg-white dark:bg-gray-800 flex items-center justify-center">
                <div
                  className="w-full rounded-lg overflow-hidden shadow-inner"
                  dangerouslySetInnerHTML={{ __html: code }}
                />
              </div>
            ) : (
              <pre className="p-4 bg-gray-900 dark:bg-gray-900 text-gray-100 text-sm overflow-x-auto max-h-64">
                <code>{code}</code>
              </pre>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
