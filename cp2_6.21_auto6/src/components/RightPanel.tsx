import { useStore } from '../store/useStore';
import { themes } from '../types';
import type { SceneElement } from '../types';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  primaryColor: string;
}

function Slider({ label, value, min, max, step = 1, onChange, primaryColor }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          {label}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: primaryColor,
            fontWeight: 600,
            fontFamily: 'monospace',
          }}
        >
          {value.toFixed(step < 1 ? 1 : 0)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '4px',
          borderRadius: '2px',
          background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`,
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer',
          outline: 'none',
        }}
      />
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid ${primaryColor};
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 10px ${primaryColor}50;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid ${primaryColor};
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}

export function RightPanel() {
  const selectedElementId = useStore((state) => state.selectedElementId);
  const elements = useStore((state) => state.elements);
  const theme = useStore((state) => state.theme);
  const updateElement = useStore((state) => state.updateElement);
  const removeElement = useStore((state) => state.removeElement);
  const selectElement = useStore((state) => state.selectElement);
  const syncAllElements = useStore((state) => state.syncAllElements);

  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const themeColors = themes[theme];

  const handleRemove = () => {
    if (selectedElementId) {
      removeElement(selectedElementId);
    }
  };

  const handleUpdate = (props: Partial<SceneElement>) => {
    if (selectedElementId) {
      updateElement(selectedElementId, props);
    }
  };

  const getElementName = (type: string) => {
    const names: Record<string, string> = {
      beatBars: '跳动柱体',
      particleGalaxy: '旋转粒子星系',
      waveSphere: '起伏波形球体',
      lightWall: '闪烁光墙',
    };
    return names[type] || type;
  };

  const isVisible = !!selectedElement;

  return (
    <div
      style={{
        position: 'absolute',
        right: '20px',
        top: '80px',
        width: '300px',
        background: 'white',
        borderRadius: '12px',
        padding: isVisible ? '20px' : '0',
        zIndex: 100,
        border: isVisible ? '1px solid #e0e0e0' : '1px solid transparent',
        boxShadow: isVisible ? '0 8px 32px rgba(0, 0, 0, 0.15)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible ? 'translateX(0)' : 'translateX(340px)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
      }}
    >
      {selectedElement && (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            color: '#333',
            fontSize: '16px',
            fontWeight: 600,
            margin: 0,
          }}
        >
          {getElementName(selectedElement.type)}
        </h3>
        <button
          onClick={() => selectElement(null)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: 'none',
            background: '#f0f0f0',
            color: '#999',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e0e0e0';
            e.currentTarget.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
            e.currentTarget.style.color = '#999';
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4
          style={{
            fontSize: '12px',
            color: '#999',
            fontWeight: 600,
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          通用参数
        </h4>
        <Slider
          label="大小"
          value={selectedElement.scale}
          min={0.3}
          max={3}
          step={0.1}
          onChange={(v) => handleUpdate({ scale: v })}
          primaryColor={themeColors.primary}
        />
        <Slider
          label="响应灵敏度"
          value={selectedElement.sensitivity}
          min={0.1}
          max={3}
          step={0.1}
          onChange={(v) => handleUpdate({ sensitivity: v })}
          primaryColor={themeColors.primary}
        />
        <Slider
          label="旋转速度"
          value={selectedElement.rotationSpeed}
          min={0}
          max={2}
          step={0.1}
          onChange={(v) => handleUpdate({ rotationSpeed: v })}
          primaryColor={themeColors.primary}
        />
      </div>

      <div
        style={{
          marginBottom: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #eee',
        }}
      >
        <h4
          style={{
            fontSize: '12px',
            color: '#999',
            fontWeight: 600,
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          专属参数
        </h4>
        {selectedElement.type === 'beatBars' && (
          <Slider
            label="柱体数量"
            value={selectedElement.barCount || 32}
            min={8}
            max={64}
            step={4}
            onChange={(v) => handleUpdate({ barCount: v })}
            primaryColor={themeColors.primary}
          />
        )}
        {selectedElement.type === 'particleGalaxy' && (
          <Slider
            label="粒子数量"
            value={selectedElement.particleCount || 1000}
            min={200}
            max={3000}
            step={100}
            onChange={(v) => handleUpdate({ particleCount: v })}
            primaryColor={themeColors.primary}
          />
        )}
        {selectedElement.type === 'waveSphere' && (
          <Slider
            label="波形细分"
            value={selectedElement.waveDetail || 32}
            min={16}
            max={64}
            step={4}
            onChange={(v) => handleUpdate({ waveDetail: v })}
            primaryColor={themeColors.primary}
          />
        )}
        {selectedElement.type === 'lightWall' && (
          <>
            <Slider
              label="闪烁频率"
              value={selectedElement.flickerFrequency || 2}
              min={0.5}
              max={5}
              step={0.5}
              onChange={(v) => handleUpdate({ flickerFrequency: v })}
              primaryColor={themeColors.primary}
            />
            <Slider
              label="宽度"
              value={selectedElement.wallSize?.[0] || 4}
              min={2}
              max={10}
              step={0.5}
              onChange={(v) =>
                handleUpdate({
                  wallSize: [v, selectedElement.wallSize?.[1] || 3],
                })
              }
              primaryColor={themeColors.primary}
            />
            <Slider
              label="高度"
              value={selectedElement.wallSize?.[1] || 3}
              min={1}
              max={8}
              step={0.5}
              onChange={(v) =>
                handleUpdate({
                  wallSize: [selectedElement.wallSize?.[0] || 4, v],
                })
              }
              primaryColor={themeColors.primary}
            />
          </>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid #eee',
        }}
      >
        <button
          onClick={handleRemove}
          style={{
            flex: 1,
            height: '40px',
            borderRadius: '8px',
            border: 'none',
            background: '#ff4444',
            color: 'white',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ff2222';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ff4444';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '16px' }}>✕</span>
          删除
        </button>
        <button
          onClick={syncAllElements}
          style={{
            flex: 1,
            height: '40px',
            borderRadius: '8px',
            border: `2px solid ${themeColors.primary}`,
            background: 'transparent',
            color: themeColors.primary,
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = themeColors.primary;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = themeColors.primary;
          }}
        >
          ⟳ 同步节拍
        </button>
      </div>
      )}
    </div>
  );
}

export default RightPanel;
