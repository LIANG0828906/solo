import { useRef } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({
  photos,
  onChange,
  maxPhotos = 3,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let { width, height } = img;
          if (width > height && width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(reader.result as string);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const slots = maxPhotos - photos.length;
    const toProcess = Array.from(files).slice(0, slots);
    try {
      const compressed = await Promise.all(toProcess.map(compressImage));
      onChange([...photos, ...compressed]);
    } catch {
      /* noop */
    }
  };

  const removePhoto = (idx: number) => {
    onChange(photos.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="tea-label mb-1">干茶照片（最多 {maxPhotos} 张）</div>
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div
            key={i}
            className="relative w-24 h-24 rounded-lg overflow-hidden group"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <img src={p} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:bg-white"
            style={{
              border: '2px dashed var(--color-border)',
              color: 'var(--color-text-light)',
            }}
          >
            <Plus className="w-6 h-6" />
            <ImageIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
