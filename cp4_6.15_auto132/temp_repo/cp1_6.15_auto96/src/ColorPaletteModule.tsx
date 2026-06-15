import React, { useState, useEffect, useRef } from 'react';
import { getColorsByBrand, getBrandNames, ColorItem } from './BrandLibrary';

interface ColorPaletteModuleProps {
  onColorSelect: (color: ColorItem, brandName: string) => void;
}

const ColorPaletteModule: React.FC<ColorPaletteModuleProps> = ({ onColorSelect }) => {
  const brandNames = getBrandNames();
  const [currentBrand, setCurrentBrand] = useState<string>(brandNames[0]);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<number[]>([]);

  const colors = getColorsByBrand(currentBrand);

  useEffect(() => {
    setVisibleCount(12);
  }, []);

  const clearAllTimeouts = () => {
    animationTimeoutRef.current.forEach(t => clearTimeout(t));
    animationTimeoutRef.current = [];
  };

  const handleBrandChange = (brand: string) => {
    if (brand === currentBrand || isAnimating) return;

    clearAllTimeouts();
    setIsAnimating(true);
    setVisibleCount(0);

    const totalColors = getColorsByBrand(brand);
    
    for (let i = 0; i < totalColors.length; i++) {
      const timeoutId = window.setTimeout(() => {
        setCurrentBrand(brand);
        setVisibleCount(i + 1);
        if (i === totalColors.length - 1) {
          setTimeout(() => setIsAnimating(false), 200);
        }
      }, i * 50);
      animationTimeoutRef.current.push(timeoutId);
    }
  };

  const handleDragStart = (e: React.DragEvent, color: ColorItem, brandName: string) => {
    e.dataTransfer.setData('color', JSON.stringify({ color, brandName }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInIndicator {
          from {
            transform: scaleX(0);
            transform-origin: left center;
          }
          to {
            transform: scaleX(1);
            transform-origin: left center;
          }
        }
        @keyframes ringExpand {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
      <div style={styles.brandTabs}>
        {brandNames.map((brand) => (
        <button
          key={brand}
          onClick={() => handleBrandChange(brand)}
          style={{
            ...styles.brandTab,
            ...(currentBrand === brand ? styles.brandTabActive : {})
          }}
        >
          <span style={styles.brandTabText}>{brand}</span>
          {currentBrand === brand && (
            <div 
            style={styles.brandIndicator}
            />
          )}
        </button>
      ))}
    </div>
      <div style={styles.paletteGrid}>
        {colors.map((color, index) => {
          const isVisible = index < visibleCount;
          const delay = index * 0.05;
          return (
            <div
              key={color.name + index}
              draggable
              onDragStart={(e) => handleDragStart(e, color, currentBrand)}
              onMouseEnter={() => setHoveredColor(color.name)}
              onMouseLeave={() => setHoveredColor(null)}
              onClick={() => onColorSelect(color, currentBrand)}
              style={{
                ...styles.colorSwatch,
                backgroundColor: color.hex,
                border: color.hex === '#FFFFFF' ? '1px solid #D4C4A8' : 'none',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                transition: 'all 0.2s ease-out',
                transitionDelay: `${delay}s`,
                pointerEvents: isVisible ? 'auto' : 'none'
              }}
            >
              {hoveredColor === color.name && (
                <div style={styles.tooltip}>
                  <span style={styles.tooltipText}>{color.name}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '200px',
    height: '100%',
    backgroundColor: '#FFFAF0',
    borderRight: '1px solid #D4C4A8',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '16px 12px',
    boxSizing: 'border-box' as const,
    boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
  },
  brandTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #E8DFD0'
  },
  brandTab: {
    flex: 1,
    position: 'relative' as const,
    padding: '6px 4px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B5D4D',
    transition: 'color 0.3s ease',
    borderRadius: '4px'
  },
  brandTabActive: {
    color: '#4A3F35',
    fontWeight: 700
  },
  brandTabText: {
    position: 'relative' as const,
    zIndex: 1
  },
  brandIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #4A90D9, #9B59B6)',
    borderRadius: '2px',
    animation: 'slideInIndicator 0.3s ease forwards',
    transformOrigin: 'left center'
  },
  paletteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    overflowY: 'auto' as const,
    padding: '4px'
  },
  colorSwatch: {
    width: '100%',
    aspectRatio: '1 / 1' as const,
    borderRadius: '4px',
    cursor: 'grab',
    position: 'relative' as const,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    userSelect: 'none' as const
  },
  tooltip: {
    position: 'absolute' as const,
    bottom: 'calc(100% + 4px)',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#4A3F35',
    color: '#FFFAF0',
    padding: '4px 8px',
    borderRadius: '4px',
    whiteSpace: 'nowrap' as const,
    zIndex: 10,
    pointerEvents: 'none' as const,
    fontSize: '10px',
    fontFamily: "'Noto Sans SC', sans-serif"
  },
  tooltipText: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '10px'
  }
};

export default ColorPaletteModule;
