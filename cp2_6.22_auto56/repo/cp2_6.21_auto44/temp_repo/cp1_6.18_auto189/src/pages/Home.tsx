import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import UploadZone from '@/components/UploadZone';
import FurniturePanel from '@/components/FurniturePanel';
import Scene3D from '@/components/Scene3D';
import Toolbar from '@/components/Toolbar';
import { Upload, RotateCcw } from 'lucide-react';

export default function Home() {
  const imageUrl = useStore((s) => s.imageUrl);
  const imageWidth = useStore((s) => s.imageWidth);
  const imageHeight = useStore((s) => s.imageHeight);
  const clearAll = useStore((s) => s.clearAll);
  const selectFurniture = useStore((s) => s.selectFurniture);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const photoRef = useRef<HTMLDivElement>(null);

  const handleBgClick = () => {
    selectFurniture(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#1A1A2E' }}>
      {!imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <UploadZone />
        </div>
      )}

      {imageUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={handleBgClick}
        >
          <div
            ref={photoRef}
            className="relative glow-border rounded-lg overflow-hidden animate-fade-in"
            style={{
              maxWidth: '800px',
              maxHeight: 'calc(100vh - 140px)',
              width: 'auto',
              height: 'auto',
            }}
          >
            <img
              src={imageUrl}
              alt="房间照片"
              className="block max-w-full max-h-[calc(100vh-140px)] object-contain"
              style={{ maxWidth: '800px' }}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
            <div className="absolute inset-0">
              <Scene3D />
            </div>
          </div>

          <button
            className="btn-press absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white text-sm transition-colors"
            style={{ background: 'rgba(26,26,46,0.8)', zIndex: 20 }}
            onClick={clearAll}
          >
            <RotateCcw size={16} />
            <span>重新上传</span>
          </button>
        </div>
      )}

      {imageUrl && <FurniturePanel />}
      {imageUrl && <Toolbar />}
    </div>
  );
}
