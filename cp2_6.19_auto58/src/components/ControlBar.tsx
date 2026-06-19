import React, { useRef, useState } from 'react';
import { Upload, Sun, Moon, RotateCcw } from 'lucide-react';
import { useGalleryStore, LightingMode, TOTAL_SLOTS } from '../store/galleryStore';
import { processImage } from '../utils/imageProcessor';

const ControlBar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const lightingMode = useGalleryStore((state) => state.lightingMode);
  const setLightingMode = useGalleryStore((state) => state.setLightingMode);
  const addArtwork = useGalleryStore((state) => state.addArtwork);
  const artworks = useGalleryStore((state) => state.artworks);
  const findNextSlot = useGalleryStore((state) => state.findNextSlot);
  const resetCamera = useGalleryStore((state) => state.resetCamera);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (!findNextSlot()) break;
        const processed = await processImage(file);
        addArtwork(file, processed.textureUrl, processed.originalUrl);
      }
    } catch (error) {
      console.error('图片处理失败:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleLightingMode = () => {
    const newMode: LightingMode = lightingMode === 'day' ? 'night' : 'day';
    setLightingMode(newMode);
  };

  const usedSlots = artworks.length;
  const remainingSlots = TOTAL_SLOTS - usedSlots;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 px-6 py-3 flex items-center justify-between"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-sm">画</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-800">微缩画廊</h1>
        <span className="text-xs text-gray-400 ml-2">
          剩余 {remainingSlots} / {TOTAL_SLOTS} 画框
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleUploadClick}
          disabled={isUploading || remainingSlots === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
        >
          <Upload size={18} />
          <span>{isUploading ? '上传中...' : '上传图片'}</span>
        </button>

        <button
          onClick={toggleLightingMode}
          className="p-2.5 rounded-xl transition-all duration-300 hover:bg-gray-200 active:scale-95 text-gray-700"
          title={lightingMode === 'day' ? '切换到夜晚模式' : '切换到白天模式'}
        >
          {lightingMode === 'day' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button
          onClick={resetCamera}
          className="p-2.5 rounded-xl transition-all duration-300 hover:bg-gray-200 active:scale-95 text-gray-700"
          title="重置视角"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
