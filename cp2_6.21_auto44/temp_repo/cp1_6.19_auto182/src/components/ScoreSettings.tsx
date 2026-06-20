import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ScoreWeights, DEFAULT_WEIGHTS } from '../utils/scoreEngine';

interface ScoreSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  weights: ScoreWeights;
  onSave: (weights: ScoreWeights) => void;
}

const sliderCSS = `
.score-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #2E7D32;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.score-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}
.score-slider::-moz-range-thumb {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #2E7D32;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
`;

const dimensions: { key: keyof ScoreWeights; label: string }[] = [
  { key: 'slope', label: '坡度权重' },
  { key: 'treeCoverage', label: '树荫覆盖率权重' },
  { key: 'surfaceQuality', label: '路面平整度权重' },
  { key: 'trafficVolume', label: '车流量权重' },
];

export default function ScoreSettings({ isOpen, onClose, weights, onSave }: ScoreSettingsProps) {
  const [local, setLocal] = useState<ScoreWeights>(DEFAULT_WEIGHTS);

  useEffect(() => {
    if (isOpen) {
      setLocal({ ...weights });
    }
  }, [isOpen, weights]);

  const handleChange = (key: keyof ScoreWeights, value: number) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_WEIGHTS });
  };

  const handleSave = () => {
    onSave({ ...local });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 1000,
            }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 480,
              background: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              padding: 32,
              zIndex: 1001,
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: sliderCSS }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
                评分权重设置
              </span>
              <X
                size={20}
                color="#999"
                style={{ cursor: 'pointer' }}
                onClick={onClose}
              />
            </div>

            {dimensions.map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 14, color: '#555' }}>{label}</span>
                  <span style={{ fontSize: 14, color: '#2E7D32', fontWeight: 600 }}>
                    {local[key]}
                  </span>
                </div>
                <input
                  type="range"
                  className="score-slider"
                  min={0}
                  max={100}
                  value={local[key]}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  style={{
                    width: 360,
                    height: 8,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: `linear-gradient(to right, #2E7D32 ${local[key]}%, #E0E0E0 ${local[key]}%)`,
                    borderRadius: 4,
                    outline: 'none',
                    cursor: 'pointer',
                    display: 'block',
                  }}
                />
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                marginTop: 24,
              }}
            >
              <button
                onClick={handleReset}
                onMouseEnter={(e) =>
                  ((e.target as HTMLButtonElement).style.background = '#757575')
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLButtonElement).style.background = '#9E9E9E')
                }
                style={{
                  background: '#9E9E9E',
                  color: 'white',
                  borderRadius: 8,
                  padding: '10px 24px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                重置
              </button>
              <button
                onClick={handleSave}
                onMouseEnter={(e) =>
                  ((e.target as HTMLButtonElement).style.background = '#1B5E20')
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLButtonElement).style.background = '#2E7D32')
                }
                style={{
                  background: '#2E7D32',
                  color: 'white',
                  borderRadius: 8,
                  padding: '10px 24px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                保存
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
