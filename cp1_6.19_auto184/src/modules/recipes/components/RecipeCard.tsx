import { motion } from 'framer-motion';
import type { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

export function RecipeCard({ 
  recipe, 
  isSelected = false, 
  showCheckbox = false,
  onToggle,
  onClick 
}: RecipeCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scaleY: 0.8 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ 
        y: -8,
        boxShadow: '0 8px 16px rgba(139, 111, 71, 0.4)',
        borderColor: '#8B6F47',
        transition: { duration: 0.3, ease: 'cubic-bezier(0.4, 0, 0.2, 1)' }
      }}
      onClick={onClick}
      style={{
        width: 280,
        height: 200,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(212, 197, 176, 0.6)',
        border: '2px solid #D4C5B0',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {showCheckbox && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
          }}
        >
          <motion.div
            whileTap={{ scale: 1.2 }}
            animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: `2px solid ${isSelected ? '#E67E22' : '#CCCCCC'}`,
              backgroundColor: isSelected ? '#E67E22' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6L5 9L10 3"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </motion.div>
        </div>
      )}
      
      <div
        style={{
          height: 120,
          backgroundColor: recipe.coverColor,
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
        }} />
      </div>
      
      <div style={{
        padding: '12px 16px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: '#2C3E50',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {recipe.name}
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 10,
            backgroundColor: '#FFF8F0',
            fontSize: 12,
            color: '#E67E22',
            fontWeight: 500,
          }}>
            {recipe.ingredients.length} 种食材
          </span>
          <span style={{
            fontSize: 12,
            color: '#95A5A6',
          }}>
            {recipe.steps.length} 步
          </span>
        </div>
      </div>
    </motion.div>
  );
}
