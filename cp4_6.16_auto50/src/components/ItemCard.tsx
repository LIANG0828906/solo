import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item } from '@/types';
import { formatDate, getTagColor, cn, generateAvatar } from '@/utils/helpers';
import { Edit2, Trash2, ChevronDown, User } from 'lucide-react';
import { useSwapStore } from '@/store/swapStore';
import { useNavigate } from 'react-router-dom';

interface ItemCardProps {
  item: Item;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}

export const ItemCard: React.FC<ItemCardProps> = memo(({ item, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const isAdmin = useSwapStore(state => state.isAdmin);
  const swapEvents = useSwapStore(state => state.swapEvents);

  const lastSwap = swapEvents
    .filter(e => e.itemId === item.id)
    .sort((a, b) => b.swapDate.getTime() - a.swapDate.getTime())[0];

  const handleClick = () => {
    navigate(`/items/${item.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.12)' }}
      className="bg-white rounded-xl p-5 cursor-pointer relative overflow-hidden border border-gray-100"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-2">{item.name}</h3>
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium text-white",
            item.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
          )}
          style={{ transition: 'background-color 0.3s ease' }}
        >
          {item.status === 'active' ? '流转中' : '已停用'}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {item.tags.map((tag, index) => (
          <motion.span
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="px-2 py-0.5 rounded-md text-xs text-white"
            style={{ 
              backgroundColor: getTagColor(tag),
              transition: 'background-color 0.3s ease'
            }}
          >
            {tag}
          </motion.span>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
          <img 
            src={item.holderAvatar || generateAvatar(item.currentHolder)} 
            alt={item.currentHolder}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <User size={14} />
          <span>{item.currentHolder}</span>
        </div>
      </div>

      {lastSwap && (
        <div className="text-xs text-gray-500">
          最近交换：{formatDate(lastSwap.swapDate)}
        </div>
      )}

      <AnimatePresence>
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-3 right-3 flex gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit?.(item)}
              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              title="编辑物品"
            >
              <Edit2 size={14} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete?.(item)}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="删除物品"
            >
              <Trash2 size={14} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 pt-3 border-t border-gray-100"
          >
            <div className="text-xs text-gray-500 space-y-1">
              <p>创建时间：{formatDate(item.createdAt)}</p>
              <p>更新时间：{formatDate(item.updatedAt)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="absolute bottom-3 left-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={16} className="text-gray-400" />
        </motion.div>
      </button>
    </motion.div>
  );
});

ItemCard.displayName = 'ItemCard';
