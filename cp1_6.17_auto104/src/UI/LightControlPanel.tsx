import React, { useCallback } from 'react';
import { useLightStore, LightSource } from '@/store/useLightStore';
import { kelvinToRGB, rgbToHex } from '@/utils/colorUtils';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

interface LightGroupProps {
  title: string;
  lightSource: LightSource;
  onChange: (params: Partial<LightSource>) => void;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full"
      />
    </div>
  );
};

const LightGroup: React.FC<LightGroupProps> = ({
  title,
  lightSource,
  onChange,
}) => {
  const rgb = kelvinToRGB(lightSource.colorTemp);
  const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b);

  return (
    <div className="mb-6 p-4 rounded-lg bg-[var(--bg-secondary)] transition-all duration-200 hover:bg-[rgba(26,35,58,0.8)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full border-2 border-[rgba(255,255,255,0.2)] transition-transform duration-200 hover:scale-110"
            style={{ backgroundColor: hexColor }}
            title={`色温: ${lightSource.colorTemp}K`}
          />
        </div>
      </div>
      <Slider
        label="强度"
        value={lightSource.intensity}
        min={0}
        max={2}
        step={0.1}
        onChange={(v) => onChange({ intensity: v })}
      />
      <Slider
        label="色温"
        value={lightSource.colorTemp}
        min={2000}
        max={8000}
        step={100}
        unit="K"
        onChange={(v) => onChange({ colorTemp: v })}
      />
      <Slider
        label="方向角"
        value={lightSource.direction}
        min={0}
        max={360}
        step={1}
        unit="°"
        onChange={(v) => onChange({ direction: v })}
      />
    </div>
  );
};

const LightControlPanel: React.FC = () => {
  const building = useLightStore((state) => state.building);
  const advertisement = useLightStore((state) => state.advertisement);
  const streetLamp = useLightStore((state) => state.streetLamp);
  const setBuildingLight = useLightStore((state) => state.setBuildingLight);
  const setAdvertisementLight = useLightStore(
    (state) => state.setAdvertisementLight
  );
  const setStreetLampLight = useLightStore(
    (state) => state.setStreetLampLight
  );

  return (
    <div
      className="fixed left-4 top-1/2 -translate-y-1/2 z-10 control-panel glassmorphism rounded-xl p-5 overflow-y-auto max-h-[90vh]"
      style={{
        width: '20vw',
        maxWidth: '380px',
        minWidth: '280px',
      }}
    >
      <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
        光源控制
      </h2>
      <LightGroup
        title="建筑灯光"
        lightSource={building}
        onChange={setBuildingLight}
      />
      <LightGroup
        title="广告屏"
        lightSource={advertisement}
        onChange={setAdvertisementLight}
      />
      <LightGroup
        title="路灯"
        lightSource={streetLamp}
        onChange={setStreetLampLight}
      />
    </div>
  );
};

export default LightControlPanel;
