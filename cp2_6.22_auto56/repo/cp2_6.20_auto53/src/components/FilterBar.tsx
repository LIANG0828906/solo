import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ChevronDown } from 'lucide-react';
import { useAuctionStore } from '@/stores/auctionStore';
import type { Category } from '@/types';
import { CategoryLabel } from '@/types';

type CategoryValue = Category | 'all';

const categoryOptions: { value: CategoryValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'antique', label: CategoryLabel.antique },
  { value: 'art', label: CategoryLabel.art },
  { value: 'electronics', label: CategoryLabel.electronics },
];

export default function FilterBar() {
  const filter = useAuctionStore((s) => s.filter);
  const setFilter = useAuctionStore((s) => s.setFilter);

  const [category, setCategory] = useState<CategoryValue>(filter.category);
  const [minPrice, setMinPrice] = useState<string>(
    filter.minPrice === 0 ? '' : String(filter.minPrice),
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    filter.maxPrice === 999999999 ? '' : String(filter.maxPrice),
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentCategoryLabel =
    categoryOptions.find((c) => c.value === category)?.label ?? '全部';

  const handleApply = () => {
    const min = minPrice === '' ? 0 : Number(minPrice);
    const max = maxPrice === '' ? 999999999 : Number(maxPrice);
    setFilter({
      category,
      minPrice: isNaN(min) ? 0 : min,
      maxPrice: isNaN(max) ? 999999999 : max,
    });
  };

  const handleReset = () => {
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    useAuctionStore.getState().setFilter({
      category: 'all',
      minPrice: 0,
      maxPrice: 999999999,
    });
  };

  const handleMinChange = (v: string) => {
    if (v === '' || /^\d+$/.test(v)) setMinPrice(v);
  };

  const handleMaxChange = (v: string) => {
    if (v === '' || /^\d+$/.test(v)) setMaxPrice(v);
  };

  return (
    <div
      className="flex items-center gap-5 px-6 py-4 rounded-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: '#888' }}>
          类别
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors min-w-[120px] justify-between"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(201, 168, 76, 0.25)',
              color: '#ccc',
            }}
          >
            <span>{currentCategoryLabel}</span>
            <motion.span
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} style={{ color: '#c9a84c' }} />
            </motion.span>
          </button>
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute z-20 top-full left-0 mt-2 w-full rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(26, 35, 50, 0.95)',
                  border: '1px solid rgba(201, 168, 76, 0.25)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                }}
              >
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setCategory(opt.value);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                    style={{
                      color: category === opt.value ? '#c9a84c' : '#ccc',
                      background:
                        category === opt.value
                          ? 'rgba(201, 168, 76, 0.1)'
                          : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (category !== opt.value) {
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (category !== opt.value) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: '#888' }}>
          价格
        </span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="最低"
            value={minPrice}
            onChange={(e) => handleMinChange(e.target.value)}
            onBlur={handleApply}
            className="gold-input"
            style={{ width: 110 }}
          />
          <span style={{ color: '#666' }}>—</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="最高"
            value={maxPrice}
            onChange={(e) => handleMaxChange(e.target.value)}
            onBlur={handleApply}
            className="gold-input"
            style={{ width: 110 }}
          />
        </div>
      </div>

      <div className="flex-1" />

      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleReset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        style={{
          background: 'linear-gradient(135deg, #e8d48a 0%, #c9a84c 50%, #a58b34 100%)',
          color: '#1a2332',
          boxShadow: '0 4px 16px rgba(201, 168, 76, 0.25)',
        }}
      >
        <RotateCcw size={15} />
        重置筛选
      </motion.button>
    </div>
  );
}
