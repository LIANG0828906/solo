import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuraStore, FavoriteColor } from '../store/store';
import { hslToHexString, hslToString } from '../utils/colorEngine';

const PaletteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface ColorCardProps {
  fav: FavoriteColor;
  index: number;
  onApply: (fav: FavoriteColor) => void;
  onRemove: (id: string) => void;
}

const ColorCard = forwardRef<HTMLDivElement, ColorCardProps>(function ColorCard(
  { fav, index, onApply, onRemove },
  ref,
) {
  const [removing, setRemoving] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRemoving(true);
    setTimeout(() => {
      onRemove(fav.id);
    }, 200);
  };

  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${hslToHexString(fav.primary)} 0%, ${hslToHexString(fav.secondary)} 100%)`,
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20, scale: 1 }}
      animate={{
        opacity: removing ? 0 : 1,
        y: removing ? 20 : 0,
        scale: removing ? 0.5 : 1,
      }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ duration: removing ? 0.2 : 0.4, delay: index * 0.05 }}
      style={{
        position: 'relative',
        width: 60,
        height: 60,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        ...gradientStyle,
      }}
      onClick={() => onApply(fav)}
      title={`主色: ${hslToHexString(fav.primary)}`}
    >
      <button
        onClick={handleDelete}
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          opacity: 0.7,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '0.7';
        }}
      >
        <DeleteIcon />
      </button>
    </motion.div>
  );
});

export function ColorPanel() {
  const [expanded, setExpanded] = useState(false);
  const { favorites, applyFavorite, removeFavorite, auraColor, addFavorite, unlockAura, locked } = useAuraStore();

  const primaryColor = auraColor
    ? hslToString(auraColor.primary)
    : 'hsl(197, 89%, 47%)';

  const handleAddFavorite = () => {
    if (auraColor) {
      addFavorite(auraColor);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
      }}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              width: 200,
              background: 'rgba(20, 22, 28, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>收藏色彩</span>
              {locked && (
                <span
                  style={{
                    fontSize: 10,
                    color: '#A29BFE',
                    background: 'rgba(162,155,254,0.15)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                  onClick={unlockAura}
                >
                  已锁定 · 解锁
                </span>
              )}
            </div>
            {favorites.length === 0 ? (
              <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                暂无收藏
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  maxHeight: 300,
                  overflowY: 'auto',
                }}
              >
                <AnimatePresence mode="popLayout">
                  {favorites.map((fav, i) => (
                    <ColorCard
                      key={fav.id}
                      fav={fav}
                      index={i}
                      onApply={(f) => applyFavorite({ primary: f.primary, secondary: f.secondary })}
                      onRemove={removeFavorite}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddFavorite}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: primaryColor,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            fontWeight: 300,
            boxShadow: `0 0 16px ${primaryColor}`,
            transition: 'box-shadow 0.3s',
          }}
          title="收藏当前色"
        >
          +
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(30, 32, 40, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: expanded ? '#A29BFE' : '#ccc',
            transition: 'all 0.3s',
          }}
        >
          {expanded ? <CloseIcon /> : <PaletteIcon />}
        </motion.button>
      </div>
    </div>
  );
}
