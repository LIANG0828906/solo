import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useSnackStore } from '../store/snackStore.tsx';

const SuggestionPanel: React.FC = () => {
  const { getSuggestedSnacks, dispatch, calculateRemainingDays, getCategoryColor } = useSnackStore();

  const suggestedSnacks = useMemo(() => getSuggestedSnacks(), [getSuggestedSnacks]);

  const handleSnackClick = (snackId: string) => {
    dispatch({ type: 'HIGHLIGHT_SNACK', payload: snackId });
    dispatch({ type: 'SELECT_SNACK', payload: snackId });
    setTimeout(() => {
      dispatch({ type: 'HIGHLIGHT_SNACK', payload: null });
    }, 2000);
  };

  const getDaysText = (days: number) => {
    if (days < 0) return `已过期 ${Math.abs(days)} 天`;
    if (days === 0) return '今天过期';
    return `剩余 ${days} 天`;
  };

  const getDaysColor = (days: number) => {
    if (days < 7) return '#FF7675';
    if (days < 30) return '#FDCB6E';
    return '#00B894';
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: 'easeOut',
      },
    }),
  };

  if (suggestedSnacks.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="hidden md:block fixed right-5 top-[80px] z-30"
        style={{
          width: '240px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '16px',
          border: '2px solid white',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-[#FDCB6E]" />
            <h3 className="font-bold text-[#4A2F1A] text-sm">建议食用顺序</h3>
          </div>

          <div className="space-y-2">
            {suggestedSnacks.map((snack, index) => {
              const remainingDays = calculateRemainingDays(snack.expiryDate);
              return (
                <motion.div
                  key={snack.id}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ x: -4, backgroundColor: 'rgba(108, 92, 231, 0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSnackClick(snack.id)}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: remainingDays < 7 ? 'rgba(255, 118, 117, 0.1)' : 'transparent',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(snack.category) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#4A2F1A] truncate">{snack.name}</p>
                    <div className="flex items-center gap-1">
                      <Clock size={12} style={{ color: getDaysColor(remainingDays) }} />
                      <span className="text-xs" style={{ color: getDaysColor(remainingDays) }}>
                        {getDaysText(remainingDays)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="md:hidden fixed bottom-20 left-0 right-0 z-30"
        style={{
          height: '80px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="h-full px-4 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 flex-shrink-0">
            <AlertTriangle size={18} className="text-[#FDCB6E]" />
            <span className="text-sm font-bold text-[#4A2F1A] whitespace-nowrap">优先食用</span>
          </div>
          {suggestedSnacks.map((snack, index) => {
            const remainingDays = calculateRemainingDays(snack.expiryDate);
            return (
              <motion.div
                key={snack.id}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSnackClick(snack.id)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer"
                style={{
                  backgroundColor:
                    remainingDays < 7 ? 'rgba(255, 118, 117, 0.15)' : 'rgba(108, 92, 231, 0.1)',
                  border: `1px solid ${
                    remainingDays < 7 ? 'rgba(255, 118, 117, 0.3)' : 'rgba(108, 92, 231, 0.2)'
                  }`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getCategoryColor(snack.category) }}
                />
                <span className="text-sm font-medium text-[#4A2F1A] whitespace-nowrap">
                  {snack.name}
                </span>
                <span
                  className="text-xs font-bold whitespace-nowrap"
                  style={{ color: getDaysColor(remainingDays) }}
                >
                  {remainingDays}天
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
};

export default SuggestionPanel;
