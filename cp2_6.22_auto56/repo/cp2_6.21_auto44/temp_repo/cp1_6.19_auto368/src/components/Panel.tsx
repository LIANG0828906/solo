import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { MATERIAL_PRESETS, MaterialType, formatTime } from '../utils/materialConfig';

const glassPanelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#e0e0e0',
  fontFamily: 'sans-serif',
};

const sliderStyle = (min: number, max: number, value: number): React.CSSProperties => {
  const percent = ((value - min) / (max - min)) * 100;
  return {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: `linear-gradient(to right, #667eea 0%, #764ba2 ${percent}%, rgba(255,255,255,0.1) ${percent}%, rgba(255,255,255,0.1) 100%)`,
  };
};

const sliderThumbStyle = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    transition: transform 0.2s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
`;

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
  decimals?: number;
}

function Slider({ label, value, min, max, step, onChange, unit = '', decimals = 2 }: SliderProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
          fontSize: '13px',
        }}
      >
        <span style={{ opacity: 0.9 }}>{label}</span>
        <span
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          {value.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={sliderStyle(min, max, value)}
      />
    </div>
  );
}

function MaterialButton({
  type,
  name,
  active,
  onClick,
}: {
  type: MaterialType;
  name: string;
  active: boolean;
  onClick: () => void;
}) {
  const preset = MATERIAL_PRESETS[type];
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 12px',
        marginBottom: '8px',
        borderRadius: '8px',
        border: active ? '1px solid #667eea' : '1px solid rgba(255,255,255,0.1)',
        background: active
          ? 'linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3))'
          : 'rgba(255,255,255,0.05)',
        color: '#e0e0e0',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'sans-serif',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: preset.color,
          boxShadow: preset.metalness > 0.5 ? `0 0 8px ${preset.color}80` : 'none',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      />
      <span>{name}</span>
    </motion.button>
  );
}

export default function Panel() {
  const {
    compareMode,
    activeSide,
    materialType,
    roughness,
    metalness,
    envIntensity,
    timeOfDay,
    rightParams,
    setMaterialType,
    setRoughness,
    setMetalness,
    setEnvIntensity,
    setTimeOfDay,
    toggleCompareMode,
    setActiveSide,
  } = useStore();

  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const currentMaterialType = compareMode && activeSide === 'right' ? rightParams.materialType : materialType;
  const currentRoughness = compareMode && activeSide === 'right' ? rightParams.roughness : roughness;
  const currentMetalness = compareMode && activeSide === 'right' ? rightParams.metalness : metalness;
  const currentEnvIntensity = compareMode && activeSide === 'right' ? rightParams.envIntensity : envIntensity;
  const currentTimeOfDay = compareMode && activeSide === 'right' ? rightParams.timeOfDay : timeOfDay;
  const currentMaterialName = MATERIAL_PRESETS[currentMaterialType].name;

  const PanelContent = (
    <>
      <style>{sliderThumbStyle}</style>

      {compareMode && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '14px',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveSide('left')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: activeSide === 'left' ? '1px solid #667eea' : '1px solid rgba(255,255,255,0.1)',
              background: activeSide === 'left' ? 'rgba(102,126,234,0.25)' : 'rgba(255,255,255,0.05)',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'sans-serif',
              transition: 'all 0.2s ease',
            }}
          >
            左侧（锁定）
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveSide('right')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: activeSide === 'right' ? '1px solid #764ba2' : '1px solid rgba(255,255,255,0.1)',
              background: activeSide === 'right' ? 'rgba(118,75,162,0.25)' : 'rgba(255,255,255,0.05)',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'sans-serif',
              transition: 'all 0.2s ease',
            }}
          >
            右侧（可调节）
          </motion.button>
        </div>
      )}

      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px', letterSpacing: '0.5px' }}>
          材质选择
        </div>
        {(Object.keys(MATERIAL_PRESETS) as MaterialType[]).map((key) => (
          <MaterialButton
            key={key}
            type={key}
            name={MATERIAL_PRESETS[key].name}
            active={key === currentMaterialType}
            onClick={() => setMaterialType(key)}
          />
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px', letterSpacing: '0.5px' }}>
          参数微调
        </div>
        <Slider
          label="粗糙度"
          value={currentRoughness}
          min={0}
          max={1}
          step={0.01}
          onChange={setRoughness}
        />
        <Slider
          label="金属度"
          value={currentMetalness}
          min={0}
          max={1}
          step={0.01}
          onChange={setMetalness}
        />
        <Slider
          label="环境光强度"
          value={currentEnvIntensity}
          min={0}
          max={2}
          step={0.1}
          onChange={setEnvIntensity}
        />
      </div>
    </>
  );

  const TimeBar = (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? (drawerOpen ? '210px' : '16px') : '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? 'calc(100% - 32px)' : '500px',
        maxWidth: 'calc(100% - 32px)',
        padding: '12px 18px',
        ...glassPanelStyle,
        zIndex: 100,
      }}
    >
      <style>{sliderThumbStyle}</style>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
          fontSize: '12px',
          color: '#e0e0e0',
          fontFamily: 'sans-serif',
        }}
      >
        <span>时间轴</span>
        <span
          style={{
            background: 'linear-gradient(135deg, #FFA07A, #FF4500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
          }}
        >
          {formatTime(currentTimeOfDay)}
        </span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleCompareMode}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: compareMode ? '1px solid #764ba2' : '1px solid rgba(255,255,255,0.2)',
            background: compareMode
              ? 'linear-gradient(135deg, #667eea, #764ba2)'
              : 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'sans-serif',
            transition: 'all 0.2s ease',
          }}
        >
          {compareMode ? '退出对比' : '对比'}
        </motion.button>
      </div>
      <input
        type="range"
        min={6}
        max={18}
        step={0.05}
        value={currentTimeOfDay}
        onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
        style={sliderStyle(6, 18, currentTimeOfDay)}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          opacity: 0.5,
          marginTop: '4px',
          fontFamily: 'sans-serif',
        }}
      >
        <span>06:00 清晨</span>
        <span>12:00 正午</span>
        <span>18:00 黄昏</span>
      </div>
    </div>
  );

  const InfoBar = (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        padding: '10px 16px',
        ...glassPanelStyle,
        zIndex: 100,
        fontSize: '13px',
        fontFamily: 'sans-serif',
        lineHeight: 1.6,
      }}
    >
      <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '2px' }}>当前材质</div>
      <div
        style={{
          fontWeight: 600,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {currentMaterialName}
        {compareMode && ` · ${activeSide === 'left' ? '左侧' : '右侧'}`}
      </div>
      <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '6px', marginBottom: '2px' }}>
        光照时间
      </div>
      <div style={{ color: '#FFD700' }}>{formatTime(currentTimeOfDay)}</div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {InfoBar}
        {TimeBar}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '200px',
                padding: '18px',
                paddingBottom: '24px',
                overflowY: 'auto',
                background: 'rgba(26,26,46,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 99,
                fontFamily: 'sans-serif',
                color: '#e0e0e0',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(255,255,255,0.3)',
                  margin: '0 auto 14px',
                }}
              />
              {PanelContent}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{
            position: 'fixed',
            bottom: isMobile ? (drawerOpen ? '210px' : '80px') : 'auto',
            right: '16px',
            padding: '10px 16px',
            ...glassPanelStyle,
            zIndex: 101,
            cursor: 'pointer',
            color: '#e0e0e0',
            fontFamily: 'sans-serif',
            fontSize: '12px',
          }}
        >
          {drawerOpen ? '收起' : '设置'}
        </motion.button>
      </>
    );
  }

  return (
    <>
      {InfoBar}
      {TimeBar}

      <div
        style={{
          position: 'fixed',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '220px',
          padding: '18px',
          ...glassPanelStyle,
          zIndex: 100,
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }}
      >
        {PanelContent}
      </div>

      <div
        style={{
          position: 'fixed',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '160px',
          padding: '18px',
          ...glassPanelStyle,
          zIndex: 100,
          fontFamily: 'sans-serif',
          color: '#e0e0e0',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            opacity: 0.7,
            marginBottom: '10px',
            letterSpacing: '0.5px',
          }}
        >
          材质快速切换
        </div>
        {(Object.keys(MATERIAL_PRESETS) as MaterialType[]).map((key) => (
          <MaterialButton
            key={key}
            type={key}
            name={MATERIAL_PRESETS[key].name}
            active={key === currentMaterialType}
            onClick={() => setMaterialType(key)}
          />
        ))}
      </div>
    </>
  );
}
