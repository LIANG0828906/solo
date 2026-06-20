import React from 'react';
import { motion } from 'framer-motion';
import { useSimulationStore } from '../store';

const ControlPanel: React.FC = () => {
  const {
    permeability,
    evaporationRate,
    rainfallIntensity,
    setPermeability,
    setEvaporationRate,
    setRainfallIntensity,
    triggerRainfall,
  } = useSimulationStore();

  const panelStyle: React.CSSProperties = {
    backgroundColor: 'rgba(44, 62, 80, 0.85)',
    borderRadius: '16px',
    padding: '24px',
    color: '#ECF0F1',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  };

  const labelStyle: React.CSSProperties = {
    color: '#ECF0F1',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    display: 'block',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#BDC3C7',
    marginLeft: '8px',
    minWidth: '30px',
    textAlign: 'right',
  };

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const sliderStyle: React.CSSProperties = {
    width: '200px',
    height: '6px',
    WebkitAppearance: 'none',
    appearance: 'none',
    background: '#34495E',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
    flex: 1,
  };

  const rainButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: '#3498DB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease',
    marginTop: '10px',
  };

  const terrainSelectorStyle: React.CSSProperties = {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const terrainButtonBaseStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px',
    border: '2px solid transparent',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const [selectedTerrain, setSelectedTerrain] = React.useState<'mountain' | 'plain' | 'depression'>('plain');

  const getTerrainButtonStyle = (type: 'mountain' | 'plain' | 'depression'): React.CSSProperties => {
    const colors = {
      mountain: { bg: '#8B7355', active: '#6B5344' },
      plain: { bg: '#D4C4A8', active: '#B4A488' },
      depression: { bg: '#C4A882', active: '#A48862' },
    };
    const isSelected = selectedTerrain === type;
    return {
      ...terrainButtonBaseStyle,
      backgroundColor: isSelected ? colors[type].active : colors[type].bg,
      borderColor: isSelected ? '#1ABC9C' : 'transparent',
      color: isSelected ? '#FFFFFF' : '#2C3E50',
    };
  };

  React.useEffect(() => {
    const handleTerrainChange = (e: CustomEvent) => {
      setSelectedTerrain(e.detail);
    };
    window.addEventListener('terrainChange', handleTerrainChange as EventListener);
    return () => window.removeEventListener('terrainChange', handleTerrainChange as EventListener);
  }, []);

  const handleTerrainSelect = (type: 'mountain' | 'plain' | 'depression') => {
    setSelectedTerrain(type);
    window.dispatchEvent(new CustomEvent('terrainSelected', { detail: type }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={panelStyle}
    >
      <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 700 }}>控制面板</h3>
      
      <div>
        <span style={labelStyle}>渗透率调节</span>
        <div style={sliderContainerStyle}>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={permeability}
            onChange={(e) => setPermeability(parseFloat(e.target.value))}
            style={sliderStyle}
          />
          <span style={valueStyle}>{permeability.toFixed(1)}</span>
        </div>
      </div>

      <div>
        <span style={labelStyle}>蒸发速率调节</span>
        <div style={sliderContainerStyle}>
          <input
            type="range"
            min="0"
            max="0.2"
            step="0.01"
            value={evaporationRate}
            onChange={(e) => setEvaporationRate(parseFloat(e.target.value))}
            style={sliderStyle}
          />
          <span style={valueStyle}>{evaporationRate.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <span style={labelStyle}>降雨强度调节</span>
        <div style={sliderContainerStyle}>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={rainfallIntensity}
            onChange={(e) => setRainfallIntensity(parseInt(e.target.value))}
            style={sliderStyle}
          />
          <span style={valueStyle}>{rainfallIntensity}</span>
        </div>
      </div>

      <motion.button
        style={rainButtonStyle}
        onClick={triggerRainfall}
        whileHover={{ backgroundColor: '#2980B9', scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span style={{ fontSize: '20px' }}>🌧️</span>
        开始降雨
      </motion.button>

      <div style={terrainSelectorStyle}>
        <span style={labelStyle}>画笔地形</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            style={getTerrainButtonStyle('mountain')}
            onClick={() => handleTerrainSelect('mountain')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            山地
          </motion.button>
          <motion.button
            style={getTerrainButtonStyle('plain')}
            onClick={() => handleTerrainSelect('plain')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            平原
          </motion.button>
          <motion.button
            style={getTerrainButtonStyle('depression')}
            onClick={() => handleTerrainSelect('depression')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            洼地
          </motion.button>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #1ABC9C;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(26, 188, 156, 0.4);
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #1ABC9C;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(26, 188, 156, 0.4);
        }
      `}</style>
    </motion.div>
  );
};

export default ControlPanel;
