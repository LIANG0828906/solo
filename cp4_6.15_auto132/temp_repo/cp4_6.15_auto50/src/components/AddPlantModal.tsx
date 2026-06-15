import { useState, useRef, useCallback, useEffect } from 'react';
import { PlusCircle, Upload, RotateCw, Leaf, Crop, X, Check } from 'lucide-react';
import type { PlantLocation } from '@/utils/db';
import RippleButton from '@/components/RippleButton';

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    purchaseDate: string;
    location: PlantLocation;
    photos: string[];
  }) => void;
}

const locationOptions: PlantLocation[] = ['阳台', '客厅', '厨房', '卧室', '书房', '其他'];

function rotateImageDataUrl(dataUrl: string, degrees: number): Promise<string> {
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

function cropImageDataUrl(
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

function CropEditor({
  imageUrl,
  onConfirm,
  onCancel,
}: {
  imageUrl: string;
  onConfirm: (croppedUrl: string) => void;
  onCancel: () => void;
}) {
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

  const onMouseDown = (
    e: React.MouseEvent,
    mode: 'move' | 'resize'
  ) => {
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
  };

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

export default function AddPlantModal({ isOpen, onClose, onSubmit }: AddPlantModalProps) {
  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [location, setLocation] = useState<PlantLocation>('阳台');
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPurchaseDate('');
      setLocation('阳台');
      setThumbnails([]);
      setUploading(false);
      setUploadProgress(0);
      setCroppingIndex(null);
    }
  }, [isOpen]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 3 - thumbnails.length;
    const filesToProcess = Array.from(files).slice(0, remaining);
    if (filesToProcess.length === 0) {
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    let cancelled = false;
    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 85) return prev + Math.random() * 15;
        return prev;
      });
    }, 200);

    const readers: Promise<string>[] = filesToProcess.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((dataUrls) => {
      clearInterval(progressTimer);
      if (cancelled) return;
      setUploadProgress(100);
      setTimeout(() => {
        if (cancelled) return;
        setThumbnails((prev) => [...prev, ...dataUrls].slice(0, 3));
        setUploading(false);
        setUploadProgress(0);
      }, 400);
    });

    e.target.value = '';
    return () => {
      cancelled = true;
      clearInterval(progressTimer);
    };
  }, [thumbnails.length]);

  const handleRotate = useCallback(async (index: number) => {
    const rotated = await rotateImageDataUrl(thumbnails[index], 90);
    setThumbnails((prev) => {
      const next = [...prev];
      next[index] = rotated;
      return next;
    });
  }, [thumbnails]);

  const handleCrop = useCallback((index: number) => {
    setCroppingIndex(index);
  }, []);

  const handleCropConfirm = useCallback((croppedUrl: string) => {
    if (croppingIndex === null) return;
    setThumbnails((prev) => {
      const next = [...prev];
      next[croppingIndex] = croppedUrl;
      return next;
    });
    setCroppingIndex(null);
  }, [croppingIndex]);

  const handleRemoveThumb = useCallback((index: number) => {
    setThumbnails((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      purchaseDate,
      location,
      photos: thumbnails,
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !uploading) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-cream-50 rounded-3xl p-6 w-full max-w-md animate-scale-in shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-6 sticky top-0 bg-cream-50 -mt-6 -mx-6 px-6 py-4 z-10 border-b border-olive-100">
          <PlusCircle size={24} className="text-bark-500" />
          <h2 className="text-bark-500 font-display font-bold text-2xl">添加新植物</h2>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-6 text-center mb-4 transition-all cursor-pointer ${
            thumbnails.length >= 3
              ? 'border-olive-100 bg-olive-50/50 opacity-70 cursor-not-allowed'
              : 'border-olive-300 hover:border-olive-400 hover:bg-olive-50/40'
          }`}
          onClick={() => {
            if (thumbnails.length < 3) fileInputRef.current?.click();
          }}
        >
          <Upload size={32} className="mx-auto text-olive-400 mb-2" />
          <p className="text-olive-600 text-sm font-body">
            点击上传照片（{thumbnails.length}/3 张）
          </p>
          <p className="text-olive-400 text-xs mt-1">支持裁剪和旋转，建议上传不同角度</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {uploading && (
          <div className="mb-4">
            <div className="w-full bg-olive-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-olive-500 h-full rounded-full transition-all duration-200 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-olive-500 mt-1 font-body text-center">
              正在上传... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        {thumbnails.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {thumbnails.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm">
                <img src={url} alt="" className="w-full h-full object-cover progressive-img" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-olive-600 hover:bg-white transition shadow"
                    onClick={() => handleCrop(i)}
                    title="裁剪"
                  >
                    <Crop size={14} />
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-olive-600 hover:bg-white transition shadow"
                    onClick={() => handleRotate(i)}
                    title="旋转"
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center text-white hover:bg-red-500 transition shadow"
                    onClick={() => handleRemoveThumb(i)}
                    title="删除"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="relative">
            <Leaf size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-olive-400" />
            <input
              type="text"
              placeholder="植物名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-olive-200 rounded-xl pl-10 pr-4 py-3 bg-white focus:ring-2 focus:ring-olive-400 focus:border-olive-400 font-body outline-none transition-all"
            />
          </div>

          <div className="relative">
            <PlusCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-olive-400 pointer-events-none" />
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full border border-olive-200 rounded-xl pl-10 pr-4 py-3 bg-white focus:ring-2 focus:ring-olive-400 focus:border-olive-400 font-body outline-none transition-all text-bark-500"
            />
          </div>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value as PlantLocation)}
            className="w-full border border-olive-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-olive-400 focus:border-olive-400 font-body outline-none transition-all text-bark-500 appearance-none"
          >
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                摆放位置：{loc}
              </option>
            ))}
          </select>
        </div>

        <RippleButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          添加植物
        </RippleButton>
      </div>

      {croppingIndex !== null && thumbnails[croppingIndex] && (
        <CropEditor
          imageUrl={thumbnails[croppingIndex]}
          onConfirm={handleCropConfirm}
          onCancel={() => setCroppingIndex(null)}
        />
      )}
    </div>
  );
}
