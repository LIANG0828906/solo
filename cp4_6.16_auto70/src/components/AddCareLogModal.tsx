import { useState, useEffect, useRef } from 'react';
import { X, Droplets, Leaf, Scissors, Sun, ImageIcon } from 'lucide-react';
import type { CareLog, CareType } from '@/types';
import { compressImage } from '@/utils/image';
import { formatDate } from '@/utils/date';

interface AddCareLogModalProps {
  open: boolean;
  onClose: () => void;
  plantId: string;
  plantName: string;
  onSubmit: (data: Omit<CareLog, 'id' | 'createdAt' | 'plantId'>) => Promise<void>;
}

const careTypes: { type: CareType; label: string; icon: typeof Droplets; color: string }[] = [
  { type: 'water', label: '浇水', icon: Droplets, color: 'bg-water' },
  { type: 'fertilize', label: '施肥', icon: Leaf, color: 'bg-fertilize' },
  { type: 'prune', label: '修剪', icon: Scissors, color: 'bg-prune' },
  { type: 'sunlight', label: '日照调整', icon: Sun, color: 'bg-sunlight' },
];

export default function AddCareLogModal({
  open,
  onClose,
  plantId,
  plantName,
  onSubmit,
}: AddCareLogModalProps) {
  const [type, setType] = useState<CareType>('water');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(formatDate(new Date()));
  const [image, setImage] = useState<string | undefined>(undefined);
  const [height, setHeight] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setType('water');
      setNote('');
      setDate(formatDate(new Date()));
      setImage(undefined);
      setHeight('');
    }
  }, [open, plantId]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file);
        setImage(base64);
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        note: note.trim() || undefined,
        date,
        image,
        height: height ? parseFloat(height) : undefined,
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
          <div>
            <h2 className="text-lg font-serif font-semibold">记录养护事件</h2>
            <p className="text-xs text-app-text-light mt-0.5">{plantName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-app-bg transition-colors text-app-text-light"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-app-text mb-2">操作类型</label>
            <div className="grid grid-cols-4 gap-2">
              {careTypes.map((item) => {
                const Icon = item.icon;
                const active = type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setType(item.type)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      active
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-transparent bg-app-bg hover:bg-app-bg/80'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full ${item.color} flex items-center justify-center ${
                        active ? 'ring-2 ring-offset-2 ring-primary/30' : ''
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-app-text-light'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-text mb-1.5">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-app-bg/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-text mb-1.5">
                植物高度（cm）
              </label>
              <input
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="可选"
                className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-app-bg/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text mb-1.5">备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="描述一下今天的养护情况，或者植物的状态变化..."
              className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-app-bg/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text mb-1.5">照片</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video w-full rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-app-bg cursor-pointer flex items-center justify-center transition-all overflow-hidden group"
            >
              {image ? (
                <>
                  <img src={image} alt="记录照片" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">更换照片</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-app-text-light">
                  <ImageIcon className="w-8 h-8 text-primary/50" />
                  <span className="text-sm">点击上传照片（可选）</span>
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
              disabled={submitting}
              className="flex-1 px-5 py-3 rounded-xl bg-primary text-white font-medium shadow-md hover:shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '保存中...' : '保存记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
