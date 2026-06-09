import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BrushSettings, StrokeWidth, Pigment } from '@/types';
import { PIGMENTS, STROKE_WIDTHS } from '@/types';

interface PaletteProps {
  brushSettings: BrushSettings;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: StrokeWidth) => void;
}

export default function Palette({
  brushSettings,
  onColorChange,
  onStrokeWidthChange,
}: PaletteProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [hoveredPigment, setHoveredPigment] = useState<Pigment | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentPigment = PIGMENTS.find(p => p.color === brushSettings.color);

  const paletteContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: isMobile ? '100%' : 80,
        height: isMobile ? 'auto' : 400,
        backgroundColor: '#3d2817',
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        border: '2px solid #5a3d2b',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: '1px solid #5a3d2b',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: brushSettings.color,
            border: '2px solid #f0e6d3',
            boxShadow: '0 0 10px rgba(255,215,0,0.3)',
          }}
        />
        <div style={{ color: '#f0e6d3', fontSize: 12, textAlign: 'center' }}>
          {currentPigment?.name || '自定义'}
          <br />
          <span style={{ fontSize: 10, opacity: 0.7 }}>
            {brushSettings.strokeWidth}px
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(6, 1fr)' : 'repeat(2, 1fr)',
          gap: 8,
          marginBottom: 16,
          flex: 1,
        }}
      >
        {PIGMENTS.map((pigment) => (
          <motion.div
            key={pigment.color}
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              backgroundColor: pigment.color,
              cursor: 'pointer',
              position: 'relative',
              border: brushSettings.color === pigment.color 
                ? '3px solid #ffd700' 
                : '2px solid #5a3d2b',
              boxShadow: brushSettings.color === pigment.color
                ? '0 0 15px rgba(255,215,0,0.6)'
                : '0 2px 4px rgba(0,0,0,0.3)',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onColorChange(pigment.color)}
            onMouseEnter={() => setHoveredPigment(pigment)}
            onMouseLeave={() => setHoveredPigment(null)}
          >
            <AnimatePresence>
              {hoveredPigment?.color === pigment.color && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    top: isMobile ? -28 : '50%',
                    left: isMobile ? '50%' : 50,
                    transform: isMobile ? 'translateX(-50%)' : 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: '#f0e6d3',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  {pigment.name}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        {STROKE_WIDTHS.map((stroke) => (
          <motion.button
            key={stroke.value}
            style={{
              padding: '8px 12px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: brushSettings.strokeWidth === stroke.value
                ? '#b8860b'
                : '#5a3d2b',
              color: brushSettings.strokeWidth === stroke.value
                ? '#1c110c'
                : '#f0e6d3',
              transition: 'background-color 0.2s',
            }}
            whileHover={{
              backgroundColor: brushSettings.strokeWidth === stroke.value
                ? '#b8860b'
                : '#7a5236',
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStrokeWidthChange(stroke.value)}
          >
            {stroke.label}
            <span style={{ display: 'block', fontSize: 10, opacity: 0.8 }}>
              {stroke.value}px
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <motion.button
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 50,
            height: 50,
            borderRadius: '50%',
            backgroundColor: brushSettings.color,
            border: '3px solid #f0e6d3',
            cursor: 'pointer',
            zIndex: 100,
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMobilePalette(!showMobilePalette)}
        />
        
        <AnimatePresence>
          {showMobilePalette && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 99,
                padding: 16,
                backgroundColor: 'rgba(28, 17, 12, 0.95)',
              }}
            >
              {paletteContent}
              <motion.button
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: '#5a3d2b',
                  color: '#f0e6d3',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMobilePalette(false)}
              >
                ×
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div style={{ position: 'sticky', top: 20 }}>
      {paletteContent}
    </div>
  );
}
