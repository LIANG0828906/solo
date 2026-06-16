import React, { useState, useEffect } from 'react';
import { Download, Share2, Loader2, X, Copy, Check, FileCode } from 'lucide-react';
import { useAnimStore } from '../store';
import { generateExportPackage, downloadExportPackage, generateShareLink, copyToClipboard } from '../engine/svgGenerator';
import { CopyToast } from './Toast';

export const ExportButton: React.FC = () => {
  const blocks = useAnimStore(s => s.blocks);
  const sequences = useAnimStore(s => s.sequences);
  const showToast = useAnimStore(s => s.showToast);

  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [exportData, setExportData] = useState<{
    svgContent: string;
    jsContent: string;
    packageName: string;
    shareId: string;
    shareUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const hasShapes = blocks.some(b => b.type === 'shape');

  const handleExport = async () => {
    if (!hasShapes) {
      showToast('请先添加形状再导出');
      return;
    }

    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const data = generateExportPackage(blocks, sequences);
      const shareUrl = generateShareLink(blocks, sequences);
      setExportData({ ...data, shareUrl });
      setShowModal(true);
    } catch (e) {
      showToast('导出失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!exportData) return;
    downloadExportPackage(exportData.svgContent, exportData.jsContent, exportData.packageName);
  };

  const handleCopyLink = async () => {
    if (!exportData) return;
    const success = await copyToClipboard(exportData.shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      showToast('复制失败，请手动复制');
    }
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isLoading || !hasShapes}
        className={`
          absolute right-4 bottom-4 z-20
          flex items-center gap-2 px-4 py-2.5 rounded-2xl
          bg-gradient-to-br from-[#e94560] to-[#c73e54]
          text-white font-semibold text-sm
          shadow-xl shadow-[#e94560]/30
          hover:shadow-2xl hover:shadow-[#e94560]/40
          hover:-translate-y-0.5
          active:translate-y-0
          transition-all duration-200
          ${isLoading || !hasShapes ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}
        `}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>导出中...</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>导出</span>
          </>
        )}
      </button>

      {showModal && exportData && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
          style={{ animation: 'fadeIn 0.5s ease-out forwards' }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-md rounded-3xl overflow-hidden
              bg-gradient-to-br from-[#16213e] to-[#0f3460]
              border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#4ecdc4] flex items-center justify-center">
                      <FileCode size={18} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">导出成功！</h3>
                  </div>
                  <p className="text-sm text-white/60">
                    包含 SVG 动画和独立 JS 文件
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl
                    bg-gradient-to-r from-[#4ecdc4] to-[#44b4ac]
                    text-white font-semibold text-sm
                    shadow-lg shadow-[#4ecdc4]/30
                    hover:shadow-xl hover:shadow-[#4ecdc4]/40
                    hover:-translate-y-0.5
                    transition-all duration-200"
                >
                  <Download size={16} />
                  下载 SVG + JS 文件包
                </button>

                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                      <Share2 size={12} className="text-[#e94560]" />
                      分享链接
                    </label>
                    <button
                      onClick={handleCopyLink}
                      className={`
                        flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                        transition-all duration-200
                        ${copied
                          ? 'bg-[#4ecdc4]/20 text-[#4ecdc4]'
                          : 'bg-white/5 text-white/70 hover:bg-[#e94560]/20 hover:text-[#e94560]'
                        }
                      `}
                    >
                      {copied ? (
                        <>
                          <Check size={12} />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                    <code className="text-[11px] font-mono text-white/60 break-all leading-relaxed">
                      {exportData.shareUrl}
                    </code>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-[#4ecdc4]">
                    {blocks.filter(b => b.type === 'shape').length}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">形状</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#e94560]">
                    {blocks.filter(b => b.type === 'animation').length}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">动画</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CopyToast show={copied} />
    </>
  );
};
