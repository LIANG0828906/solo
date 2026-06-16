import { useState, useEffect, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import type { Plant } from '@/types';
import { compressImage } from '@/utils/image';
import { formatDate } from '@/utils/date';

interface AddPlantModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editData?: Plant | null;
}

export default function AddPlantModal({ open, onClose, onSubmit, editData }: AddPlantModalProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(formatDate(new Date()));
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editData) {
        setName(editData.name);
        setSpecies(editData.species);
        setPurchaseDate(editData.purchaseDate);
        setPhoto(editData.photo);
      } else {
        setName('');
        setSpecies('');
        setPurchaseDate(formatDate(new Date()));
        setPhoto(undefined);
      }
    }
  }, [open, editData]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file);
        setPhoto(base64);
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !species.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        species: species.trim(),
        purchaseDate,
        photo,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-expand overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10">
          <h2 className="text-lg font-serif font-semibold">
            {editData ? '编辑植物档案' : '添加新植物'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-app-bg transition-colors text-app-text-light"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-video w-full rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-app-bg cursor-pointer flex items-center justify-center transition-all overflow-hidden group"
          >
            {photo ? (
              <>
                <img src={photo} alt="植物照片" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium">更换照片</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-app-text-light">
                <Camera className="w-10 h-10 text-primary/50" />
                <span className="text-sm">点击上传植物照片（可选）</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text mb-1.5">
              植物名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：绿萝、多肉"
              className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-app-bg/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text mb-1.5">
              品种 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="例如：天南星科、景天科"
              className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-app-bg/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text mb-1.5">购入日期</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-app-bg/50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 rounded-xl border border-primary/20 text-app-text font-medium hover:bg-app-bg transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !species.trim()}
              className="flex-1 px-5 py-3 rounded-xl bg-primary text-white font-medium shadow-md hover:shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '保存中...' : editData ? '保存修改' : '添加植物'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
