import { useState, useEffect, useRef, useCallback } from 'react';
import { getBlob, blobToObjectUrl } from '@/utils/fileHelpers';
import type { Sketch } from '@/types';

interface VersionSliderProps {
  sketch: Sketch;
  previousVersionKey: string | null;
}

export default function VersionSlider({ sketch, previousVersionKey }: VersionSliderProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [previousUrl, setPreviousUrl] = useState('');
  const [opacity, setOpacity] = useState(100);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let url1 = '';
    let url2 = '';
    getBlob(sketch.watermarkedBlobKey).then((blob) => {
      if (blob) {
        url1 = blobToObjectUrl(blob);
        setCurrentUrl(url1);
      }
    });
    if (previousVersionKey) {
      getBlob(previousVersionKey).then((blob) => {
        if (blob) {
          url2 = blobToObjectUrl(blob);
          setPreviousUrl(url2);
        }
      });
    } else {
      setPreviousUrl('');
    }
    return () => {
      if (url1) URL.revokeObjectURL(url1);
      if (url2) URL.revokeObjectURL(url2);
    };
  }, [sketch.watermarkedBlobKey, previousVersionKey]);

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setOpacity(pct);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setOpacity(pct);
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  if (!previousUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-[#BDC3C7]">
        <p className="text-[#95A5A6] text-sm">暂无历史版本可对比</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 bg-white rounded-lg border border-[#BDC3C7] overflow-hidden">
        <div className="flex-1 relative">
          <div className="p-2 text-xs text-center text-[#95A5A6] bg-[#ECF0F1]">
            旧版本
          </div>
          <div className="aspect-[4/3] bg-[#ECF0F1] overflow-hidden">
            {previousUrl && (
              <img
                src={previousUrl}
                alt="旧版本"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="p-2 text-xs text-center text-[#95A5A6] bg-[#ECF0F1]">
            新版本
          </div>
          <div className="aspect-[4/3] bg-[#ECF0F1] overflow-hidden relative">
            <img
              src={previousUrl}
              alt="旧版本底层"
              className="w-full h-full object-contain absolute inset-0"
            />
            <img
              src={currentUrl}
              alt="新版本覆盖"
              className="w-full h-full object-contain relative"
              style={{ opacity: opacity / 100 }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4">
        <span className="text-xs text-[#95A5A6] w-8">透明</span>
        <div
          ref={trackRef}
          className="flex-1 h-2 rounded-full relative cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #BDC3C7, #95A5A6)',
          }}
          onClick={handleTrackClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#3498DB] shadow-md cursor-grab active:cursor-grabbing"
            style={{
              left: `calc(${opacity}% - 10px)`,
              touchAction: 'none',
            }}
          />
        </div>
        <span className="text-xs text-[#95A5A6] w-8">不透明</span>
        <span className="text-xs text-[#2C3E50] font-mono w-12 text-right">
          {Math.round(opacity)}%
        </span>
      </div>
    </div>
  );
}
