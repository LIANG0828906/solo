import { useRef, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
}

export default function ImageUploader({ images, onChange, maxFiles = 6 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const validateAndProcess = (files: FileList | File[]) => {
    setError('');
    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - images.length;
    if (remainingSlots <= 0) return;

    const validFiles: File[] = [];

    for (const file of fileArray) {
      if (validFiles.length >= remainingSlots) break;
      if (!file.type.startsWith('image/')) {
        setError('仅支持上传图片文件');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`单张图片大小不能超过 2MB，已跳过过大的文件`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    let loaded = 0;
    const total = validFiles.length;
    const results: (string | null)[] = new Array(total).fill(null);

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        results[index] = e.target?.result as string;
        loaded++;
        if (loaded === total) {
          const newImages = [...images, ...results.filter((r): r is string => r !== null)];
          onChange(newImages.slice(0, maxFiles));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      validateAndProcess(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      validateAndProcess(e.dataTransfer.files);
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">图片上传</label>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
          >
            <img src={img} alt={`预览 ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {images.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
              isDragging
                ? 'border-[#8B5A2B] bg-[#8B5A2B]/5'
                : 'border-gray-300 hover:border-[#8B5A2B] hover:bg-gray-50'
            )}
          >
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500">点击或拖拽上传</span>
            <span className="text-xs text-gray-400">{images.length}/{maxFiles}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        支持 JPG/PNG 格式，单张不超过 2MB，最多 {maxFiles} 张
      </p>
    </div>
  );
}
