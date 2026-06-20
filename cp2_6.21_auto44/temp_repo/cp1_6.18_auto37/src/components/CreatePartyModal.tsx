import { useState } from 'react';
import { X } from 'lucide-react';
import { usePartyStore } from '@/stores/partyStore';
import type { Category } from '@/types';

interface MaterialRow {
  name: string;
  requiredQuantity: number;
  emoji: string;
}

const CATEGORIES: Category[] = ['编织', '陶艺', '绘画', '木工'];

interface CreatePartyModalProps {
  open: boolean;
  onClose: () => void;
}

const inputCls =
  'w-full bg-purple-card border border-purple-border text-white rounded-lg px-3 py-2 font-body focus:outline-none focus:ring-1 focus:ring-amber-primary transition-colors';

export default function CreatePartyModal({ open, onClose }: CreatePartyModalProps) {
  const createUserActivity = usePartyStore((s) => s.createUserActivity);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category>('编织');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState<MaterialRow[]>([
    { name: '', requiredQuantity: 1, emoji: '📦' },
  ]);

  if (!open) return null;

  const addMaterialRow = () =>
    setMaterials((prev) => [...prev, { name: '', requiredQuantity: 1, emoji: '📦' }]);

  const removeMaterialRow = (idx: number) =>
    setMaterials((prev) => prev.filter((_, i) => i !== idx));

  const updateMaterialRow = (idx: number, field: keyof MaterialRow, value: string | number) =>
    setMaterials((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createUserActivity({
      name,
      date,
      location,
      category,
      maxParticipants,
      materials: materials
        .filter((m) => m.name.trim())
        .map((m) => ({ name: m.name, emoji: m.emoji, requiredQuantity: m.requiredQuantity })),
      description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="w-[480px] max-w-[90vw] bg-purple-deep rounded-[20px] p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl text-white">创建新活动</h2>
          <button
            className="text-purple-border hover:text-white transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-purple-border mb-1">活动名称</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-purple-border mb-1">日期</label>
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-purple-border mb-1">地点</label>
              <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-purple-border mb-1">分类</label>
              <select
                className={inputCls}
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-purple-border mb-1">最大人数</label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-purple-border mb-1">材料需求</label>
            <div className="space-y-2">
              {materials.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={`${inputCls} flex-1`}
                    placeholder="材料名称"
                    value={m.name}
                    onChange={(e) => updateMaterialRow(i, 'name', e.target.value)}
                  />
                  <input
                    className={`${inputCls} w-20`}
                    type="number"
                    min={1}
                    value={m.requiredQuantity}
                    onChange={(e) => updateMaterialRow(i, 'requiredQuantity', Number(e.target.value))}
                  />
                  <button
                    className="text-purple-border hover:text-red-400 transition-colors shrink-0"
                    onClick={() => removeMaterialRow(i)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="mt-2 text-sm text-amber-primary hover:text-amber-dark transition-colors"
              onClick={addMaterialRow}
            >
              + 添加材料
            </button>
          </div>

          <div>
            <label className="block text-sm text-purple-border mb-1">描述</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <button
          className="mt-5 w-full py-2.5 rounded-lg font-display font-bold text-white bg-gradient-to-r from-amber-primary to-amber-dark hover:opacity-90 transition-opacity"
          onClick={handleSubmit}
        >
          创建活动
        </button>
      </div>
    </div>
  );
}
