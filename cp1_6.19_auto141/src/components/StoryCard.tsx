import { motion } from 'framer-motion';
import { memo } from 'react';
import { useStore } from '../store/useStore';
import { EASE_ELASTIC } from '../utils/types';

const StoryCard = memo(function StoryCard() {
  const { showStoryCard, currentArtwork, currentFragments } = useStore();

  if (!showStoryCard || !currentArtwork) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE_ELASTIC }}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 80,
        width: 280,
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 16,
          fontWeight: 600,
          color: '#2D3436',
          marginBottom: 4,
        }}
      >
        {currentArtwork.title}
      </div>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: '#636E72',
          marginBottom: 16,
        }}
      >
        艺术家：{currentArtwork.artist}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {currentFragments.map((fragment, index) => (
          <motion.div
            key={fragment.id}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 * index, ease: 'easeOut' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 80,
                height: 28,
                borderRadius: 6,
                background: fragment.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                flexShrink: 0,
              }}
            >
              {fragment.type === 'inspiration'
                ? '灵感源'
                : fragment.type === 'emotion'
                ? '情绪标签'
                : '主题'}
            </div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: '#2D3436',
                fontWeight: 500,
              }}
            >
              {fragment.content.replace(/^[^：]+：/, '')}
            </div>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: '#636E72',
          fontStyle: 'italic',
        }}
      >
        继续抽取盲盒，构建你的灵感关系网
      </div>
    </motion.div>
  );
});

export default StoryCard;
