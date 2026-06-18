import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, CalendarDays, Clock, FileText } from 'lucide-react';
import { useSnackStore } from '../store/snackStore.tsx';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const DetailPanel: React.FC = () => {
  const { state, dispatch, calculateRemainingDays, getProgressColor, getCategoryColor, getCategoryLabel } =
    useSnackStore();

  const { selectedSnackId, snacks } = state;
  const selectedSnack = useMemo(
    () => snacks.find((s) => s.id === selectedSnackId) || null,
    [snacks, selectedSnackId]
  );

  const [notes, setNotes] = useState('');
  const [isEating, setIsEating] = useState(false);

  useEffect(() => {
    if (selectedSnack) {
      setNotes(selectedSnack.notes);
    }
  }, [selectedSnack]);

  const remainingDays = useMemo(
    () => (selectedSnack ? calculateRemainingDays(selectedSnack.expiryDate) : 0),
    [selectedSnack, calculateRemainingDays]
  );

  const progressColor = useMemo(
    () => getProgressColor(remainingDays),
    [remainingDays, getProgressColor]
  );

  const handleClose = () => {
    dispatch({ type: 'SELECT_SNACK', payload: null });
  };

  const handleMarkAsEaten = () => {
    if (!selectedSnack) return;
    setIsEating(true);
    setTimeout(() => {
      dispatch({ type: 'MARK_AS_EATEN', payload: selectedSnack.id });
      setIsEating(false);
    }, 300);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleNotesBlur = () => {
    if (selectedSnack && notes !== selectedSnack.notes) {
      dispatch({ type: 'UPDATE_NOTES', payload: { id: selectedSnack.id, notes } });
    }
  };

  const getExpiryStatus = () => {
    if (remainingDays < 0) return { text: '已过期', color: '#FF7675' };
    if (remainingDays === 0) return { text: '今天过期', color: '#FF7675' };
    if (remainingDays < 7) return { text: '即将过期', color: '#FDCB6E' };
    return { text: '状态良好', color: '#00B894' };
  };

  const status = getExpiryStatus();
  const radius = 40;
  const strokeDasharray = 2 * Math.PI * radius;
  const maxDays = 180;
  const progress = Math.max(0, Math.min(1, (remainingDays + 30) / maxDays));
  const strokeDashoffset = strokeDasharray * (1 - progress);

  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'tween',
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        type: 'tween',
        duration: 0.3,
        ease: 'easeIn',
      },
    },
  };

  const shimmerStyle = {
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1s ease-in-out',
  };

  return (
    <AnimatePresence>
      {selectedSnack && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={handleClose}
          />

          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 h-full w-[360px] bg-[#FAFAFA] border-l-2 border-gray-400 z-50 flex flex-col overflow-hidden"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#4A2F1A] mb-1">{selectedSnack.name}</h2>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: getCategoryColor(selectedSnack.category) }}
                  >
                    {getCategoryLabel(selectedSnack.category)}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="flex items-center justify-center my-6">
                <div className="relative" style={{ width: '80px', height: '80px' }}>
                  <svg width="80" height="80" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#E8E8E8"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={progressColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 50 50)"
                      style={{
                        transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white text-[18px] font-bold" style={{ color: progressColor }}>
                      {remainingDays}
                    </span>
                    <span className="text-[10px] text-gray-500">天</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
                  style={{ backgroundColor: `${status.color}20`, color: status.color }}
                >
                  {status.text}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <CalendarDays size={20} className="text-[#6C5CE7]" />
                  <div>
                    <p className="text-xs text-gray-500">购买日期</p>
                    <p className="text-sm font-medium text-[#4A2F1A]">
                      {formatDate(selectedSnack.purchaseDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <Clock size={20} className="text-[#6C5CE7]" />
                  <div>
                    <p className="text-xs text-gray-500">保质期截止</p>
                    <p className="text-sm font-medium" style={{ color: progressColor }}>
                      {formatDate(selectedSnack.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#6C5CE7]" />
                  <label className="text-sm font-medium text-[#4A2F1A]">备注</label>
                </div>
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  onBlur={handleNotesBlur}
                  placeholder="添加一些备注..."
                  className="w-full h-24 p-3 bg-white rounded-lg border border-gray-200 text-sm text-[#4A2F1A] placeholder-gray-400 resize-none focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 transition-all"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <motion.button
                onClick={handleMarkAsEaten}
                whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(108, 92, 231, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                animate={isEating ? { style: shimmerStyle } : {}}
                className="w-full h-[48px] rounded-[8px] text-white font-bold text-base relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Trash2 size={18} />
                  标记已食用
                </span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailPanel;
