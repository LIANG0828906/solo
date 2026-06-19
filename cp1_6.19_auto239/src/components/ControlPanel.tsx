import { useColorFlowStore, EmotionType } from '@/store/useColorFlowStore';
import { motion } from 'framer-motion';
import { useCallback } from 'react';

const EMOTIONS: EmotionType[] = ['宁静', '欢愉', '忧郁', '激昂'];

const EMOTION_HUE: Record<EmotionType, number> = {
  '宁静': 240,
  '欢愉': 45,
  '忧郁': 215,
  '激昂': 15,
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hue: number;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, hue, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: 12, fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'rgba(0,0,0,0.7)', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {step < 1 ? value.toFixed(1) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={onInput}
        onChange={onInput}
        style={{
          WebkitAppearance: 'none',
          appearance: 'none',
          width: '100%',
          height: 4,
          borderRadius: 2,
          outline: 'none',
          background: `linear-gradient(to right, hsl(${hue},70%,60%), hsl(${(hue + 60) % 360},70%,60%))`,
          cursor: 'pointer',
        }}
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid hsl(${hue}, 70%, 55%);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid hsl(${hue}, 70%, 55%);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default function ControlPanel() {
  const { h, s, speed, emotion, setH, setS, setSpeed, setEmotion } = useColorFlowStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        maxWidth: 600,
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 16,
        padding: '18px 24px 16px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Slider label="H 色相" value={h} min={0} max={360} step={1} hue={h} onChange={setH} />
        <Slider label="S 饱和度" value={s} min={0} max={100} step={1} hue={h} onChange={setS} />
        <Slider label="Speed 速度" value={speed} min={0.1} max={5.0} step={0.1} hue={h} onChange={setSpeed} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {EMOTIONS.map((e) => {
          const active = emotion === e;
          const baseHue = EMOTION_HUE[e];
          return (
            <motion.button
              key={e}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEmotion(e)}
              style={{
                height: 36,
                borderRadius: 18,
                border: 'none',
                padding: '0 20px',
                fontSize: 14,
                color: '#fff',
                cursor: 'pointer',
                background: active
                  ? `hsla(${baseHue}, 60%, 40%, 0.8)`
                  : `hsla(${baseHue}, 60%, 50%, 0.6)`,
                fontWeight: active ? 700 : 400,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}
            >
              {e}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
