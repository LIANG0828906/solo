import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check } from 'lucide-react';
import { useBoardStore } from '@/stores/useBoardStore';

export const ExportToast: React.FC = () => {
  const { exportToast, hideToast, copyShareText } = useBoardStore();
  const [copied, setCopied] = React.useState(false);

  const handleDownload = useCallback(() => {
    if (exportToast.downloadUrl) {
      const link = document.createElement('a');
      link.download = `品牌灵感板_${Date.now()}.png`;
      link.href = exportToast.downloadUrl;
      link.click();
      hideToast();
    }
  }, [exportToast.downloadUrl, hideToast]);

  const handleCopy = useCallback(async () => {
    if (exportToast.shareText) {
      await copyShareText(exportToast.shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [exportToast.shareText, copyShareText]);

  return (
    <AnimatePresence>
      {exportToast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
        >
          <div
            className="rounded-xl shadow-2xl p-4 flex items-center gap-3"
            style={{ backgroundColor: '#4CAF50' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {exportToast.message}
              </p>
              {exportToast.shareText && (
                <p className="text-white/80 text-xs mt-1 truncate">
                  {exportToast.shareText}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1">
              {exportToast.downloadUrl && (
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  title="下载图片"
                >
                  <Download size={18} className="text-white" />
                </button>
              )}

              {exportToast.shareText && (
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  title="复制分享文本"
                >
                  {copied ? (
                    <Check size={18} className="text-white" />
                  ) : (
                    <Copy size={18} className="text-white" />
                  )}
                </button>
              )}

              <button
                onClick={hideToast}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title="关闭"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
