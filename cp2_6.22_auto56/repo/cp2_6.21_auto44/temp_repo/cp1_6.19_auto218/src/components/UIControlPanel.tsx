import { motion } from 'framer-motion';
import type { RainType } from '@/types';
import { useRainStore } from '@/store/useRainStore';
import { RAIN_LABELS, RAIN_BUTTON_GRADIENTS } from '@/modules/rain-simulator/rainConfig';

const RAIN_TYPES: RainType[] = ['frontal', 'convective', 'typhoon'];

const RAIN_ICONS: Record<RainType, string> = {
  frontal: '🌧',
  convective: '⛈',
  typhoon: '🌀',
};

export function UIControlPanel() {
  const currentType = useRainStore((s) => s.currentType);
  const intensity = useRainStore((s) => s.intensity);
  const setRainType = useRainStore((s) => s.setRainType);
  const setIntensity = useRainStore((s) => s.setIntensity);

  return (
    <div
      className="rain-ui-controls"
      style={{
        position: 'fixed',
        left: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        zIndex: 10,
        padding: 20,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        {RAIN_TYPES.map((type) => {
          const isActive = currentType === type;
          return (
            <motion.button
              key={type}
              onClick={() => setRainType(type)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              title={RAIN_LABELS[type]}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: isActive ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                background: RAIN_BUTTON_GRADIENTS[type],
                boxShadow: isActive
                  ? '0 0 16px rgba(255,255,255,0.4), inset 0 0 12px rgba(0,0,0,0.25)'
                  : 'inset 0 0 12px rgba(0,0,0,0.35)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: '#1a1a2e',
                fontWeight: 700,
                padding: 0,
              }}
            >
              {RAIN_ICONS[type]}
            </motion.button>
          );
        })}
      </div>

      <div
        style={{
          width: 44,
          height: 1,
          background: 'rgba(255,255,255,0.2)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 10,
            fontFamily: 'monospace',
            letterSpacing: 1,
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }}
        >
          强度 {intensity.toFixed(1)}x
        </span>
        <input
          type="range"
          min={0.2}
          max={2}
          step={0.1}
          value={intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          style={{
            writingMode: 'vertical-lr',
            direction: 'rtl',
            width: 8,
            height: 120,
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 4,
            outline: 'none',
          }}
        />
      </div>

      <style>{`
        .rain-ui-controls input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #66E0E0 0%, #008B8B 100%);
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 8px rgba(102, 224, 224, 0.6);
        }
        .rain-ui-controls input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #66E0E0 0%, #008B8B 100%);
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.8);
        }
        @media (max-width: 767px) {
          .rain-ui-controls {
            left: 12px !important;
            top: 12px !important;
            transform: none !important;
            flex-direction: row !important;
            padding: 10px !important;
            gap: 8px !important;
          }
          .rain-ui-controls > div:first-of-type {
            flex-direction: row !important;
          }
          .rain-ui-controls button {
            width: 32px !important;
            height: 32px !important;
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
