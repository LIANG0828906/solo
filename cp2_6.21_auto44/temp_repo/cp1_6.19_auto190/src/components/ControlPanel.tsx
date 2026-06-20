import { motion } from 'framer-motion';
import { useSimulationStore } from '../store';
import { SoilType } from '../types';

const ControlPanel = () => {
  const params = useSimulationStore((state) => state.params);
  const setParameter = useSimulationStore((state) => state.setParameter);
  const resetSimulation = useSimulationStore((state) => state.resetSimulation);

  const handleLightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParameter('lightIntensity', Number(e.target.value));
  };

  const handleWaterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParameter('waterContent', Number(e.target.value));
  };

  const handleSoilChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParameter('soilType', e.target.value as SoilType);
  };

  const handleReset = () => {
    resetSimulation();
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: 260,
    borderRadius: 12,
    backgroundColor: '#0D2B1ACC',
    backdropFilter: 'blur(10px)',
    padding: 20,
    color: '#D2B48C',
    zIndex: 100,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: 500,
  };

  const sliderContainerStyle: React.CSSProperties = {
    marginBottom: 20,
  };

  const sliderWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: 6,
    appearance: 'none' as const,
    background: '#4A3728',
    borderRadius: 3,
    outline: 'none',
    cursor: 'pointer',
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: 14,
    minWidth: 40,
    textAlign: 'right',
    color: '#FFD700',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #8B6914',
    backgroundColor: '#2A1E14',
    color: '#D2B48C',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#8B6914',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: 8,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 20,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 1,
  };

  return (
    <motion.div
      style={panelStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={titleStyle}>根系生长模拟</div>

      <div style={sliderContainerStyle}>
        <label style={labelStyle}>光照强度</label>
        <div style={sliderWrapperStyle}>
          <input
            type="range"
            min="0"
            max="100"
            value={params.lightIntensity}
            onChange={handleLightChange}
            style={sliderStyle}
          />
          <span style={valueStyle}>{params.lightIntensity}%</span>
        </div>
      </div>

      <div style={sliderContainerStyle}>
        <label style={labelStyle}>水分含量</label>
        <div style={sliderWrapperStyle}>
          <input
            type="range"
            min="0"
            max="100"
            value={params.waterContent}
            onChange={handleWaterChange}
            style={sliderStyle}
          />
          <span style={valueStyle}>{params.waterContent}%</span>
        </div>
      </div>

      <div style={sliderContainerStyle}>
        <label style={labelStyle}>土壤类型</label>
        <select value={params.soilType} onChange={handleSoilChange} style={selectStyle}>
          <option value="sand">沙土</option>
          <option value="loam">壤土</option>
          <option value="clay">黏土</option>
        </select>
      </div>

      <motion.button
        style={buttonStyle}
        onClick={handleReset}
        whileHover={{ backgroundColor: '#FFD700', color: '#2A1E14' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        重置模拟
      </motion.button>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFD700;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFD700;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        select:focus {
          border-color: #FFD700;
        }
      `}</style>
    </motion.div>
  );
};

export default ControlPanel;
