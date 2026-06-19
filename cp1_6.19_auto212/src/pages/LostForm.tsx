import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Palette, FileText, ArrowRight } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import ColorPicker from '@/components/ColorPicker';
import { useStore } from '@/store';
import type { Category, ColorKey } from '@/types';
import { CATEGORIES, LOCATION_SUGGESTIONS } from '@/types';

export default function LostForm() {
  const navigate = useNavigate();
  const addLostItem = useStore((state) => state.addLostItem);
  const runMatching = useStore((state) => state.runMatching);
  const addToast = useStore((state) => state.addToast);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('其他');
  const [colors, setColors] = useState<ColorKey[]>([]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '请输入物品名称';
    if (!location.trim()) newErrors.location = '请输入丢失地点';
    if (colors.length === 0) newErrors.colors = '请至少选择一种颜色';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newItem = addLostItem({
      name: name.trim(),
      category,
      colors,
      location: location.trim(),
      description: description.trim(),
    });

    const matches = runMatching(newItem);
    matches.forEach((m) => addToast(m.lostItem.name));

    navigate('/matches');
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid var(--border)`,
    backgroundColor: 'var(--card)',
    fontSize: '14px',
  } as const;

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: 'var(--text)',
  } as const;

  return (
    <div className="max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-6"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#E3F2FD' }}
          >
            <Package size={20} color="#4FC3F7" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              失物登记
            </h1>
            <p className="text-sm text-gray-500">请详细描述您丢失的物品</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label style={labelStyle}>
              <Package size={14} className="inline mr-1" />
              物品名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：黑色钱包、蓝色水杯等"
              style={{
                ...inputStyle,
                borderColor: errors.name ? 'var(--error)' : undefined,
              }}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>物品类别</label>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <motion.button
                    key={cat}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCategory(cat)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                    style={{
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      backgroundColor: isSelected ? '#E3F2FD' : 'transparent',
                    }}
                  >
                    <CategoryIcon category={cat} size={16} />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      {cat}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              <Palette size={14} className="inline mr-1" />
              物品颜色
            </label>
            <ColorPicker selected={colors} onChange={setColors} />
            {errors.colors && (
              <p className="text-xs mt-2" style={{ color: 'var(--error)' }}>
                {errors.colors}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>
              <MapPin size={14} className="inline mr-1" />
              丢失地点
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="如：图书馆二楼、教学楼A301等"
              list="location-suggestions"
              style={{
                ...inputStyle,
                borderColor: errors.location ? 'var(--error)' : undefined,
              }}
            />
            <datalist id="location-suggestions">
              {LOCATION_SUGGESTIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
            {errors.location && (
              <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>
                {errors.location}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>
              <FileText size={14} className="inline mr-1" />
              详细描述（选填）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述物品的特征、品牌、内部物品等信息，有助于匹配"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            提交登记
            <ArrowRight size={16} />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
