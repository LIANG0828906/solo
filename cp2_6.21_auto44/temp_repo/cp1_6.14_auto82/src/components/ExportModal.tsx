import { useEffect, useState } from 'react';
import { X, Image, FileText, Printer, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'png' | 'pdf') => Promise<void>;
  exporting: boolean;
  progress?: number;
}

type Format = 'png' | 'pdf';

export default function ExportModal({
  open,
  onClose,
  onExport,
  exporting,
  progress,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<Format>('png');
  const [showComplete, setShowComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (open) {
      setIsFadingOut(false);
      setShowComplete(false);
    }
  }, [open]);

  useEffect(() => {
    if (!exporting && open) {
      setShowComplete(true);
      const timer = setTimeout(() => {
        setShowComplete(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [exporting, open]);

  const handleClose = () => {
    if (exporting) return;
    setIsFadingOut(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleExport = async (format: Format) => {
    setSelectedFormat(format);
    await onExport(format);
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        isFadingOut ? 'opacity-0 transition-opacity duration-200' : 'animate-fadeIn'
      )}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={handleClose}
      />

      <div
        className={cn(
          'relative glass-panel rounded-2xl p-8 max-w-md w-full mx-4',
          'border border-vintage-red/20',
          'shadow-[0_0_60px_rgba(255,215,0,0.3)]',
          isFadingOut ? 'opacity-0 scale-95 transition-all duration-200' : ''
        )}
        style={{ animation: isFadingOut ? undefined : 'fadeIn 0.3s ease-out, slideUp 0.4s ease-out' }}
      >
        <button
          onClick={handleClose}
          disabled={exporting}
          className={cn(
            'absolute top-4 right-4 p-2 rounded-full transition-all duration-200',
            exporting
              ? 'text-gray-400 cursor-not-allowed opacity-50'
              : 'text-ink/60 hover:text-vintage-red hover:bg-vintage-red/10'
          )}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h3 className="font-display font-bold text-xl text-ink">
            导出版式
          </h3>
          <p className="mt-2 text-sm text-ink/60 font-sans">
            选择你喜欢的格式，将封面保存到本地
          </p>
        </div>

        {showComplete && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 animate-fadeIn">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <span className="font-medium text-green-700">导出完成！</span>
          </div>
        )}

        {!exporting && !showComplete && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleExport('png')}
                className={cn(
                  'group relative flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-300',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  selectedFormat === 'png'
                    ? 'border-vintage-red bg-vintage-red/5 shadow-gold-glow'
                    : 'border-vintage-red/20 bg-white/50 hover:border-vintage-red/50 hover:bg-white/80'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300',
                    selectedFormat === 'png'
                      ? 'bg-vintage-red text-gold'
                      : 'bg-vintage-red/10 text-vintage-red group-hover:bg-vintage-red group-hover:text-gold'
                  )}
                >
                  <Image className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-ink text-sm mb-1">高清 PNG</h4>
                <p className="text-xs text-ink/50 text-center">2x 分辨率，适合分享</p>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                className={cn(
                  'group relative flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-300',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  selectedFormat === 'pdf'
                    ? 'border-vintage-red bg-vintage-red/5 shadow-gold-glow'
                    : 'border-vintage-red/20 bg-white/50 hover:border-vintage-red/50 hover:bg-white/80'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300',
                    selectedFormat === 'pdf'
                      ? 'bg-vintage-red text-gold'
                      : 'bg-vintage-red/10 text-vintage-red group-hover:bg-vintage-red group-hover:text-gold'
                  )}
                >
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-ink text-sm mb-1">标准 PDF</h4>
                <p className="text-xs text-ink/50 text-center">A4 尺寸，便于打印</p>
              </button>
            </div>

            {typeof progress === 'number' && progress > 0 && (
              <div className="w-full">
                <div className="flex justify-between text-xs text-ink/60 mb-2">
                  <span>准备中...</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-vintage-red/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-vintage-red to-gold rounded-full transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {exporting && (
          <div className="flex flex-col items-center py-8 animate-fadeIn">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center">
                <div className="animate-printerRoller origin-center">
                  <Printer className="w-10 h-10 text-vintage-red" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-gold/30 animate-pulseGold" />
            </div>

            <p className="font-medium text-ink text-lg mb-4">正在印刷中，请稍候...</p>

            {typeof progress === 'number' && (
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs text-ink/60 mb-2">
                  <span>导出进度</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-vintage-red/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-vintage-red via-gold to-vintage-red rounded-full transition-all duration-300 animate-shimmer"
                    style={{ width: `${Math.max(progress * 100, 10)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
