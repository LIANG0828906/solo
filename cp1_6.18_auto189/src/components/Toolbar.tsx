import { useStore } from '@/store/useStore';
import { Save, Share2, Trash2, Copy, Check } from 'lucide-react';
import { saveScene } from '@/engines/placeEngine';
import { useState } from 'react';

export default function Toolbar() {
  const imageId = useStore((s) => s.imageId);
  const imageUrl = useStore((s) => s.imageUrl);
  const placedFurniture = useStore((s) => s.placedFurniture);
  const selectedId = useStore((s) => s.selectedId);
  const shareUrl = useStore((s) => s.shareUrl);
  const shareModalOpen = useStore((s) => s.shareModalOpen);
  const removeFurniture = useStore((s) => s.removeFurniture);
  const setShareUrl = useStore((s) => s.setShareUrl);
  const setShareModalOpen = useStore((s) => s.setShareModalOpen);

  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!imageId || !imageUrl) return;
    try {
      const furniture = placedFurniture.map((f) => ({
        modelId: f.modelId,
        x: f.x,
        y: f.y,
        scale: f.scale,
      }));
      const result = await saveScene(imageId, imageUrl, furniture);
      setShareUrl(result.shareUrl);
      setShareModalOpen(true);
    } catch {
      console.error('保存失败');
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      removeFurniture(selectedId);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('复制失败');
    }
  };

  return (
    <>
      <div
        className="fixed bottom-0 left-0 w-full h-[60px] flex items-center justify-center gap-4"
        style={{ borderRadius: '12px 12px 0 0', background: 'rgba(30,30,60,0.8)' }}
      >
        <button
          className="toolbar-btn btn-press flex items-center gap-2 px-5 py-2.5 rounded-lg text-white"
          style={{ backgroundColor: '#6C5CE7' }}
          onClick={handleSave}
        >
          <Save size={18} />
          <span>保存</span>
        </button>

        {selectedId && (
          <button
            className="toolbar-btn btn-press flex items-center gap-2 px-5 py-2.5 rounded-lg text-white bg-red-500"
            onClick={handleDelete}
          >
            <Trash2 size={18} />
            <span>删除</span>
          </button>
        )}

        {shareUrl && (
          <button
            className="toolbar-btn btn-press flex items-center gap-2 px-5 py-2.5 rounded-lg text-white"
            style={{ backgroundColor: '#6C5CE7' }}
            onClick={() => setShareModalOpen(true)}
          >
            <Share2 size={18} />
            <span>分享</span>
          </button>
        )}
      </div>

      {shareModalOpen && shareUrl && (
        <div
          className="share-modal-overlay fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div className="share-modal-content rounded-xl p-6 w-96" style={{ background: 'var(--card-bg)' }}>
            <h3 className="text-lg font-semibold mb-4 text-white">分享链接</h3>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={window.location.origin + shareUrl}
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-black/30 text-white border border-white/10 outline-none"
              />
              <button
                className="btn-press flex items-center gap-1 px-3 py-2 rounded-lg text-white text-sm"
                style={{ backgroundColor: '#6C5CE7' }}
                onClick={handleCopy}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? '已复制' : '复制'}</span>
              </button>
            </div>
            <button
              className="btn-press w-full py-2 rounded-lg text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => setShareModalOpen(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
