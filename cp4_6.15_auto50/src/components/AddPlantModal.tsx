import { useState, useRef, useCallback } from 'react';
import { PlusCircle, Upload, RotateCw, Leaf } from 'lucide-react';
import type { PlantLocation } from '@/utils/db';
import RippleButton from '@/components/RippleButton';

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; purchaseDate: string; location: PlantLocation; photos: string[] }) => void;
}

const locationOptions: PlantLocation[] = ['阳台', '客厅', '厨房', '卧室', '书房', '其他'];

export default function AddPlantModal({ isOpen, onClose, onSubmit }: AddPlantModalProps) {
  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [location, setLocation] = useState<PlantLocation>('阳台');
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 3 - thumbnails.length;
    const filesToProcess = Array.from(files).slice(0, remaining);
    if (filesToProcess.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const readers: Promise<string>[] = filesToProcess.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((dataUrls) => {
      setTimeout(() => {
        setUploadProgress(50);
      }, 300);

      setTimeout(() => {
        setUploadProgress(100);
        setUploading(false);
        setThumbnails((prev) => [...prev, ...dataUrls].slice(0, 3));
        setUploadProgress(0);
      }, 1500);
    });

    e.target.value = '';
  }, [thumbnails.length]);

  const handleRotate = useCallback((index: number) => {
    const img = new Image();
    img.src = thumbnails[index];
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const newDataUrl = canvas.toDataURL('image/png');
      setThumbnails((prev) => {
        const next = [...prev];
        next[index] = newDataUrl;
        return next;
      });
    };
  }, [thumbnails]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), purchaseDate, location, photos: thumbnails });
    setName('');
    setPurchaseDate('');
    setLocation('阳台');
    setThumbnails([]);
    setUploading(false);
    setUploadProgress(0);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-cream-50 rounded-3xl p-6 w-full max-w-md animate-scale-in shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle size={24} className="text-bark-500" />
          <h2 className="text-bark-500 font-display font-bold text-2xl">添加新植物</h2>
        </div>

        <div
          className="border-2 border-dashed border-olive-300 rounded-2xl p-6 text-center mb-4 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={32} className="mx-auto text-olive-400 mb-2" />
          <p className="text-olive-600 text-sm">点击上传照片（1-3张）</p>
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
          <div className="w-full bg-olive-100 rounded-full h-1 mb-4 overflow-hidden">
            <div
              className="bg-olive-500 h-1 rounded-full animate-progress"
            />
          </div>
        )}

        {thumbnails.length > 0 && (
          <div className="flex gap-2 mb-4">
            {thumbnails.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                <button
                  className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow"
                  onClick={() => handleRotate(i)}
                >
                  <RotateCw size={12} className="text-olive-600" />
                </button>
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
              className="w-full border border-olive-200 rounded-xl pl-10 pr-4 py-3 bg-white focus:ring-2 focus:ring-olive-400 focus:border-olive-400 font-body"
            />
          </div>

          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full border border-olive-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-olive-400 focus:border-olive-400 font-body"
          />

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value as PlantLocation)}
            className="w-full border border-olive-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-olive-400 focus:border-olive-400 font-body"
          >
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <RippleButton variant="primary" size="lg" className="w-full" onClick={handleSubmit}>
          添加植物
        </RippleButton>
      </div>
    </div>
  );
}
