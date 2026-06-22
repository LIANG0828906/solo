import React, { useState } from 'react';
import { useSceneStore, GLOW_COLOR_PRESETS } from '../store/sceneStore';

const ControlPanel: React.FC = () => {
  const density = useSceneStore((state) => state.density);
  const glowColor = useSceneStore((state) => state.glowColor);
  const setDensity = useSceneStore((state) => state.setDensity);
  const setGlowColor = useSceneStore((state) => state.setGlowColor);
  const triggerRefresh = useSceneStore((state) => state.triggerRefresh);

  const [refreshHovered, setRefreshHovered] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  return (
    <>
      <div style={styles.panel}>
        <button
          style={{
            ...styles.refreshButton,
            transform: refreshHovered ? 'scale(1.15)' : 'scale(1)',
            filter: refreshHovered ? 'brightness(1.2)' : 'brightness(1)',
          }}
          onMouseEnter={() => setRefreshHovered(true)}
          onMouseLeave={() => setRefreshHovered(false)}
          onClick={triggerRefresh}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="#FFFFFF"/>
          </svg>
        </button>

        <div style={styles.sliderContainer}>
          <span style={styles.sliderLabel}>密度</span>
          <input
            type="range"
            min={1}
            max={20}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="custom-slider"
            style={styles.slider}
          />
          <span style={styles.sliderValue}>{density}</span>
        </div>

        <div style={styles.colorPickerContainer}>
          {GLOW_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => setGlowColor(color)}
              onMouseEnter={() => setHoveredColor(color)}
              onMouseLeave={() => setHoveredColor(null)}
              style={{
                ...styles.colorButton,
                backgroundColor: color,
                border: glowColor === color ? '2px solid #FFFFFF' : '2px solid transparent',
                boxShadow: glowColor === color ? `0 0 12px ${color}` : 'none',
                transform: hoveredColor === color ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-slider {
              -webkit-appearance: none;
              appearance: none;
              background: transparent;
              cursor: pointer;
            }
            .custom-slider::-webkit-slider-runnable-track {
              height: 4px;
              background: #00BCD4;
              border-radius: 2px;
            }
            .custom-slider::-moz-range-track {
              height: 4px;
              background: #00BCD4;
              border-radius: 2px;
            }
            .custom-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              background: #FFFFFF;
              border-radius: 50%;
              margin-top: -6px;
              box-shadow: 0 0 6px rgba(0, 188, 212, 0.6);
              cursor: pointer;
            }
            .custom-slider::-moz-range-thumb {
              width: 16px;
              height: 16px;
              background: #FFFFFF;
              border-radius: 50%;
              border: none;
              box-shadow: 0 0 6px rgba(0, 188, 212, 0.6);
              cursor: pointer;
            }
          `,
        }}
      />
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(10, 26, 42, 0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    padding: '0 40px',
    zIndex: 1000,
    borderTop: '1px solid rgba(0, 188, 212, 0.2)',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: '#00BCD4',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease, filter 0.2s ease',
    padding: 0,
    boxShadow: '0 0 12px rgba(0, 188, 212, 0.5)',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  sliderLabel: {
    color: '#B2EBF2',
    fontSize: 14,
    fontFamily: "'Orbitron', monospace",
    letterSpacing: 1,
  },
  slider: {
    width: 180,
    height: 4,
  },
  sliderValue: {
    color: '#00BCD4',
    fontSize: 16,
    fontFamily: "'Orbitron', monospace",
    fontWeight: 600,
    minWidth: 24,
    textAlign: 'center',
  },
  colorPickerContainer: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  colorButton: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    padding: 0,
  },
};

export default ControlPanel;
