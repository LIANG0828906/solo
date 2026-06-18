import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Palette, ArrowRight, X } from 'lucide-react';
import { useClothingStore } from '../store/useClothingStore';
import {
  SWATCH_COLORS,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileInput,
  handleSwatchClick,
} from '../modules/userInteraction';

const CloudUploadIcon = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-wood/60"
  >
    <path d="M17.5 19a4.5 4.5 0 1 0-1.3-8.8 6 6 0 0 0-11.6 1.6A4 4 0 0 0 6 19h11.5z" />
    <path d="M12 13v6" />
    <path d="m9 16 3-3 3 3" />
  </svg>
);

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { clothing, isDragging, setIsDragging } = useClothingStore();
  const [uploading, setUploading] = useState(false);
  const [activeSwatch, setActiveSwatch] = useState<string | null>(null);

  const onDragOver = useCallback(handleDragOver, []);
  const onDragLeave = useCallback(handleDragLeave, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    setUploading(true);
    await handleDrop(e);
    setUploading(false);
  }, []);

  const onFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    await handleFileInput(e);
    setUploading(false);
  }, []);

  const onSwatchClick = useCallback(async (color: string) => {
    setActiveSwatch(color);
    await handleSwatchClick(color);
  }, []);

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    useClothingStore.getState().resetClothing();
    setActiveSwatch(null);
  };

  const goToTryOn = () => {
    navigate('/tryon');
  };

  return (
    <div className="min-h-screen bg-paper py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-serif text-wood mb-3">
            光阴缝纫铺
          </h1>
          <p className="text-wood/70 text-lg">上传旧衣物，开启你的改造之旅</p>
        </div>

        <div className="flex responsive-row gap-8 items-start justify-center">
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div
              className={`upload-zone rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all btn-hover ${
                isDragging ? 'dragover' : ''
              } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
              style={{ width: '300px', height: '400px' }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={handleZoneClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileInput}
              />
              {uploading ? (
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-wood/30 border-t-wood rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-wood/60">上传中...</p>
                </div>
              ) : (
                <div className="text-center px-6">
                  <CloudUploadIcon />
                  <p className="mt-6 text-wood font-medium text-lg">
                    拖拽或点击上传衣物照片
                  </p>
                  <p className="mt-2 text-wood/50 text-sm">
                    支持 JPG、PNG、GIF 格式
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-wood/60 text-sm">
              <Upload size={16} />
              <span>建议上传清晰的正面衣物照片</span>
            </div>
          </div>

          <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {clothing.imageUrl ? (
              <div className="relative">
                <button
                  onClick={clearImage}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-wood text-white rounded-full flex items-center justify-center z-10 btn-hover hover:bg-rust"
                >
                  <X size={16} />
                </button>
                <div className="bg-white rounded-2xl p-4 card-shadow">
                  <img
                    src={clothing.imageUrl}
                    alt="上传的衣物"
                    className="rounded-lg object-contain"
                    style={{ maxWidth: '400px', maxHeight: '400px' }}
                  />
                </div>
              </div>
            ) : (
              <div
                className="bg-white/50 rounded-2xl border-2 border-dashed border-wood/20 flex items-center justify-center card-shadow"
                style={{ width: '400px', height: '400px', maxWidth: '90vw' }}
              >
                <p className="text-wood/40 text-center px-8">
                  上传照片后，这里将显示衣物预览
                </p>
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette size={18} className="text-wood/70" />
                <span className="text-wood font-medium">选择主色调</span>
              </div>
              <div className="flex gap-3">
                {SWATCH_COLORS.map((color, index) => (
                  <button
                    key={color}
                    onClick={() => onSwatchClick(color)}
                    className={`swatch-btn ${activeSwatch === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    title={`色板 ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {clothing.imageUrl && (
              <button
                onClick={goToTryOn}
                className="mt-8 px-8 py-3 bg-rust text-white rounded-full font-medium flex items-center gap-2 btn-hover"
              >
                进入试衣间
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-serif text-wood mb-6">改造小贴士</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/60 rounded-xl p-6 card-shadow">
              <div className="text-3xl mb-3">📸</div>
              <h3 className="font-serif text-lg text-wood mb-2">光线充足</h3>
              <p className="text-wood/60 text-sm">
                在自然光下拍摄，确保衣物颜色和细节清晰可见
              </p>
            </div>
            <div className="bg-white/60 rounded-xl p-6 card-shadow">
              <div className="text-3xl mb-3">📐</div>
              <h3 className="font-serif text-lg text-wood mb-2">平整摆放</h3>
              <p className="text-wood/60 text-sm">
                将衣物平铺整理，避免褶皱影响虚拟试穿效果
              </p>
            </div>
            <div className="bg-white/60 rounded-xl p-6 card-shadow">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-serif text-lg text-wood mb-2">大胆尝试</h3>
              <p className="text-wood/60 text-sm">
                不同的颜色和版型组合，或许会有意想不到的惊喜
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
