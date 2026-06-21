import React, { useState } from 'react';
import { useStore, ColorInfo } from '../store';

const ColorPalette: React.FC = () => {
  const primaryColors = useStore((s) => s.primaryColors);
  const secondaryColors = useStore((s) => s.secondaryColors);
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);
  const [enlargedSection, setEnlargedSection] = useState<'primary' | 'secondary' | null>(null);

  const renderSwatch = (color: ColorInfo, index: number, section: 'primary' | 'secondary') => {
    const isEnlarged = enlargedIndex === index && enlargedSection === section;

    return (
      <React.Fragment key={`${section}-${index}`}>
        <div
          className="color-swatch"
          onClick={() => {
            if (isEnlarged) {
              setEnlargedIndex(null);
              setEnlargedSection(null);
            } else {
              setEnlargedIndex(index);
              setEnlargedSection(section);
            }
          }}
        >
          <div
            className="swatch-block"
            style={{ backgroundColor: color.hex }}
          />
          <span className="swatch-hex">{color.hex}</span>
        </div>
        {isEnlarged && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => {
              setEnlargedIndex(null);
              setEnlargedSection(null);
            }}
          >
            <div
              style={{
                background: '#3a3a3a',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                textAlign: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 8,
                  backgroundColor: color.hex,
                  margin: '0 auto 12px',
                }}
              />
              <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#f0f0f0' }}>{color.hex}</div>
              <div style={{ marginBottom: 4, color: '#ccc' }}>{color.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>
                HSL({color.hsl[0]}, {color.hsl[1]}%, {color.hsl[2]}%)
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                RGB({color.rgb[0]}, {color.rgb[1]}, {color.rgb[2]})
              </div>
            </div>
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="card">
      <h3>主色调</h3>
      <div className="color-swatches">
        {primaryColors.slice(0, 6).map((c, i) => renderSwatch(c, i, 'primary'))}
      </div>

      <h3 style={{ marginTop: 16 }}>辅助色</h3>
      <div className="color-swatches">
        {secondaryColors.slice(0, 8).map((c, i) => renderSwatch(c, i, 'secondary'))}
      </div>
    </div>
  );
};

export default ColorPalette;
