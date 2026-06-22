import { useEffect, useState } from 'react';
import { X, Search, Loader2, Check } from 'lucide-react';
import { fetchImages } from '@/api/materials';
import type { ImageItem } from '@/types';

interface Props {
  keyword: string;
  currentUrl: string;
  onPick: (url: string) => void;
  onClose: () => void;
}

export default function ImagePickerDrawer({ keyword, currentUrl, onPick, onClose }: Props) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(keyword);

  useEffect(() => {
    loadImages(q);
  }, []);

  const loadImages = async (kw: string) => {
    setLoading(true);
    try {
      const res = await fetchImages(kw, 24);
      const urls = new Set<string>();
      const dedup: ImageItem[] = [];
      res.items.forEach((it) => {
        if (!urls.has(it.url)) {
          urls.add(it.url);
          dedup.push(it);
        }
      });
      const extras = buildFallbackImages(kw);
      extras.forEach((url) => {
        if (!urls.has(url)) {
          dedup.push({ id: 'fb_' + url.slice(-10), url, tags: [kw] });
          urls.add(url);
        }
      });
      setImages(dedup);
    } catch {
      setImages(buildFallbackImages(kw).map((url, i) => ({ id: 'fb_' + i, url, tags: [kw] })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end fade-in" style={{ pointerEvents: 'none' }}>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(10,10,30,0.55)', pointerEvents: 'auto' }}
        onClick={onClose}
      />
      <div
        className="relative w-full flex flex-col"
        style={{
          height: '68%',
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: '0 -16px 48px rgba(0,0,0,0.2)',
          pointerEvents: 'auto',
          animation: 'slideUp 0.25s ease-out',
        }}
      >
        <div className="flex flex-col items-center pt-3 px-5 pb-4 border-b" style={{ borderColor: '#f0f0f5' }}>
          <div
            className="mb-3"
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#ddd',
            }}
          />
          <div className="w-full flex items-center justify-between mb-3">
            <h4 className="text-base font-bold" style={{ color: '#222' }}>选择配图</h4>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: '#f5f5fa', color: '#666' }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 relative">
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}
              />
              <input
                className="input-base"
                style={{ paddingLeft: 36 }}
                placeholder="输入关键词搜索更多图片..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadImages(q)}
              />
            </div>
            <button type="button" className="btn-primary" style={{ padding: '10px 18px' }} onClick={() => loadImages(q)}>
              搜索
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2">
              <Loader2 size={20} style={{ color: '#6c63ff', animation: 'spin 1s linear infinite' }} />
              <span style={{ color: '#888' }}>正在加载素材...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img) => {
                const active = img.url === currentUrl;
                return (
                  <div
                    key={img.id}
                    className="relative rounded-xl overflow-hidden cursor-pointer group transition-all"
                    style={{
                      aspectRatio: '4 / 3',
                      border: active ? '3px solid #6c63ff' : '3px solid transparent',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    onClick={() => onPick(img.url)}
                  >
                    <img
                      src={img.url}
                      crossOrigin="anonymous"
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-opacity"
                      style={{
                        backgroundColor: active ? 'rgba(108,99,255,0.3)' : 'rgba(0,0,0,0)',
                        opacity: active ? 1 : 0,
                      }}
                    >
                      {active && (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#6c63ff', color: '#fff' }}
                        >
                          <Check size={18} />
                        </div>
                      )}
                    </div>
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-100"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        opacity: 0,
                      }}
                    >
                      <span className="text-white text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(108,99,255,0.9)' }}>
                        使用此图
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0.5; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

function buildFallbackImages(kw: string): string[] {
  const seeds = [kw, 'knowledge', 'education', 'learning', 'study', 'book', 'idea', 'brain'];
  const pool: string[] = [];
  const ids = [
    '1526374965328-7f61d4dc18c5', '1555066931-4365d14bab8c', '1504639725590-34d0984388bd',
    '1513475382585-d06e58bcb0e0', '1507842217343-583bb7270b66', '1457369804613-52c61a468e7d',
    '1501594907352-04cda38ebc29', '1456513080510-7bf3a84b82f8', '1503676260728-1c00da094a0b',
    '1635070041078-e363dbe005cb', '1509228468518-180dd4864904', '1518133835878-5a9330e25215',
    '1677442136019-21780ecad995', '1655720828018-edd2daec9349', '1485827404703-89b55fcc595e',
    '1558655146-9f40138edfeb', '1545235617-9465d2a55698', '1634942537034-2531766767d1',
    '1481627834876-b7833e8f5570', '1519389950473-47ba0277781c', '1505373878068-247266734a6a',
  ];
  for (let i = 0; i < ids.length; i++) {
    const seed = seeds[i % seeds.length];
    pool.push(`https://images.unsplash.com/photo-${ids[i]}?w=800&sig=${seed.length + i}`);
  }
  return pool;
}
