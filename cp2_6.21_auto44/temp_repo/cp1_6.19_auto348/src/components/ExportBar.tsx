import { useRef, useState } from 'react';
import { Download, Package, Loader2 } from 'lucide-react';
import { useCardStore } from '@/store/cards';
import Card from './Card';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function ExportBar() {
  const cards = useCardStore((s) => s.cards);
  const isExporting = useCardStore((s) => s.isExporting);
  const exportProgress = useCardStore((s) => s.exportProgress);
  const setExporting = useCardStore((s) => s.setExporting);
  const setExportProgress = useCardStore((s) => s.setExportProgress);
  const setCurrentExportIndex = useCardStore((s) => s.setCurrentExportIndex);
  const keyword = useCardStore((s) => s.keyword);

  const hiddenRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleExport = async () => {
    if (cards.length === 0 || isExporting || busy) return;
    setBusy(true);
    setExporting(true);
    setExportProgress(0);
    const zip = new JSZip();
    const safeKeyword = (keyword || 'cards').replace(/[^\w\u4e00-\u9fa5-]/g, '') || 'cards';

    try {
      for (let i = 0; i < cards.length; i++) {
        setCurrentExportIndex(i);
        await delay(150);
        const cardEl = hiddenRef.current?.querySelector<HTMLElement>(`[data-export-idx="${i}"]`);
        if (!cardEl) continue;
        const dataUrl = await toPng(cardEl, {
          cacheBust: true,
          pixelRatio: 1,
          backgroundColor: '#ffffff',
          skipAutoScale: false,
          style: {
            transform: 'none',
          },
        });
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const fileName = `${safeKeyword}_card_${String(i + 1).padStart(2, '0')}.png`;
        zip.file(fileName, base64, { base64: true });
        setExportProgress(Math.round(((i + 1) / cards.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${safeKeyword}_cards_${Date.now()}.zip`);
    } catch (err) {
      console.error('导出失败', err);
      alert('导出过程中出现错误，请重试。');
    } finally {
      setCurrentExportIndex(-1);
      setExporting(false);
      setBusy(false);
      setTimeout(() => setExportProgress(0), 500);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: 72,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #ededf3',
          boxShadow: '0 -4px 18px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          zIndex: 40,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6c63ff, #a7a1ff)',
              boxShadow: '0 4px 12px rgba(108,99,255,0.25)',
            }}
          >
            <Package size={20} color="#fff" />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: '#333' }}>
              已生成 <span style={{ color: '#6c63ff', fontSize: 18 }}>{cards.length}</span> 张知识卡片
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#999' }}>
              {cards.length > 0
                ? isExporting
                  ? `正在导出... ${exportProgress}%`
                  : '点击右侧按钮导出 PNG 图片'
                : keyword
                  ? '请点击右侧面板的生成按钮创建卡片'
                  : '等待输入关键词开始创作'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isExporting && (
            <div style={{ width: 200, height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${exportProgress}%`,
                  background: 'linear-gradient(90deg, #6c63ff, #d4af37)',
                  transition: 'width 0.2s ease-out',
                }}
              />
            </div>
          )}
          <button
            type="button"
            className="btn-primary flex items-center gap-2 text-sm"
            style={{ height: 44, minWidth: 160, justifyContent: 'center' }}
            onClick={handleExport}
            disabled={cards.length === 0 || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} />
                导出中 {exportProgress}%
              </>
            ) : (
              <>
                <Download size={17} />
                一键导出 PNG
              </>
            )}
          </button>
        </div>
      </div>

      <div
        ref={hiddenRef}
        style={{
          position: 'fixed',
          left: -99999,
          top: 0,
          width: 1280,
          pointerEvents: 'none',
          opacity: 0,
        }}
        aria-hidden="true"
      >
        {cards.map((c, i) => (
          <div key={c.id} data-export-idx={i} style={{ marginBottom: 20 }}>
            <Card
              card={c}
              index={i}
              isExporting={false}
              isCurrentExport={false}
              exportIndex={-1}
              hideExtras
            />
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
