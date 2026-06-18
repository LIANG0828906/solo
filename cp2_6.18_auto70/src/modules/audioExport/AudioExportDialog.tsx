import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioExportDialogProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
}

const EXPORT_FORMATS = [
  { id: 'wav', label: 'WAV', desc: '无损音质' },
  { id: 'mp3', label: 'MP3 320kbps', desc: '高品质压缩' },
  { id: 'mp3-128', label: 'MP3 128kbps', desc: '低品质压缩' },
  { id: 'flac', label: 'FLAC', desc: '无损压缩' },
];

export default function AudioExportDialog({ open, onClose, projectName }: AudioExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState('wav');
  const [isExporting, setIsExporting] = useState(false);

  if (!open) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-text-primary">导出音频</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-main text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {projectName && (
          <p className="mb-4 text-sm text-text-secondary">
            项目: <span className="text-text-primary">{projectName}</span>
          </p>
        )}

        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            导出格式
          </label>
          {EXPORT_FORMATS.map((fmt) => {
            const isSelected = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg px-4 py-3 text-left transition-colors',
                  isSelected
                    ? 'bg-accent/20 border border-accent/50'
                    : 'bg-bg-main border border-transparent hover:border-[#374151]'
                )}
              >
                <div>
                  <p className={cn('text-sm font-medium', isSelected ? 'text-accent' : 'text-text-primary')}>
                    {fmt.label}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{fmt.desc}</p>
                </div>
                {isSelected && (
                  <div className="h-3 w-3 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors',
              isExporting ? 'bg-[#374151] cursor-not-allowed' : 'bg-accent hover:bg-accent/90'
            )}
          >
            <Download className="h-4 w-4" />
            {isExporting ? '导出中...' : '导出'}
          </button>
        </div>
      </div>
    </div>
  );
}
