import { useState, useRef } from 'react';
import { ImageIcon, X, Grip } from 'lucide-react';
import '../index.css';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200';

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const hasImage = value && value !== '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">商品图片</label>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-2 border-dashed border-orange-500 bg-orange-50'
            : 'border-2 border-dashed border-gray-300 hover:border-orange-400 bg-gray-50'
        }`}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '8px',
        }}
      >
        {hasImage ? (
          <div className="relative w-full h-full">
            <img
              src={value}
              alt="预览"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-1 right-1">
              <Grip className="w-4 h-4 text-white/80" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <ImageIcon className="w-8 h-8" />
            <div className="text-xs text-center px-2">
              <span className="text-orange-500 font-medium">点击上传</span>
              <span className="block">或拖拽图片</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {!hasImage && (
        <p className="text-xs text-gray-400">支持 JPG、PNG 格式，不上传将显示默认占位图</p>
      )}
    </div>
  );
}

export { PLACEHOLDER_IMAGE };
