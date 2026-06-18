import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash } from 'react-icons/fa';
import { TimeBlock, Category, COLOR_PALETTE, CATEGORY_LABELS } from '@/types/types';

interface EditCardProps {
  block: TimeBlock | null;
  position: { x: number; y: number };
  onSave: (updates: Partial<TimeBlock>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function EditCard({ block, position, onSave, onDelete, onClose }: EditCardProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [category, setCategory] = useState<Category>(Category.Other);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    if (block) {
      setName(block.name);
      setNote(block.note);
      setColor(block.color);
      setCategory(block.category);
    }
  }, [block]);

  if (!block) return null;

  const handleColorSelect = (c: string) => {
    setColor(c);
    setSelectedColor(c);
    setTimeout(() => setSelectedColor(null), 300);
  };

  const handleSave = () => {
    onSave({ name, note, color, category });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <motion.div
          className="glass-card p-6 w-80 max-w-[90vw] relative"
          initial={{ scale: 0.5, opacity: 0, x: position.x - window.innerWidth / 2, y: position.y - window.innerHeight / 2 }}
          animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <FaTimes />
          </button>

          <h3 className="text-lg font-semibold mb-4 text-white">编辑活动</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">活动名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入活动名称，支持emoji 🎯"
                className="w-full px-3 py-2 bg-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">类别</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(Category).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-2 py-1.5 rounded text-xs transition-all ${
                      category === cat
                        ? 'bg-[#6C63FF] text-white'
                        : 'bg-[#2A2A4A] text-gray-300 hover:bg-[#3A3A5C]'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">颜色标签</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorSelect(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c ? 'scale-110' : 'hover:scale-105'
                    } ${selectedColor === c ? 'color-select-blink' : ''}`}
                    style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent' }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">备注</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="添加备注..."
                rows={3}
                className="w-full px-3 py-2 bg-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-[#6C63FF] hover:bg-[#5A52E0] text-white rounded-lg transition-all font-medium"
              >
                保存
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-[#E74C3C] hover:bg-[#C0392B] text-white rounded-lg transition-all"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
