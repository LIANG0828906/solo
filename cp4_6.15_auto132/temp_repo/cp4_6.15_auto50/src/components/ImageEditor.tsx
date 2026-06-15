import { useState, useRef, useCallback, useEffect } from 'react';
import { Crop, RotateCw, X, Check } from 'lucide-react';
import RippleButton from '@/components/RippleButton';

export function rotateImageDataUrl(dataUrl: string, degrees: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const isVertical = degrees % 180 !== 0;
      canvas.width = isVertical ? img.height : img.width;
      canvas.height = isVertical ? img.width : img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

export function cropImageDataUrl(
  dataUrl: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

export function readFileWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };
    reader.onload = () => {
      onProgress(100);
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

interface CropEditorProps {
  imageUrl: string;
  onConfirm: (croppedUrl: string) => void;
  onCancel: () => void;
}

export default function CropEditor({ imageUrl, onConfirm, onCancel }: CropEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0, naturalW: 0, naturalH: 0 });
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [isDragging, setIsDragging] = useState<'move' | 'resize' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, areaX: 0, areaY: 0, w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const handleLoad = () => {
      setImgSize({
        w: img.clientWidth,
        h: img.clientHeight,
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
      });
      const size = Math.min(img.clientWidth, img.clientHeight) * 0.7;
      setCropArea({
        x: (img.clientWidth - size) / 2,
        y: (img.clientHeight - size) / 2,
        w: size,
        h: size,
      });
    };
    if (img.complete) handleLoad();
    else img.addEventListener('load', handleLoad);
    return () => img.removeEventListener('load', handleLoad);
  }, [imageUrl]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent, mode: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(mode);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        areaX: cropArea.x,
        areaY: cropArea.y,
        w: cropArea.w,
        h: cropArea.h,
      });
    },
    [cropArea]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (isDragging === 'move') {
        setCropArea((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(imgSize.w - prev.w, dragStart.areaX + dx)),
          y: Math.max(0, Math.min(imgSize.h - prev.h, dragStart.areaY + dy)),
        }));
      } else {
        const newW = Math.max(40, Math.min(imgSize.w - dragStart.areaX, dragStart.w + dx));
        const newH = Math.max(40, Math.min(imgSize.h - dragStart.areaY, dragStart.h + dy));
        setCropArea((prev) => ({ ...prev, w: newW, h: newH }));
      }
    };
    const handleUp = () => setIsDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, dragStart, imgSize.w, imgSize.h]);

  const handleConfirm = async () => {
    if (!imgRef.current || imgSize.naturalW === 0) return;
    const scale = imgSize.naturalW / imgSize.w;
    const cropped = await cropImageDataUrl(imageUrl, {
      x: cropArea.x * scale,
      y: cropArea.y * scale,
      width: cropArea.w * scale,
      height: cropArea.h * scale,
    });
    onConfirm(cropped);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-cream-50 rounded-2xl p-5 max-w-lg w-full animate-scale-in shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-bark-500 flex items-center gap-2">
            <Crop size={18} />
            裁剪照片
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-olive-50 flex items-center justify-center text-olive-600 hover:bg-olive-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative w-full rounded-xl overflow-hidden bg-black/5 select-none"
          style={{ maxHeight: '60vh' }}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt=""
            draggable={false}
            className="block w-auto max-w-full h-auto max-h-[60vh] mx-auto user-select-none progressive-img"
          />

          <div
            className="absolute border-2 border-white/90 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] cursor-move"
            style={{
              left: `${cropArea.x}px`,
              top: `${cropArea.y}px`,
              width: `${cropArea.w}px`,
              height: `${cropArea.h}px`,
            }}
            onMouseDown={(e) => onMouseDown(e, 'move')}
          >
            <div
              className="absolute -right-2 -bottom-2 w-5 h-5 bg-white rounded-full border-2 border-olive-500 cursor-se-resize shadow"
              onMouseDown={(e) => onMouseDown(e, 'resize')}
            />
            <div className="absolute inset-0 pointer-events-none border border-dashed border-white/60" />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <RippleButton variant="secondary" className="flex-1" onClick={onCancel}>
            取消
          </RippleButton>
          <RippleButton variant="primary" className="flex-1" onClick={handleConfirm}>
            <span className="flex items-center justify-center gap-1.5">
              <Check size={16} />
              确认裁剪
            </span>
          </RippleButton>
        </div>
      </div>
    </div>
  );
}
