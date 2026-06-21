import React, { useState } from 'react';
import { MakeupColors } from './utils/faceDetection';

interface ToolPanelProps {
  makeup: MakeupColors;
  onMakeupChange: (makeup: MakeupColors) => void;
}

type CategoryKey = 'lipstick' | 'eyeshadow' | 'blush';

const lipstickColors = [
  '#FF6B9D',
  '#E91E63',
  '#C2185B',
  '#FF5722',
  '#F06292',
  '#AD1457',
  '#FF8A80',
  '#D81B60'
];

const eyeshadowColors = [
  '#8E24AA',
  '#5E35B1',
  '#3949AB',
  '#EC407A',
  '#AB47BC',
  '#7B1FA2'
];

const blushColors = [
  '#FF80AB',
  '#F48FB1',
  '#F06292',
  '#EC407A'
];

const categoryNames: Record<CategoryKey, string> = {
  lipstick: '💄 唇彩',
  eyeshadow: '👁️ 眼影',
  blush: '🌸 腮红'
};

const categoryColors: Record<CategoryKey, string[]> = {
  lipstick: lipstickColors,
  eyeshadow: eyeshadowColors,
  blush: blushColors
};

const ToolPanel: React.FC<ToolPanelProps> = ({ makeup, onMakeupChange }) => {
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>('lipstick');
  const [selectedAnimation, setSelectedAnimation] = useState<{ category: CategoryKey; index: number } | null>(null);

  const handleCategoryClick = (category: CategoryKey) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleColorSelect = (category: CategoryKey, color: string, index: number) => {
    setSelectedAnimation({ category, index });

    setTimeout(() => {
      setSelectedAnimation(null);
    }, 400);

    const currentColor = makeup[category];
    const newColor = currentColor === color ? null : color;

    onMakeupChange({
      ...makeup,
      [category]: newColor
    });
  };

  const renderColorPalette = (category: CategoryKey) => {
    const colors = categoryColors[category];
    const isExpanded = expandedCategory === category;

    return (
      <div key={category} style={styles.categoryContainer}>
        <div
          style={{
            ...styles.categoryHeader,
            ...(isExpanded ? styles.categoryHeaderActive : {})
          }}
          onClick={() => handleCategoryClick(category)}
        >
          <span style={styles.categoryTitle}>{categoryNames[category]}</span>
          {makeup[category] && (
            <div
              style={{
                ...styles.selectedColorIndicator,
                backgroundColor: makeup[category] as string
              }}
            />
          )}
          <span style={{ ...styles.arrow, ...(isExpanded ? styles.arrowExpanded : {}) }}>▼</span>
        </div>

        <div
          style={{
            ...styles.colorPaletteContainer,
            maxHeight: isExpanded ? '200px' : '0',
            opacity: isExpanded ? 1 : 0,
            paddingTop: isExpanded ? '12px' : '0',
            paddingBottom: isExpanded ? '8px' : '0'
          }}
        >
          <div style={styles.colorGrid}>
            {colors.map((color, index) => {
              const isSelected = makeup[category] === color;
              const isAnimating = selectedAnimation?.category === category && selectedAnimation?.index === index;

              return (
                <div
                  key={index}
                  style={{
                    ...styles.colorSwatch,
                    backgroundColor: color,
                    transform: isAnimating ? 'scale(1.3)' : isSelected ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: isSelected
                      ? `0 0 12px ${color}, 0 0 24px ${color}80`
                      : '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                  onClick={() => handleColorSelect(category, color, index)}
                >
                  {isSelected && <div style={styles.haloRing} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.panel}>
      <h2 style={styles.panelTitle}>化妆工具</h2>
      <div style={styles.categories}>
        {(['lipstick', 'eyeshadow', 'blush'] as CategoryKey[]).map(renderColorPalette)}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    width: '280px'
  },
  panelTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#8E24AA',
    marginBottom: '16px',
    textAlign: 'center'
  },
  categories: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  categoryContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'rgba(252, 228, 236, 0.5)'
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    userSelect: 'none',
    gap: '10px'
  },
  categoryHeaderActive: {
    background: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%)'
  },
  categoryTitle: {
    flex: 1,
    fontSize: '16px',
    fontWeight: 600,
    color: '#6A1B9A'
  },
  selectedColorIndicator: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },
  arrow: {
    fontSize: '10px',
    color: '#9C27B0',
    transition: 'transform 0.3s ease'
  },
  arrowExpanded: {
    transform: 'rotate(180deg)'
  },
  colorPaletteContainer: {
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    paddingLeft: '16px',
    paddingRight: '16px'
  },
  colorGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center'
  },
  colorSwatch: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    border: '2px solid white'
  },
  haloRing: {
    position: 'absolute',
    top: '-6px',
    left: '-6px',
    right: '-6px',
    bottom: '-6px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.8)',
    animation: 'pulse 1.5s ease-in-out infinite',
    pointerEvents: 'none'
  }
};

export default ToolPanel;
