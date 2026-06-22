import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { PRESET_TAGS } from '@/types';
import { useSwapStore } from '@/store/swapStore';
import { cn } from '@/utils/helpers';

export const SearchFilter: React.FC = () => {
  const searchKeyword = useSwapStore(state => state.searchKeyword);
  const selectedTag = useSwapStore(state => state.selectedTag);
  const setSearchKeyword = useSwapStore(state => state.setSearchKeyword);
  const setSelectedTag = useSwapStore(state => state.setSelectedTag);

  return (
    <div className="mb-6 space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索物品名称或描述..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8A87C]/50 focus:border-[#E8A87C] transition-all"
        />
        {searchKeyword && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSearchKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={16} className="text-gray-400" />
          </motion.button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedTag(null)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
            selectedTag === null
              ? 'bg-[#E8A87C] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          )}
        >
          全部
          {selectedTag === null && (
            <motion.div
              layoutId="tag-underline"
              className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>

        {PRESET_TAGS.map((tag) => (
          <motion.button
            key={tag}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
              selectedTag === tag
                ? 'bg-[#E8A87C] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            )}
          >
            {tag}
            {selectedTag === tag && (
              <motion.div
                layoutId="tag-underline"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
