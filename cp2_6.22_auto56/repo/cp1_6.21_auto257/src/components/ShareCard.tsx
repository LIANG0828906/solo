import { useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import type { Work } from '../types';

interface ShareCardProps {
  work: Work | null;
  backendImage: string | null;
  open: boolean;
  onClose: () => void;
  brandSettings: {
    logoText: string;
    gradientFrom: string;
    gradientTo: string;
  };
}

function calculateCost(work: Work | null): number {
  if (!work) return 0;
  return (work.materials || []).reduce(
    (s, m) => s + (Number(m.unitPrice) || 0) * (Number(m.quantity) || 0),
    0,
  );
}

export default function ShareCard({
  work,
  backendImage,
  open,
  onClose,
  brandSettings,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const cost = useMemo(() => calculateCost(work), [work]);
  const profit = work ? Number(work.price || 0) - cost : 0;

  const mainImg = work?.images?.[0];

  const handleSavePng = async () => {
    try {
      if (backendImage) {
        const link = document.createElement('a');
        link.href = backendImage;
        link.download = `${work?.name || '艺匠工坊作品'}-分享卡.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onClose();
        return;
      }
      if (!cardRef.current) return;
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: brandSettings.gradientFrom,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${work?.name || '艺匠工坊作品'}-分享卡.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onClose();
    } catch (e: unknown) {
      console.error('保存PNG失败:', e);
      alert('保存失败，请重试');
    }
  };

  if (!open || !work) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center fade-in"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative modal-enter flex flex-col items-center gap-5 max-w-[95vw] max-h-[95vh] p-6 rounded-2xl"
        style={{ background: '#1E293B' }}
      >
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-lg font-semibold text-[#F1F5F9]">分享卡片预览</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {backendImage ? '使用后端合成高清版本' : '使用前端渲染版本'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg text-[#94A3B8] hover:bg-[#334155] hover:text-[#F1F5F9] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-auto scrollbar max-h-[65vh]">
          {backendImage ? (
            <img
              src={backendImage}
              alt="分享卡"
              className="rounded-xl shadow-2xl"
              style={{ maxWidth: 480, width: '100%' }}
            />
          ) : (
            <div
              ref={cardRef}
              className="relative overflow-hidden shadow-2xl rounded-xl"
              style={{
                width: 480,
                height: 600,
                background: `linear-gradient(180deg, ${brandSettings.gradientFrom} 0%, ${brandSettings.gradientTo} 100%)`,
              }}
            >
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <div
                  className="w-1.5 h-8 rounded-sm"
                  style={{ background: 'linear-gradient(180deg, #A78BFA, #8B5CF6)' }}
                />
                <div className="text-xl font-bold text-[#F1F5F9] tracking-wide drop-shadow-lg">
                  {brandSettings.logoText}
                </div>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 rounded-xl overflow-hidden shadow-xl"
                style={{ top: 70, width: 384, height: 384, background: '#334155' }}
              >
                {mainImg ? (
                  <img src={mainImg.url} alt={work.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#64748B]">
                    <div className="text-6xl opacity-40">🖼️</div>
                  </div>
                )}
              </div>

              <div
                className="absolute right-6 text-right"
                style={{ bottom: 60 }}
              >
                <div className="text-[#10B981] font-bold mono-font" style={{ fontSize: 30 }}>
                  ¥{Number(work.price || 0).toFixed(0)}
                </div>
                {(work.texture || (work.materials?.length ?? 0) > 0) && (
                  <div className="text-[#CBD5E1] mt-1.5 text-sm">
                    {work.texture ||
                      (work.materials || []).slice(0, 3).map((m) => m.name).join(' · ')}
                  </div>
                )}
                {work.size && (
                  <div className="text-[#CBD5E1] mt-1 text-sm">{work.size}</div>
                )}
              </div>

              <div className="absolute bottom-6 left-6 text-[#94A3B8] text-xs leading-5">
                <div>成本 ¥{cost.toFixed(2)} · 共 {work.materials?.length || 0} 种物料</div>
                {profit > 0 && (
                  <div className="text-[#A78BFA]">单件利润 ¥{profit.toFixed(2)}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 w-full pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={handleSavePng}>
            💾 保存为 PNG
          </button>
        </div>
      </div>
    </div>
  );
}
