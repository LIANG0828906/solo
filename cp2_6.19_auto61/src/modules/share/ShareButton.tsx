import { useState, useEffect, useCallback, useRef } from 'react';
import { Share2, X, Copy, Check, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const ShareButton: React.FC = () => {
  const { roomName, setRoomName, frames } = useAppStore();

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastEntering, setToastEntering] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const closeTimerRef = useRef<number | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  const generateShareLink = () => {
    const hex = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return `https://gallery.app/s/${hex}`;
  };

  const showToast = useCallback(() => {
    setToastVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToastEntering(true);
      });
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastEntering(false);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 2000);
    return () => clearTimeout(timer);
  }, [toastVisible, hideToast]);

  const handleToastTransitionEnd = () => {
    if (!toastEntering) {
      setToastVisible(false);
    }
  };

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showToast();
  }, [showToast]);

  useEffect(() => {
    if (!panelOpen) return;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 240;
    const ctx = canvas.getContext('2d')!;

    const bgGradient = ctx.createLinearGradient(0, 0, 400, 240);
    bgGradient.addColorStop(0, '#F5F0EB');
    bgGradient.addColorStop(1, '#E8DFD6');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 400, 240);

    const margin = 24;
    const roomW = 352;
    const roomH = 192;
    const roomX = margin;
    const roomY = margin;
    const radius = 8;

    ctx.beginPath();
    ctx.moveTo(roomX + radius, roomY);
    ctx.lineTo(roomX + roomW - radius, roomY);
    ctx.quadraticCurveTo(roomX + roomW, roomY, roomX + roomW, roomY + radius);
    ctx.lineTo(roomX + roomW, roomY + roomH - radius);
    ctx.quadraticCurveTo(roomX + roomW, roomY + roomH, roomX + roomW - radius, roomY + roomH);
    ctx.lineTo(roomX + radius, roomY + roomH);
    ctx.quadraticCurveTo(roomX, roomY + roomH, roomX, roomY + roomH - radius);
    ctx.lineTo(roomX, roomY + radius);
    ctx.quadraticCurveTo(roomX, roomY, roomX + radius, roomY);
    ctx.closePath();
    ctx.fillStyle = '#FFFDF8';
    ctx.fill();
    ctx.strokeStyle = '#B8AFA6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#9C938A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('北墙', roomX + roomW / 2, roomY + 10);
    ctx.fillText('南墙', roomX + roomW / 2, roomY + roomH - 10);
    ctx.save();
    ctx.translate(roomX + 10, roomY + roomH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('西墙', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(roomX + roomW - 10, roomY + roomH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('东墙', 0, 0);
    ctx.restore();

    const frameColors = ['#C4A882', '#A88266', '#D4A574'];

    const drawFrame = (x: number, y: number, w: number, h: number, colorIdx: number) => {
      const color = frameColors[colorIdx % 3];
      const fr = 2;
      ctx.beginPath();
      ctx.moveTo(x + fr, y);
      ctx.lineTo(x + w - fr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + fr);
      ctx.lineTo(x + w, y + h - fr);
      ctx.quadraticCurveTo(x + w, y + h, x + w - fr, y + h);
      ctx.lineTo(x + fr, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - fr);
      ctx.lineTo(x, y + fr);
      ctx.quadraticCurveTo(x, y, x + fr, y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    frames.forEach((frame, idx) => {
      if (frame.wallId === 'north') {
        const t = (frame.positionX + 3.8) / 7.6;
        const cx = 64 + t * (336 - 64);
        drawFrame(cx - 6, 36 - 4, 12, 8, idx);
      } else if (frame.wallId === 'south') {
        const t = (frame.positionX + 3.8) / 7.6;
        const cx = 64 + t * (336 - 64);
        drawFrame(cx - 6, 196 - 4, 12, 8, idx);
      } else if (frame.wallId === 'west') {
        const t = (frame.positionX + 2.8) / 5.6;
        const cy = 60 + t * (180 - 60);
        drawFrame(36 - 4, cy - 6, 8, 12, idx);
      } else if (frame.wallId === 'east') {
        const t = (frame.positionX + 2.8) / 5.6;
        const cy = 60 + t * (180 - 60);
        drawFrame(356 - 4, cy - 6, 8, 12, idx);
      }
    });

    const centerX = roomX + roomW / 2;
    const centerY = roomY + roomH / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#4cda6b';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#8A8078';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`共 ${frames.length} 幅灵感`, roomX + roomW - 4, roomY + roomH - 6);

    setPreviewSrc(canvas.toDataURL('image/png'));
  }, [panelOpen, frames, roomName]);

  useEffect(() => {
    if (panelOpen) {
      setDraftName(roomName);
    }
  }, [panelOpen, roomName]);

  const openPanel = () => {
    setGeneratedLink(null);
    setCopied(false);
    setPanelOpen(true);
    setPanelClosing(false);
  };

  const closePanel = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    setPanelClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setPanelOpen(false);
      setPanelClosing(false);
    }, 320);
  };

  const handleGenerateLink = async () => {
    setRoomName(draftName.trim() || '我的灵感画廊');
    const link = generateShareLink();
    setGeneratedLink(link);
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    await copyToClipboard(generatedLink);
    setCopied(true);
    if (copiedTimerRef.current) {
      window.clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePanel();
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closePanel();
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <button
        onClick={openPanel}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#C4A882] hover:bg-[#B09370] text-white rounded-xl px-4 py-2 transition duration-300 ease-out"
      >
        <Share2 className="w-4 h-4" />
        分享
      </button>

      {panelOpen && (
        <div
          onClick={handleBackdropClick}
          onKeyDown={handleOverlayKeyDown}
          role="presentation"
          style={{
            transitionTimingFunction: 'ease-out',
          }}
          className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
            panelClosing ? 'bg-black/0' : 'bg-black/40'
          }`}
        >
          <div
            style={{
              transitionTimingFunction: panelClosing
                ? 'cubic-bezier(0.4, 0, 0.2, 1)'
                : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className={`w-[min(460px,94vw)] rounded-2xl bg-[#FFFDF8] shadow-2xl overflow-hidden transition-all ${
              panelClosing
                ? 'duration-300 scale-90 opacity-0 translate-y-3'
                : 'duration-[350ms] scale-100 opacity-100 translate-y-0'
            }`}
          >
            <div className="relative">
              {previewSrc && (
                <img
                  src={previewSrc}
                  alt="房间预览"
                  className="w-full h-60 object-cover bg-[#F5F0EB]"
                />
              )}
              <button
                onClick={closePanel}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8A8078] mb-1.5">
                  房间名称
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D0C7] bg-white text-[#5C524A] text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
                  placeholder="输入房间名称"
                />
              </div>

              {generatedLink ? (
                <div>
                  <label className="block text-sm font-medium text-[#8A8078] mb-1.5">
                    分享链接
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 rounded-lg border border-[#D9D0C7] bg-[#F9F5F0] text-[#5C524A] text-sm truncate font-mono">
                      {generatedLink}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                        copied
                          ? 'bg-[#4cda6b] text-white'
                          : 'bg-[#C4A882] hover:bg-[#B09370] text-white'
                      }`}
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
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3 pt-1">
                {!generatedLink ? (
                  <button
                    onClick={handleGenerateLink}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#C4A882] hover:bg-[#B09370] text-white rounded-xl py-2.5 font-medium transition-all duration-200"
                  >
                    <Sparkles className="w-4 h-4" />
                    生成分享链接
                  </button>
                ) : (
                  <button
                    onClick={handleCopyLink}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 font-medium transition-all duration-200 ${
                      copied
                        ? 'bg-[#4cda6b] text-white'
                        : 'bg-[#C4A882] hover:bg-[#B09370] text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        已复制链接
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制链接
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={closePanel}
                  className="px-5 py-2.5 rounded-xl border border-[#D9D0C7] bg-white text-[#5C524A] font-medium hover:bg-[#F9F5F0] transition-all duration-200"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastVisible && (
        <div
          onTransitionEnd={handleToastTransitionEnd}
          style={{
            transitionTimingFunction: toastEntering
              ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#5C524A] text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-400 z-[60] ${
            toastEntering
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
          }`}
        >
          已复制到剪贴板
        </div>
      )}
    </>
  );
};

export default ShareButton;
