import React, { useState } from 'react';
import useSceneStore, { LightMode } from '../stores/sceneStore';
import { getSocket } from '../utils/socket';

const ControlPanel: React.FC = () => {
  const { lightMode, setLightMode } = useSceneStore();
  const [activeButton, setActiveButton] = useState<string | null>(null);
  
  const handlePresetClick = (mode: LightMode) => {
    setActiveButton(mode);
    setLightMode(mode);
    
    const socket = getSocket();
    if (socket) {
      socket.emit('lightModeChange', { mode });
    }
    
    setTimeout(() => setActiveButton(null), 150);
  };
  
  const presets = [
    {
      mode: 'warm' as LightMode,
      label: '暖黄',
      sublabel: '3000K',
      color: '#FFB74D',
      icon: '🌙',
    },
    {
      mode: 'cool' as LightMode,
      label: '冷白',
      sublabel: '5000K',
      color: '#B0BEC5',
      icon: '❄️',
    },
    {
      mode: 'smart' as LightMode,
      label: '智能',
      sublabel: '切换',
      color: '#7E57C2',
      icon: '✨',
    },
  ];
  
  return (
    <div style={styles.container}>
      <div style={styles.title}>灯光控制</div>
      <div style={styles.buttonGroup}>
        {presets.map((preset) => (
          <button
            key={preset.mode}
            onClick={() => handlePresetClick(preset.mode)}
            style={{
              ...styles.button,
              backgroundColor: preset.color,
              transform: activeButton === preset.mode ? 'scale(1.1)' : 'scale(1)',
              boxShadow: lightMode === preset.mode 
                ? `0 0 20px ${preset.color}80` 
                : '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <span style={styles.icon}>{preset.icon}</span>
            <span style={styles.buttonLabel}>{preset.label}</span>
            <span style={styles.buttonSubLabel}>{preset.sublabel}</span>
          </button>
        ))}
      </div>
      <div style={styles.currentMode}>
        当前模式: {presets.find(p => p.mode === lightMode)?.label}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    zIndex: 100,
    minWidth: '280px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  button: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 8px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    color: '#fff',
    fontWeight: 500,
  },
  icon: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  buttonLabel: {
    fontSize: '13px',
    marginBottom: '2px',
  },
  buttonSubLabel: {
    fontSize: '11px',
    opacity: 0.9,
  },
  currentMode: {
    fontSize: '13px',
    color: '#666',
    textAlign: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #eee',
  },
};

export default ControlPanel;
