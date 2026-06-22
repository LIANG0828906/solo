import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
}

export default function UploadArea({ onFileSelect }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const imagePreview = useAppStore((s) => s.imagePreview);
  const setImagePreview = useAppStore((s) => s.setImagePreview);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setImagePreview(url);
    };
    reader.readAsDataURL(file);
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden',
        isDragging
          ? 'border-[var(--brand-color)] bg-[var(--brand-color)]/5'
          : 'border-[var(--border-color)] hover:border-[var(--brand-color)]/60 bg-[var(--bg-card)]'
      )}
      style={{ minHeight: imagePreview ? '220px' : '180px' }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {imagePreview ? (
        <div className="relative w-full h-full">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-contain p-2"
            style={{ maxHeight: '280px' }}
          />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-[var(--brand-color)]/10 text-[var(--brand-color)]">
            {isDragging ? <ImageIcon size={28} /> : <Upload size={28} />}
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {isDragging ? '松开以上传图片' : '点击或拖拽图片到此处'}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            支持 JPG、PNG、WebP 等格式
          </p>
        </div>
      )}
    </div>
  );
}
