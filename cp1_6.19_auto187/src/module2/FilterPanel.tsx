import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLAVOR_TAGS } from '../module1/types';
import { useRecipeStore } from '../store/useRecipeStore';
import { SearchBar } from './SearchBar';

interface FilterPanelProps {
  isOpen: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen }) => {
  const { selectedTags, toggleTag } = useRecipeStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            width: '260px',
            flexShrink: 0,
            padding: '20px',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '2px dashed #D2B48C',
            margin: '16px',
            boxShadow: '0 4px 12px rgba(92, 64, 51, 0.1)',
            overflowY: 'auto',
            height: 'calc(100vh - 60px - 32px)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-handwriting)',
              fontSize: '28px',
              color: '#5C4033',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            筛选食谱
          </h2>

          <SearchBar />

          <div
            style={{
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#5C4033',
            }}
          >
            风味标签
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#8B7355',
              marginBottom: '12px',
            }}
          >
            点击标签筛选对应风味的食谱
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FLAVOR_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <motion.button
                  key={tag.id}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '999px',
                    border: '2px solid',
                    borderColor: isSelected ? tag.color : '#D2B48C',
                    background: isSelected ? tag.color : 'transparent',
                    color: isSelected ? '#5C4033' : '#5C4033',
                    fontSize: '14px',
                    fontWeight: isSelected ? 700 : 500,
                    textAlign: 'left',
                    transition: 'all 0.2s ease-out',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: '2px solid',
                      borderColor: isSelected ? '#5C4033' : '#D2B48C',
                      background: isSelected ? '#5C4033' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: tag.color,
                      fontWeight: 900,
                    }}
                  >
                    {isSelected && '✓'}
                  </div>
                  <span>{tag.name}</span>
                  <div
                    style={{
                      marginLeft: 'auto',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: tag.color,
                      border: '1px solid rgba(92, 64, 51, 0.3)',
                    }}
                  />
                </motion.button>
              );
            })}
          </div>

          {selectedTags.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => selectedTags.forEach((t) => toggleTag(t))}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '8px',
                borderRadius: '999px',
                border: '1px dashed #D2B48C',
                background: 'transparent',
                color: '#8B7355',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F5E6C8';
                (e.currentTarget as HTMLButtonElement).style.color = '#5C4033';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#8B7355';
              }}
            >
              清除所有筛选 ({selectedTags.length})
            </motion.button>
          )}

          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px dashed #D2B48C',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#8B7355',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              💡 小提示
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#8B7355',
                textAlign: 'center',
                marginTop: '6px',
                lineHeight: 1.6,
              }}
            >
              在风味地图上，
              <br />
              X轴表示酸度→甜度
              <br />
              Y轴表示清淡→浓郁
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
