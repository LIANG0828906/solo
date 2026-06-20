import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiSliders } from 'react-icons/fi';
import { hexToHsv, hsvToHex } from '../utils/promptParser';
import type { ColorVariant } from '../hooks/useCanvasState';

interface StylePaletteProps {
  colors: string[];
  selectedColorIndex: number | null;
  colorVariants: ColorVariant[];
  onSelectColor: (index: number | null) => void;
  onUpdateColor: (color: string) => void;
  onApplyVariant: (variantId: string) => void;
  onGenerateVariants: () => void;
  isGenerated: boolean;
}

export const StylePalette: React.FC<StylePaletteProps> = ({
  colors,
  selectedColorIndex,
  colorVariants,
  onSelectColor,
  onUpdateColor,
  onApplyVariant,
  onGenerateVariants,
  isGenerated,
}) => {
  const selectedColor = selectedColorIndex !== null ? colors[selectedColorIndex] : null;
  const selectedHsv = selectedColor ? hexToHsv(selectedColor) : null;

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedHsv) return;
    const newHue = parseInt(e.target.value, 10);
    const newColor = hsvToHex(newHue, selectedHsv.s, selectedHsv.v);
    onUpdateColor(newColor);
  };

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedHsv) return;
    const newSat = parseInt(e.target.value, 10);
    const newColor = hsvToHex(selectedHsv.h, newSat, selectedHsv.v);
    onUpdateColor(newColor);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedHsv) return;
    const newVal = parseInt(e.target.value, 10);
    const newColor = hsvToHex(selectedHsv.h, selectedHsv.s, newVal);
    onUpdateColor(newColor);
  };

  const displayColors = useMemo(() => {
    return colors.slice(0, 5);
  }, [colors]);

  const renderVariantPreview = (variant: ColorVariant) => {
    const gradientColors = variant.colors.slice(0, 3).join(', ');
    return `linear-gradient(135deg, ${gradientColors})`;
  };

  return (
    <motion.div
      className="style-palette"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        width: '280px',
        background: 'linear-gradient(180deg, #16213E 0%, #0F3460 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#E0E0E0',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div>
        <h3 style={{
          margin: 0,
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#E94560',
          fontFamily: '"Playfair Display", serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <FiSliders /> 调色板
        </h3>

        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {displayColors.map((color, index) => (
            <motion.div
              key={index}
              onClick={() => isGenerated && onSelectColor(selectedColorIndex === index ? null : index)}
              whileHover={{ scale: isGenerated ? 1.1 : 1 }}
              whileTap={{ scale: isGenerated ? 0.95 : 1 }}
              style={{
                width: '30px',
                height: '40px',
                borderRadius: '4px',
                backgroundColor: color,
                cursor: isGenerated ? 'pointer' : 'not-allowed',
                opacity: isGenerated ? 1 : 0.5,
                boxShadow: selectedColorIndex === index
                  ? `0 0 0 3px #E94560, 0 2px 8px rgba(0,0,0,0.4)`
                  : '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'box-shadow 0.2s ease',
                border: selectedColorIndex === index ? '2px solid #fff' : '2px solid transparent',
              }}
              title={`颜色 ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {selectedColor && selectedHsv && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: selectedColor,
            }} />
            <span style={{ fontSize: '12px', color: '#E0E0E0' }}>{selectedColor.toUpperCase()}</span>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#8892b0',
              marginBottom: '4px',
            }}>
              色相 (Hue): {selectedHsv.h}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={selectedHsv.h}
              onChange={handleHueChange}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, 
                  hsl(0, 100%, 50%), 
                  hsl(60, 100%, 50%), 
                  hsl(120, 100%, 50%), 
                  hsl(180, 100%, 50%), 
                  hsl(240, 100%, 50%), 
                  hsl(300, 100%, 50%), 
                  hsl(360, 100%, 50%))`,
                appearance: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#8892b0',
              marginBottom: '4px',
            }}>
              饱和度 (Saturation): {selectedHsv.s}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedHsv.s}
              onChange={handleSaturationChange}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, 
                  hsl(${selectedHsv.h}, 0%, 50%), 
                  hsl(${selectedHsv.h}, 100%, 50%))`,
                appearance: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#8892b0',
              marginBottom: '4px',
            }}>
              明度 (Value): {selectedHsv.v}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedHsv.v}
              onChange={handleValueChange}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, 
                  hsl(${selectedHsv.h}, ${selectedHsv.s}%, 0%), 
                  hsl(${selectedHsv.h}, ${selectedHsv.s}%, 100%))`,
                appearance: 'none',
                cursor: 'pointer',
              }}
            />
          </div>
        </motion.div>
      )}

      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#E94560',
            fontFamily: '"Playfair Display", serif',
          }}>
            颜色变体
          </h3>
          <motion.button
            whileHover={{ scale: isGenerated ? 1.1 : 1 }}
            whileTap={{ scale: isGenerated ? 0.95 : 1 }}
            onClick={onGenerateVariants}
            disabled={!isGenerated}
            style={{
              background: 'none',
              border: 'none',
              color: isGenerated ? '#E94560' : '#533483',
              cursor: isGenerated ? 'pointer' : 'not-allowed',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
            }}
            title="随机变体"
          >
            <FiRefreshCw />
          </motion.button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}>
          {colorVariants.map((variant) => (
            <motion.div
              key={variant.id}
              whileHover={{ scale: isGenerated ? 1.05 : 1, y: isGenerated ? -2 : 0 }}
              whileTap={{ scale: isGenerated ? 0.95 : 1 }}
              onClick={() => isGenerated && onApplyVariant(variant.id)}
              style={{
                width: '100%',
                height: '70px',
                borderRadius: '8px',
                background: renderVariantPreview(variant),
                cursor: isGenerated ? 'pointer' : 'not-allowed',
                opacity: isGenerated ? 1 : 0.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '24px',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
              }}>
                {variant.colors.slice(0, 4).map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: c,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {!isGenerated && (
          <p style={{
            fontSize: '12px',
            color: '#533483',
            textAlign: 'center',
            marginTop: '12px',
            margin: '12px 0 0 0',
          }}>
            生成画面后可探索颜色变体
          </p>
        )}
      </div>
    </motion.div>
  );
};
