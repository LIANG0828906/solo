import { motion, AnimatePresence } from 'framer-motion';
import { useTeaStore } from './store';
import type { TeaSubCategory, Material } from './types';

const CATEGORIES: { key: TeaSubCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: '全部茶底', icon: '🍵' },
  { key: 'original', label: '原叶茶', icon: '🍃' },
  { key: 'flower', label: '花果茶', icon: '🌸' },
  { key: 'milk', label: '奶茶底', icon: '🥛' },
];

const EXTRA_CATEGORIES: { key: string; label: string; icon: string; filter: (m: Material) => boolean }[] = [
  { key: 'topping', label: '精选小料', icon: '🧋', filter: (m) => m.category === 'topping' },
  { key: 'syrup', label: '风味糖浆', icon: '🍯', filter: (m) => m.category === 'syrup' },
];

const TeaCard = ({ material }: { material: Material }) => {
  const addMaterial = useTeaStore((s) => s.addMaterial);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-xl overflow-hidden cursor-pointer"
      style={{
        width: 240,
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(165, 214, 167, 0.25)',
      }}
    >
      <div
        className="h-36 flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${material.color}55 0%, ${material.color}22 100%)`,
        }}
      >
        <motion.span
          className="text-6xl"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {material.icon}
        </motion.span>
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: material.color + '66', color: '#333' }}
        >
          {material.calories} kcal
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1">{material.name}</h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{material.description}</p>
      </div>
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            addMaterial(material.id);
          }}
          className="absolute inset-x-0 bottom-0 mx-3 mb-3 py-2.5 rounded-lg text-white font-medium text-sm"
          style={{
            background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)',
            opacity: 0,
            transform: 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0';
            e.currentTarget.style.transform = 'translateY(8px)';
          }}
        >
          + 加入调配
        </motion.button>
      </AnimatePresence>
      <div
        className="absolute inset-x-0 bottom-0 h-12 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400"
        style={{
          background: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0))',
        }}
      />
    </motion.div>
  );
};

export const TeaSearch = () => {
  const {
    materials,
    searchQuery,
    activeCategory,
    setSearchQuery,
    setActiveCategory,
  } = useTeaStore();

  const filteredTeas = materials.filter((m) => {
    if (m.category !== 'tea') return false;
    if (activeCategory !== 'all' && m.subCategory !== activeCategory) return false;
    if (searchQuery && !m.name.includes(searchQuery) && !m.description.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="w-full">
      <div className="sticky top-0 z-20 py-5 px-6 backdrop-blur-md"
        style={{ background: 'linear-gradient(180deg, rgba(232,245,233,0.95) 0%, rgba(232,245,233,0.8) 100%)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索你喜欢的茶饮..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border-0 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 text-gray-700 placeholder-gray-400 transition-all"
                style={{ boxShadow: '0 2px 12px rgba(165, 214, 167, 0.2)' }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-green-50'
                }`}
                style={{
                  background: activeCategory === cat.key
                    ? 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)'
                    : undefined,
                  boxShadow: activeCategory === cat.key ? '0 4px 14px rgba(102, 187, 106, 0.4)' : '0 2px 8px rgba(165, 214, 167, 0.15)',
                }}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-10">
        <div className="flex items-center gap-2 mb-4 mt-4">
          <span className="text-xl">🍃</span>
          <h2 className="text-lg font-semibold text-gray-800">
            {CATEGORIES.find((c) => c.key === activeCategory)?.label || '茶底选择'}
          </h2>
          <span className="text-sm text-gray-400">({filteredTeas.length} 款)</span>
        </div>
        <div className="flex flex-wrap gap-5">
          <AnimatePresence mode="popLayout">
            {filteredTeas.map((m) => (
              <TeaCard key={m.id} material={m} />
            ))}
          </AnimatePresence>
        </div>

        {EXTRA_CATEGORIES.map((extra) => {
          const items = materials.filter(extra.filter);
          return (
            <div key={extra.key} className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{extra.icon}</span>
                <h2 className="text-lg font-semibold text-gray-800">{extra.label}</h2>
                <span className="text-sm text-gray-400">({items.length} 款)</span>
              </div>
              <div className="flex flex-wrap gap-5">
                <AnimatePresence mode="popLayout">
                  {items.map((m) => (
                    <TeaCard key={m.id} material={m} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
