import React, { useState, useEffect } from 'react';
import { eventBus } from './EventBus';
import { timeSimulator } from './TimeSimulator';
import { CelestialDataManager } from './CelestialDataManager';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const celestialDataManager = CelestialDataManager.getInstance();

const presetSpeeds = [1, 10, 100, 1000];

const UIOverlay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date(Date.UTC(2025, 0, 1, 0, 0, 0, 0)));
  const [speed, setSpeed] = useState<number>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [isMeasurementMode, setIsMeasurementMode] = useState<boolean>(false);
  const [measurementDistance, setMeasurementDistance] = useState<number | null>(null);
  const [measurementFrom, setMeasurementFrom] = useState<string | null>(null);
  const [measurementTo, setMeasurementTo] = useState<string | null>(null);
  const [panelExpanded, setPanelExpanded] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  useEffect(() => {
    const handleTimeUpdated = (payload: { currentTime: Date }) => {
      setCurrentTime(payload.currentTime);
    };

    const handleSpeedChanged = (payload: number) => {
      setSpeed(payload);
    };

    const handleDirectionChanged = (payload: 1 | -1) => {
      setDirection(payload);
    };

    const handleTogglePause = (payload: boolean) => {
      setIsPaused(payload);
    };

    const handlePlanetSelected = (payload: { planetId: string | null }) => {
      setSelectedPlanetId(payload.planetId);
      if (payload.planetId !== null) {
        setPanelExpanded(true);
      }
    };

    const handleStartMeasurement = () => {
      setIsMeasurementMode(true);
      setMeasurementFrom(null);
      setMeasurementTo(null);
      setMeasurementDistance(null);
    };

    const handleExitMeasurement = () => {
      setIsMeasurementMode(false);
      setMeasurementFrom(null);
      setMeasurementTo(null);
      setMeasurementDistance(null);
    };

    const handleMeasurementPointSelected = (payload: { bodyId: string }) => {
      if (measurementFrom === null) {
        setMeasurementFrom(payload.bodyId);
      } else if (measurementTo === null) {
        setMeasurementTo(payload.bodyId);
      }
    };

    const handleMeasurementResult = (payload: { distance: number }) => {
      setMeasurementDistance(payload.distance);
    };

    const handleWindowResize = () => {
      setWindowWidth(window.innerWidth);
    };

    eventBus.on('timeUpdated', handleTimeUpdated);
    eventBus.on('speedChanged', handleSpeedChanged);
    eventBus.on('directionChanged', handleDirectionChanged);
    eventBus.on('togglePause', handleTogglePause);
    eventBus.on('planetSelected', handlePlanetSelected);
    eventBus.on('startMeasurement', handleStartMeasurement);
    eventBus.on('exitMeasurement', handleExitMeasurement);
    eventBus.on('measurementPointSelected', handleMeasurementPointSelected);
    eventBus.on('measurementResult', handleMeasurementResult);

    window.addEventListener('resize', handleWindowResize);

    return () => {
      eventBus.off('timeUpdated', handleTimeUpdated);
      eventBus.off('speedChanged', handleSpeedChanged);
      eventBus.off('directionChanged', handleDirectionChanged);
      eventBus.off('togglePause', handleTogglePause);
      eventBus.off('planetSelected', handlePlanetSelected);
      eventBus.off('startMeasurement', handleStartMeasurement);
      eventBus.off('exitMeasurement', handleExitMeasurement);
      eventBus.off('measurementPointSelected', handleMeasurementPointSelected);
      eventBus.off('measurementResult', handleMeasurementResult);

      window.removeEventListener('resize', handleWindowResize);
    };
  }, [measurementFrom, measurementTo]);

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const logValue = parseFloat(e.target.value);
    const newSpeed = Math.pow(10, logValue);
    timeSimulator.setSpeed(newSpeed);
  };

  const handlePresetSpeed = (preset: number) => {
    timeSimulator.setSpeed(preset);
  };

  const handleToggleDirection = () => {
    timeSimulator.toggleDirection();
  };

  const handleTogglePause = () => {
    timeSimulator.togglePause();
  };

  const selectedPlanet = selectedPlanetId ? celestialDataManager.getBody(selectedPlanetId) : null;

  const getMeasurementText = () => {
    if (measurementDistance !== null && measurementFrom && measurementTo) {
      const fromBody = celestialDataManager.getBody(measurementFrom);
      const toBody = celestialDataManager.getBody(measurementTo);
      return `${fromBody?.name || measurementFrom} → ${toBody?.name || measurementTo}: ${measurementDistance.toLocaleString()} 百万公里`;
    }
    if (isMeasurementMode) {
      if (measurementFrom && !measurementTo) {
        const fromBody = celestialDataManager.getBody(measurementFrom);
        return `测量模式: 已选择 ${fromBody?.name || measurementFrom}，请选择目标天体`;
      }
      return '测量模式: 请选择起始天体';
    }
    return '';
  };

  const infoPanelStyle: React.CSSProperties = windowWidth < 1200
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'auto',
        maxHeight: '50vh',
        borderRadius: '12px 12px 0 0',
      }
    : {
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 320,
        maxHeight: '80vh',
        overflowY: 'auto',
      };

  const sliderValue = Math.log10(speed);

  return (
    <>
      {isMeasurementMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          background: '#0B0D1790',
          backdropFilter: 'blur(8px)',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'center',
          color: '#A8B2D1',
          fontSize: '14px',
          fontFamily: 'Inter, Segoe UI, sans-serif',
          zIndex: 100,
        }}>
          <span style={measurementDistance !== null ? { color: '#FFD700' } : {}}>
            {getMeasurementText()}
          </span>
        </div>
      )}

      <div style={{
        position: 'fixed',
        top: 16,
        left: 16,
        width: 300,
        background: '#0B0D1790',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        padding: 16,
        color: '#A8B2D1',
        fontFamily: 'Inter, Segoe UI, sans-serif',
        zIndex: 100,
      }}>
        <div style={{
          fontSize: '16px',
          color: '#00D4FF',
          fontFamily: 'monospace',
          marginBottom: 16,
        }}>
          {formatDate(currentTime)}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '12px', marginBottom: '8px', color: '#8892B0' }}>
            速度: {speed.toFixed(1)}x
          </div>
          <input
            type="range"
            min={Math.log10(0.1)}
            max={Math.log10(1000)}
            step="0.01"
            value={sliderValue}
            onChange={handleSpeedChange}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 16, display: 'flex' }}>
          {presetSpeeds.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetSpeed(preset)}
              style={{
                background: speed === preset ? '#FFFFFF25' : '#FFFFFF15',
                border: 'none',
                borderLeft: speed === preset ? '2px solid #00D4FF' : 'none',
                color: '#A8B2D1',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                marginRight: 4,
                transition: '0.15s',
              }}
              onMouseEnter={(e) => {
                if (speed !== preset) {
                  e.currentTarget.style.background = '#FFFFFF25';
                }
              }}
              onMouseLeave={(e) => {
                if (speed !== preset) {
                  e.currentTarget.style.background = '#FFFFFF15';
                }
              }}
            >
              {preset}x
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleToggleDirection}
            style={{
              background: '#FFFFFF15',
              border: 'none',
              color: '#A8B2D1',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              flex: 1,
              transition: '0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFFFFF25';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF15';
            }}
          >
            {direction === 1 ? '→' : '←'}
          </button>
          <button
            onClick={handleTogglePause}
            style={{
              background: '#FFFFFF15',
              border: 'none',
              color: '#A8B2D1',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              flex: 1,
              transition: '0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFFFFF25';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF15';
            }}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      {selectedPlanet && (
        <div style={{
          ...infoPanelStyle,
          background: '#0B0D1790',
          backdropFilter: 'blur(8px)',
          padding: 16,
          color: '#A8B2D1',
          fontFamily: 'Inter, Segoe UI, sans-serif',
          zIndex: 100,
          transition: 'all 0.3s',
          transform: panelExpanded ? 'translateY(0)' : windowWidth < 1200 ? 'translateY(calc(100% - 40px))' : 'translateY(calc(100% - 40px))',
        }}>
          <button
            onClick={() => setPanelExpanded(!panelExpanded)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'transparent',
              border: 'none',
              color: '#A8B2D1',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px 8px',
            }}
          >
            {panelExpanded ? '▼' : '▲'}
          </button>

          {panelExpanded && (
            <>
              <div style={{
                fontSize: '18px',
                color: '#00D4FF',
                marginBottom: 12,
              }}>
                {selectedPlanet.name} ({selectedPlanet.englishName})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8892B0' }}>
                    平均轨道半径 (AU)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#00D4FF' }}>
                    {selectedPlanet.orbit.semiMajorAxis}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8892B0' }}>
                    偏心率
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#00D4FF' }}>
                    {selectedPlanet.orbit.eccentricity}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8892B0' }}>
                    轨道倾角 (°)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#00D4FF' }}>
                    {selectedPlanet.orbit.inclination}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8892B0' }}>
                    公转周期 (地球日)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#00D4FF' }}>
                    {selectedPlanet.orbit.period}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8892B0' }}>
                    自转周期 (小时)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#00D4FF' }}>
                    {selectedPlanet.rotation.period}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8892B0' }}>
                    质量 (kg)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#00D4FF' }}>
                    {selectedPlanet.physical.mass.toExponential(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8892B0' }}>
                    平均密度 (g/cm³)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#00D4FF' }}>
                    {selectedPlanet.physical.density}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8892B0' }}>
                    表面温度 (K)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#00D4FF' }}>
                    {selectedPlanet.physical.temperature[0]} - {selectedPlanet.physical.temperature[1]}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8892B0' }}>
                    卫星数量
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#00D4FF' }}>
                    {selectedPlanet.physical.moons}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(100vh * 0.33)',
        background: 'linear-gradient(to top, #12142B, transparent)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '20px 16px',
        color: '#8892B0',
        fontFamily: 'Inter, Segoe UI, sans-serif',
        fontSize: '13px',
        zIndex: 50,
        pointerEvents: 'none',
      }}>
        <div>Space=暂停/播放, R=重置视角, M=测量模式, ESC=退出测量</div>
        <div>鼠标拖拽=旋转视角, 滚轮=缩放</div>
      </div>
    </>
  );
};

export default UIOverlay;
