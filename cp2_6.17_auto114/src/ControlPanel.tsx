import React, { useState, useCallback, useEffect } from 'react';
import { useCrystalStore, type CrystalType } from './store';

interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

function SliderWithInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: SliderWithInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setInputValue(step < 1 ? value.toFixed(1) : value.toString());
    }
  }, [value, step, isDragging]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
    setInputValue(step < 1 ? newValue.toFixed(1) : newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let newValue = parseFloat(inputValue);
    if (isNaN(newValue)) {
      newValue = value;
    }
    newValue = Math.max(min, Math.min(max, newValue));
    newValue = Math.round(newValue / step) * step;
    onChange(newValue);
    setInputValue(step < 1 ? newValue.toFixed(1) : newValue.toString());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-container">
      <div className="slider-label-row">
        <span className="slider-label">{label}</span>
        <div className="slider-value-wrapper">
          <input
            type="number"
            className="slider-input"
            value={inputValue}
            min={min}
            max={max}
            step={step}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onMouseDown={() => setIsDragging(false)}
          />
          {unit && <span style={{ fontSize: '11px', color: '#8888AA', marginLeft: '2px' }}>{unit}</span>}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <div className="slider-track">
          <div
            className="slider-fill"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
        <input
          type="range"
          className="slider-range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        />
      </div>
    </div>
  );
}

function RulerIcon() {
  return (
    <svg className="measurement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="19" x2="21" y2="5" />
      <polyline points="16 5 21 5 21 10" />
      <polyline points="3 14 3 19 8 19" />
      <line x1="8" y1="14" x2="10" y2="16" />
      <line x1="12" y1="10" x2="14" y2="12" />
      <line x1="16" y1="6" x2="18" y2="8" />
    </svg>
  );
}

function ProtractorIcon() {
  return (
    <svg className="measurement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20 L4 8 L20 8" />
      <path d="M8 12 Q8 8 12 8" />
      <path d="M15 4 L17 6 L19 4 L21 6 L19 8" />
    </svg>
  );
}

function CrystalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
      <line x1="12" y1="22" x2="12" y2="15.5" />
      <polyline points="22 8.5 12 15.5 2 8.5" />
      <polyline points="2 15.5 12 8.5 22 15.5" />
      <line x1="12" y1="2" x2="12" y2="8.5" />
    </svg>
  );
}

export default function ControlPanel() {
  const {
    crystalType,
    latticeConstant,
    atomScale,
    rotationSpeed,
    cellOpacity,
    isExploded,
    isTransitioning,
    loadingStructure,
    bondMeasurements,
    angleMeasurements,
    panelExpanded,
    setCrystalType,
    setLatticeConstant,
    setAtomScale,
    setRotationSpeed,
    setCellOpacity,
    toggleExploded,
    setIsTransitioning,
    setLoadingStructure,
    togglePanel,
  } = useCrystalStore();

  const [showPulse, setShowPulse] = useState(false);
  const pulseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCrystalTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as CrystalType;
      if (newType === crystalType) return;

      setLoadingStructure(newType);
      setIsTransitioning(true);

      setTimeout(() => {
        setCrystalType(newType);
      }, 250);

      setTimeout(() => {
        setIsTransitioning(false);
        setLoadingStructure(null);
      }, 750);
    },
    [crystalType, setCrystalType, setIsTransitioning, setLoadingStructure]
  );

  const handleExplodeClick = () => {
    setShowPulse(true);
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }
    pulseTimeoutRef.current = setTimeout(() => {
      setShowPulse(false);
    }, 300);
    toggleExploded();
  };

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  const structureOptions: { value: CrystalType; label: string; description: string }[] = [
    { value: 'NaCl', label: 'NaCl 氯化钠', description: '面心立方' },
    { value: 'CsCl', label: 'CsCl 氯化铯', description: '体心立方' },
    { value: 'ZnS', label: 'ZnS 硫化锌', description: '闪锌矿' },
  ];

  return (
    <>
      <div
        className={`control-panel ${panelExpanded ? 'expanded' : ''}`}
      >
        <div>
          <h2 className="panel-title">
            <CrystalIcon />
            晶体可视化
          </h2>
          <p className="panel-subtitle">交互式3D分子结构探索工具</p>
        </div>

        <div className="control-group">
          <div className="section-title">晶体结构</div>
          <div className="structure-select-wrapper">
            <div
              className={`loading-indicator ${loadingStructure ? 'visible' : ''}`}
            >
              <div className="loading-spinner" />
              <span>
                正在加载 {structureOptions.find(o => o.value === loadingStructure)?.label || ''}
              </span>
            </div>
            <select
              className="structure-select"
              value={crystalType}
              onChange={handleCrystalTypeChange}
              disabled={isTransitioning}
            >
              {structureOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#8888AA',
              padding: '6px 10px',
              background: 'rgba(108, 99, 255, 0.08)',
              borderRadius: '4px',
              borderLeft: '2px solid #6C63FF',
            }}>
              {structureOptions.find(o => o.value === crystalType)?.description}晶格结构
            </div>
          </div>
        </div>

        <div className="control-group">
          <div className="section-title">参数控制</div>
          <SliderWithInput
            label="晶格常数"
            value={latticeConstant}
            min={2.0}
            max={5.0}
            step={0.1}
            unit="Å"
            onChange={setLatticeConstant}
          />
          <SliderWithInput
            label="原子缩放"
            value={atomScale}
            min={0.3}
            max={1.5}
            step={0.1}
            unit="x"
            onChange={setAtomScale}
          />
          <SliderWithInput
            label="旋转速度"
            value={rotationSpeed}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={setRotationSpeed}
          />
        </div>

        <div className="control-group">
          <div className="section-title">视图效果</div>
          <div className="button-row">
            <button
              className={`explode-button ${isExploded ? 'active' : ''}`}
              onClick={handleExplodeClick}
            >
              <span className={`explode-pulse ${showPulse ? 'animate' : ''}`} />
              {isExploded ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    <polyline points="9 9 15 15" />
                    <polyline points="15 9 9 15" />
                  </svg>
                  恢复视图
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    <line x1="12" y1="9" x2="12" y2="15" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                  </svg>
                  爆炸视图
                </>
              )}
            </button>
          </div>
          <SliderWithInput
            label="晶胞透明度"
            value={cellOpacity}
            min={0.1}
            max={1.0}
            step={0.1}
            onChange={setCellOpacity}
          />
        </div>

        {(bondMeasurements.length > 0 || angleMeasurements.length > 0) && (
          <div className="measurement-info">
            <div className="section-title" style={{ marginBottom: '4px' }}>
              测量结果
            </div>
            {bondMeasurements.map((m) => (
              <div className="measurement-item" key={m.id}>
                <RulerIcon />
                <span style={{ fontSize: '12px', color: '#8888AA' }}>键长:</span>
                <span className="measurement-value">{m.length.toFixed(2)}</span>
                <span className="measurement-unit">Å</span>
              </div>
            ))}
            {angleMeasurements.map((m) => (
              <div className="measurement-item" key={m.id}>
                <ProtractorIcon />
                <span style={{ fontSize: '12px', color: '#8888AA' }}>键角:</span>
                <span className="measurement-value">{m.angle.toFixed(1)}</span>
                <span className="measurement-unit">°</span>
              </div>
            ))}
            <div style={{
              marginTop: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              color: '#8888AA',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              lineHeight: '1.5',
            }}>
              💡 点击空白区域可清除所有测量
            </div>
          </div>
        )}

        <div style={{
          marginTop: 'auto',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(58, 58, 92, 0.3)',
        }}>
          <div style={{
            fontSize: '11px',
            color: '#8888AA',
            lineHeight: '1.8',
          }}>
            <div style={{ fontWeight: '500', color: '#A0A0CC', marginBottom: '4px' }}>操作提示</div>
            <div>🖱️ 左键拖拽: 旋转视角</div>
            <div>🖱️ 右键拖拽: 平移视角</div>
            <div>🖱️ 滚轮: 缩放视图</div>
            <div>👆 点击原子: 测量键长/键角</div>
          </div>
        </div>
      </div>

      <div className="mobile-drawer-toggle" onClick={togglePanel}>
        <div className="mobile-drawer-toggle-icon" />
      </div>
    </>
  );
}
