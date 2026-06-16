import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxCount?: number;
}

export default function ImageUploader({ value, onChange, maxCount = 6 }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const remaining = maxCount - value.length;
      const toProcess = fileArr.slice(0, remaining);

      Promise.all(
        toProcess.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      ).then((base64s) => {
        onChange([...value, ...base64s]);
      });
    },
    [value, onChange, maxCount]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        readFiles(e.dataTransfer.files);
      }
    },
    [readFiles]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        readFiles(e.target.files);
      }
    },
    [readFiles]
  );

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {value.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
            <img src={src} alt="" className="w-full h-full object-cover img-loaded" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {value.length < maxCount && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`aspect-square rounded-lg border-2 border-dashed border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-primary/5 hover:bg-primary/10 ${isDragging ? 'drag-active' : ''}`}
          >
            <ImageIcon size={28} className="text-primary/60 mb-1" />
            <Upload size={18} className="text-primary/60" />
            <span className="text-xs text-primary/70 mt-1 text-center px-1">
              {isDragging ? '松开上传' : '点击/拖拽'}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-secondary/50">
        已上传 {value.length}/{maxCount} 张，支持点击选取或拖拽上传
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
