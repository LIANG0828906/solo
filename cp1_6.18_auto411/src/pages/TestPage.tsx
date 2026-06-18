import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ColorCard from '@/components/ColorCard';
import { COLORS_DATA, ColorEmotion } from '@/data/colors';
import { useEmotionStore } from '@/store/emotionStore';

const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedColors, selectColor, removeColor, calculateResult, resetSelection } =
    useEmotionStore();

  const shuffledColors = useMemo<ColorEmotion[]>(() => shuffleArray(COLORS_DATA), []);

  const isFull = selectedColors.length >= 3;

  useEffect(() => {
    resetSelection();
  }, [resetSelection]);

  useEffect(() => {
    if (selectedColors.length === 3) {
      const timer = setTimeout(() => {
        calculateResult();
        navigate('/result');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [selectedColors.length, calculateResult, navigate]);

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 40,
        gap: 48,
      }}
    >
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 300,
            letterSpacing: 2,
            color: '#E0E0E0',
            marginBottom: 12,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          选择三种颜色来描述你现在的情绪
        </h1>
        <p
          style={{
            fontSize: 14,
            color: '#9E9E9E',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          每张卡片都代表一种情绪能量
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, auto)',
          gap: 40,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {shuffledColors.map((colorData) => {
          const idx = selectedColors.findIndex((sc) => sc.id === colorData.id);
          const isSelected = idx !== -1;
          return (
            <ColorCard
              key={colorData.id}
              colorData={colorData}
              isSelected={isSelected}
              disabled={isFull}
              selectedOrder={isSelected ? idx + 1 : undefined}
              onSelect={selectColor}
              onDeselect={removeColor}
            />
          );
        })}
      </div>

      <style>{`
        @media (max-width: 1024px) and (min-width: 641px) {
          div[role="grid"] {
            grid-template-columns: repeat(6, auto) !important;
          }
        }
        @media (max-width: 640px) {
          div[role="grid"] {
            grid-template-columns: repeat(1, auto) !important;
            gap: 20px !important;
          }
        }
        @media (max-width: 1024px) {
          h1 {
            font-size: 22px !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default TestPage;
