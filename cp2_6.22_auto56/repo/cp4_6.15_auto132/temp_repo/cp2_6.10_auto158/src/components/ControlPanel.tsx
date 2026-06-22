import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Link2, ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { searchStars } from '@/data/starData';
import { MONTH_NAMES } from '@/types';
import type { Star } from '@/types';

export function ControlPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const timeMonth = useStore((state) => state.timeMonth);
  const showConstellationLines = useStore((state) => state.showConstellationLines);
  const searchQuery = useStore((state) => state.searchQuery);
  const selectedStarId = useStore((state) => state.selectedStarId);
  
  const setTimeMonth = useStore((state) => state.setTimeMonth);
  const toggleConstellationLines = useStore((state) => state.toggleConstellationLines);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const setSelectedStarId = useStore((state) => state.setSelectedStarId);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchStars(searchQuery).slice(0, 10);
  }, [searchQuery]);

  const handleStarSelect = (star: Star) => {
    setSelectedStarId(star.id);
    setSearchQuery('');
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  const panelContent = (
    <div className="space-y-5">
      <div className="text-center border-b-2 border-[var(--color-ink-dark)] pb-3">
        <h2 className="font-seal text-3xl text-[var(--color-ink-dark)] tracking-widest">
          璇玑玉衡
        </h2>
        <p className="font-kai text-sm text-[var(--color-ink-light)] mt-1">
          北宋·司天监星图
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[var(--color-ink-dark)]">
          <Calendar size={18} className="text-[var(--color-cinnabar)]" />
          <span className="font-kai">时令节气</span>
        </div>
        <input
          type="range"
          min="0"
          max="11"
          step="1"
          value={timeMonth}
          onChange={(e) => setTimeMonth(parseInt(e.target.value))}
          className="gold-slider w-full"
        />
        <div className="flex justify-between font-kai text-sm">
          <span className="text-[var(--color-ink-light)]">正月</span>
          <span className="font-seal text-xl text-[var(--color-cinnabar)]">
            {MONTH_NAMES[timeMonth]}
          </span>
          <span className="text-[var(--color-ink-light)]">腊月</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-ink-dark)]">
          <Link2 size={18} className="text-[var(--color-star-gold)]" />
          <span className="font-kai">星宿连线</span>
        </div>
        <button
          onClick={toggleConstellationLines}
          className={`toggle-switch paper-btn ${showConstellationLines ? 'active' : ''}`}
          aria-label="Toggle constellation lines"
        >
          <div className="toggle-knob" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[var(--color-ink-dark)]">
          <Search size={18} className="text-[var(--color-jade-green)]" />
          <span className="font-kai">搜索星宿</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入星名、分野或西方星座..."
            className="search-input w-full px-4 py-2 rounded-lg text-[var(--color-ink-dark)]"
          />
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto scrollbar-thin bg-[var(--color-parchment)] border-2 border-[var(--color-ink-dark)] rounded-lg shadow-xl z-50"
            >
              {searchResults.map((star) => (
                <button
                  key={star.id}
                  onClick={() => handleStarSelect(star)}
                  className={`w-full px-4 py-2 text-left font-kai text-sm border-b border-[var(--color-ink-dark)]/10 last:border-b-0 transition-colors ${
                    selectedStarId === star.id
                      ? 'bg-[var(--color-star-gold)]/20'
                      : 'hover:bg-[var(--color-star-gold)]/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${star.isMain ? 'font-semibold text-[var(--color-ink-dark)]' : 'text-[var(--color-ink-light)]'}`}>
                      {star.name}
                    </span>
                    <span className="seal-stamp text-xs py-0">{star.fenye}</span>
                  </div>
                  <div className="text-xs text-[var(--color-ink-light)]">
                    {star.constellation} · {star.westernConstellation}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t-2 border-[var(--color-ink-dark)]/30">
        <div className="font-kai text-xs text-[var(--color-ink-light)] space-y-1">
          <p>📜 拖拽旋转 · 滚轮缩放 · 点击星体查看详情</p>
          <p>🌟 共收录恒星 283 颗 · 二十八宿</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="control-panel-desktop">
        <motion.div
          initial={false}
          animate={{ width: isExpanded ? 320 : 60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="parchment-bg ink-border fixed left-5 top-1/2 -translate-y-1/2 rounded-xl z-20 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-5"
              >
                <button
                  onClick={() => setIsExpanded(false)}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 transition-colors"
                >
                  <ChevronUp size={20} className="text-[var(--color-ink-dark)] rotate-90" />
                </button>
                {panelContent}
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 flex flex-col items-center gap-4"
              >
                <div className="font-seal text-xl writing-mode-vertical text-[var(--color-ink-dark)]">
                  <span className="block">璇</span>
                  <span className="block">玑</span>
                  <span className="block">玉</span>
                  <span className="block">衡</span>
                </div>
                <button
                  onClick={() => setIsExpanded(true)}
                  className="p-1 rounded-full hover:bg-black/10 transition-colors"
                >
                  <ChevronUp size={20} className="text-[var(--color-ink-dark)] -rotate-90" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="control-panel-mobile">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="paper-btn parchment-bg ink-border fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-20 flex items-center gap-2"
        >
          <Menu size={20} className="text-[var(--color-ink-dark)]" />
          <span className="font-seal text-lg text-[var(--color-ink-dark)]">星图控制</span>
        </button>

        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 bg-black/50 z-30"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="parchment-bg ink-border fixed bottom-0 left-0 right-0 rounded-t-2xl z-40 max-h-[80vh] overflow-y-auto"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-seal text-2xl text-[var(--color-ink-dark)]">璇玑玉衡</h2>
                    <button
                      onClick={() => setIsMobileOpen(false)}
                      className="p-2 rounded-full hover:bg-black/10 transition-colors"
                    >
                      <X size={24} className="text-[var(--color-ink-dark)]" />
                    </button>
                  </div>
                  {panelContent}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
