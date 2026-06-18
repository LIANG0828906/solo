import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Snack, useSnackStore } from '../store/snackStore.tsx';
import { Cookie, Candy, Coffee, Apple } from 'lucide-react';

interface SnackCardProps {
  snack: Snack;
  index: number;
  isNew?: boolean;
}

const SnackCard: React.FC<SnackCardProps> = React.memo(({ snack, index, isNew }) => {
  const { dispatch, calculateRemainingDays, getProgressColor, getCategoryColor, getCategoryLabel } =
    useSnackStore();

  const remainingDays = useMemo(() => calculateRemainingDays(snack.expiryDate), [snack.expiryDate, calculateRemainingDays]);
  const progressColor = useMemo(() => getProgressColor(remainingDays), [remainingDays, getProgressColor]);
  const categoryColor = useMemo(() => getCategoryColor(snack.category), [snack.category, getCategoryColor]);
  const categoryLabel = useMemo(() => getCategoryLabel(snack.category), [snack.category, getCategoryLabel]);

  const isHighlighted = useSnackStore().state.highlightedSnackId === snack.id;

  const handleClick = () => {
    dispatch({ type: 'SELECT_SNACK', payload: snack.id });
  };

  const getCategoryIcon = () => {
    switch (snack.category) {
      case 'chips':
        return <Cookie size={48} color="#4A2F1A" />;
      case 'chocolate':
        return <Candy size={48} color="#4A2F1A" />;
      case 'drink':
        return <Coffee size={48} color="#4A2F1A" />;
      case 'nuts':
        return <Apple size={48} color="#4A2F1A" />;
      default:
        return <Cookie size={48} color="#4A2F1A" />;
    }
  };

  const getExpiryText = () => {
    if (remainingDays < 0) return `已过期 ${Math.abs(remainingDays)} 天`;
    if (remainingDays === 0) return '今天过期';
    return `剩余 ${remainingDays} 天`;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 },
    },
    new: {
      scale: [0, 1],
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const highlightVariants = {
    highlight: {
      boxShadow: [
        '0 4px 12px rgba(0,0,0,0.1)',
        '0 0 0 4px #F9CA24, 0 4px 12px rgba(0,0,0,0.1)',
        '0 4px 12px rgba(0,0,0,0.1)',
        '0 0 0 4px #F9CA24, 0 4px 12px rgba(0,0,0,0.1)',
        '0 4px 12px rgba(0,0,0,0.1)',
      ],
      borderColor: ['#E8E8E8', '#F9CA24', '#E8E8E8', '#F9CA24', '#E8E8E8'],
      transition: {
        duration: 2,
        times: [0, 0.25, 0.5, 0.75, 1],
      },
    },
  };

  const strokeDasharray = 2 * Math.PI * 35;
  const maxDays = 180;
  const progress = Math.max(0, Math.min(1, (remainingDays + 30) / maxDays));
  const strokeDashoffset = strokeDasharray * (1 - progress);

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial={isNew ? 'new' : 'hidden'}
      animate={isHighlighted ? ['visible', 'highlight'] : 'visible'}
      exit="exit"
      custom={highlightVariants}
      whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="relative w-[200px] h-[280px] bg-white rounded-[12px] cursor-pointer overflow-hidden border border-[#E8E8E8]"
      style={{
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        willChange: 'transform, opacity',
      }}
    >
      <div
        className="absolute top-3 left-3 flex items-center justify-center"
        style={{
          width: '44px',
          height: '20px',
          borderRadius: '6px',
          backgroundColor: categoryColor,
          fontSize: '10px',
          fontWeight: 'bold',
          color: 'white',
          zIndex: 10,
        }}
      >
        {categoryLabel}
      </div>

      <div className="absolute top-3 right-3">
        <svg width="50" height="50" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="35" fill="none" stroke="#E8E8E8" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke={progressColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <text
            x="40"
            y="44"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill={progressColor}
          >
            {remainingDays}
          </text>
        </svg>
      </div>

      <div className="flex flex-col items-center justify-center pt-16 px-4">
        <div className="mb-4 opacity-60">{getCategoryIcon()}</div>
        <h3 className="text-[#4A2F1A] font-bold text-base text-center mb-2 truncate w-full">
          {snack.name}
        </h3>
        <p
          className="text-sm font-medium text-center"
          style={{ color: progressColor }}
        >
          {getExpiryText()}
        </p>
      </div>

      {remainingDays < 7 && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2"
          style={{ backgroundColor: progressColor }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
});

SnackCard.displayName = 'SnackCard';

export default SnackCard;
