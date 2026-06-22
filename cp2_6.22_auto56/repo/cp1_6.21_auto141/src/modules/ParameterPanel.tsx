import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAppContext, type CycloneType, type Preset } from '../context/AppContext';

const ParameterPanel: React.FC = () => {
  const {
    cycloneType,
    windSpeed,
    particleDensity,
    setCycloneType,
    setWindSpeed,
    setParticleDensity,
    updateParams,
  } = useAppContext();

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isLoadingPresets, setIsLoadingPresets] = useState<boolean>(false);
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchPresets = useCallback(async () => {
    setIsLoadingPresets(true);
    try {
      const response = await axios.get<Preset[]>('/api/presets');
      setPresets(response.data);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    } finally {
      setIsLoadingPresets(false);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleCycloneTypeChange = (type: CycloneType) => {
    setCycloneType(type);
  };

  const handleWindSpeedSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWindSpeed(Number(e.target.value));
  };

  const handleWindSpeedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = Number(e.target.value);
    if (isNaN(val)) val = 1;
    val = Math.max(1, Math.min(10, val));
    setWindSpeed(val);
  };

  const handleParticleDensitySliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParticleDensity(Number(e.target.value));
  };

  const handleParticleDensityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = Number(e.target.value);
    if (isNaN(val)) val = 1000;
    val = Math.max(1000, Math.min(5000, val));
    val = Math.round(val / 500) * 500;
    setParticleDensity(val);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    setIsSavingPreset(true);
    try {
      await axios.post('/api/presets', {
        name: presetName.trim(),
        cycloneType,
        windSpeed,
        particleDensity,
      });
      setPresetName('');
      await fetchPresets();
    } catch (error) {
      console.error('Failed to save preset:', error);
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleLoadPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    if (!id) return;
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      updateParams({
        cycloneType: preset.cycloneType,
        windSpeed: preset.windSpeed,
        particleDensity: preset.particleDensity,
      });
    }
  };

  const handleResetCamera = () => {
    const event = new CustomEvent('resetCamera');
    window.dispatchEvent(event);
  };

  const handleUpdateGridColor = (color: string) => {
    const event = new CustomEvent('updateGridColor', { detail: { color } });
    window.dispatchEvent(event);
  };

  const handleCycloneTypeChangeWithColor = (type: CycloneType) => {
    handleCycloneTypeChange(type);
    if (type === 'cyclone') {
      handleUpdateGridColor('#2196F3');
    } else {
      handleUpdateGridColor('#FF5722');
    }
  };

  const panelContent = (
    <div style={styles.panelContent}>
      <h2 style={styles.title}>旋风实验室</h2>

      <div style={styles.section}>
        <label style={styles.label}>模式</label>
        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.toggleButton,
              ...(cycloneType === 'cyclone' ? styles.toggleButtonActive : {}),
            }}
            onClick={() => handleCycloneTypeChangeWithColor('cyclone')}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 4px #3B82F6')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = cycloneType === 'cyclone' ? '0 0 4px #3B82F6' : 'none')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            气旋
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(cycloneType === 'anticyclone' ? styles.toggleButtonActive : {}),
            }}
            onClick={() => handleCycloneTypeChangeWithColor('anticyclone')}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 4px #3B82F6')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = cycloneType === 'anticyclone' ? '0 0 4px #3B82F6' : 'none')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            反气旋
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>风速强度</label>
        <div style={styles.sliderRow}>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={windSpeed}
            onChange={handleWindSpeedSliderChange}
            style={styles.slider}
          />
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={windSpeed}
            onChange={handleWindSpeedInputChange}
            style={styles.numberInput}
          />
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>粒子密度</label>
        <div style={styles.sliderRow}>
          <input
            type="range"
            min={1000}
            max={5000}
            step={500}
            value={particleDensity}
            onChange={handleParticleDensitySliderChange}
            style={styles.slider}
          />
          <input
            type="number"
            min={1000}
            max={5000}
            step={500}
            value={particleDensity}
            onChange={handleParticleDensityInputChange}
            style={styles.numberInput}
          />
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>保存预设</label>
        <div style={styles.presetSaveRow}>
          <input
            type="text"
            placeholder="预设名称"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            style={styles.textInput}
          />
          <button
            style={styles.primaryButton}
            onClick={handleSavePreset}
            disabled={isSavingPreset || !presetName.trim()}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = '0 0 4px #3B82F6';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            onMouseDown={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isSavingPreset ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>加载预设</label>
        <select
          value={selectedPresetId}
          onChange={handleLoadPreset}
          style={styles.select}
          disabled={isLoadingPresets}
        >
          <option value="">{isLoadingPresets ? '加载中...' : '-- 选择预设 --'}</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.section}>
        <button
          style={styles.resetButton}
          onClick={handleResetCamera}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 4px #3B82F6')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          重置视角
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          style={styles.toggleDrawerButton}
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 4px #3B82F6')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isDrawerOpen ? '✕' : '☰'}
        </button>
        <div
          style={{
            ...styles.drawer,
            ...(isDrawerOpen ? styles.drawerOpen : styles.drawerClosed),
          }}
        >
          {panelContent}
        </div>
      </>
    );
  }

  return <div style={styles.panel}>{panelContent}</div>;
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    width: '240px',
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    padding: '16px',
    color: '#E2E8F0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
    zIndex: 100,
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '240px',
    height: '100vh',
    backgroundColor: '#1E293B',
    borderRadius: 0,
    padding: '16px',
    color: '#E2E8F0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
    zIndex: 100,
    overflowY: 'auto',
    transition: 'transform 0.3s ease-in-out',
  },
  drawerOpen: {
    transform: 'translateX(0)',
  },
  drawerClosed: {
    transform: 'translateX(100%)',
  },
  toggleDrawerButton: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    width: '40px',
    height: '40px',
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontSize: '20px',
    cursor: 'pointer',
    zIndex: 101,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'box-shadow 0.2s, transform 0.1s',
  },
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: '4px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    color: '#94A3B8',
    fontWeight: 500,
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  toggleButton: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#334155',
    color: '#E2E8F0',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.1s, background-color 0.2s',
  },
  toggleButtonActive: {
    backgroundColor: '#3B82F6',
    boxShadow: '0 0 4px #3B82F6',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  slider: {
    flex: 1,
    height: '6px',
    accentColor: '#3B82F6',
    cursor: 'pointer',
  },
  numberInput: {
    width: '56px',
    padding: '6px 8px',
    backgroundColor: '#0F172A',
    color: '#E2E8F0',
    border: '1px solid #334155',
    borderRadius: '6px',
    fontSize: '13px',
    textAlign: 'center',
    outline: 'none',
  },
  presetSaveRow: {
    display: 'flex',
    gap: '8px',
  },
  textInput: {
    flex: 1,
    padding: '8px 10px',
    backgroundColor: '#0F172A',
    color: '#E2E8F0',
    border: '1px solid #334155',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
  },
  primaryButton: {
    padding: '8px 14px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.1s, opacity 0.2s',
    whiteSpace: 'nowrap',
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: '#0F172A',
    color: '#E2E8F0',
    border: '1px solid #334155',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
  resetButton: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#334155',
    color: '#E2E8F0',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.1s, background-color 0.2s',
  },
};

export { ParameterPanel };
export default ParameterPanel;
