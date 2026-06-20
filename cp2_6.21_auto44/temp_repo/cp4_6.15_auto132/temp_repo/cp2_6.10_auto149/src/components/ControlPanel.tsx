import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];

const SOLAR_TERMS = [
  { name: '小寒', month: 0, isMajor: false },
  { name: '大寒', month: 0, isMajor: true },
  { name: '立春', month: 1, isMajor: false },
  { name: '雨水', month: 1, isMajor: true },
  { name: '惊蛰', month: 2, isMajor: false },
  { name: '春分', month: 2, isMajor: true },
  { name: '清明', month: 3, isMajor: false },
  { name: '谷雨', month: 3, isMajor: true },
  { name: '立夏', month: 4, isMajor: false },
  { name: '小满', month: 4, isMajor: true },
  { name: '芒种', month: 5, isMajor: false },
  { name: '夏至', month: 5, isMajor: true },
  { name: '小暑', month: 6, isMajor: false },
  { name: '大暑', month: 6, isMajor: true },
  { name: '立秋', month: 7, isMajor: false },
  { name: '处暑', month: 7, isMajor: true },
  { name: '白露', month: 8, isMajor: false },
  { name: '秋分', month: 8, isMajor: true },
  { name: '寒露', month: 9, isMajor: false },
  { name: '霜降', month: 9, isMajor: true },
  { name: '立冬', month: 10, isMajor: false },
  { name: '小雪', month: 10, isMajor: true },
  { name: '大雪', month: 11, isMajor: false },
  { name: '冬至', month: 11, isMajor: true },
];

export interface RingInfo {
  id: string;
  name: string;
  description: string;
}

export interface StarInfo {
  id: string;
  name: string;
  story: string;
}

export interface ControlPanelProps {
  monthIndex: number;
  onMonthChange: (index: number) => void;
  ringInfo: RingInfo | null;
  starInfo: StarInfo | null;
  onCloseInfo: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  monthIndex,
  onMonthChange,
  ringInfo,
  starInfo,
  onCloseInfo,
}) => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const getCurrentSolarTerm = useCallback(() => {
    const monthTerms = SOLAR_TERMS.filter(term => term.month === monthIndex);
    const majorTerm = monthTerms.find(term => term.isMajor);
    return majorTerm?.name || monthTerms[0]?.name || '';
  }, [monthIndex]);

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1000);
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onMonthChange(parseInt(e.target.value, 10));
  }, [onMonthChange]);

  const handleTermClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, month: number) => {
    createRipple(e);
    onMonthChange(month);
  }, [createRipple, onMonthChange]);

  const activeInfo = ringInfo || starInfo;

  return (
    <>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '350px',
          maxWidth: '90vw',
          background: 'rgba(26, 26, 46, 0.9)',
          backdropFilter: 'blur(10px)',
          borderLeft: '2px solid rgba(139, 90, 43, 0.5)',
          borderTop: '2px solid rgba(139, 90, 43, 0.5)',
          borderBottom: '2px solid rgba(139, 90, 43, 0.5)',
          borderRadius: '12px 0 0 12px',
          padding: '24px 20px',
          zIndex: 1000,
          fontFamily: '"STKaiti", "KaiTi", "STSong", serif',
          color: '#f5e6c8',
          boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <style>{`
          @media (max-width: 1024px) {
            .control-panel {
              width: 300px !important;
            }
          }
          .bamboo-slider {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 16px;
            background: linear-gradient(180deg, #a67c52 0%, #8b5a2b 50%, #6b4423 100%);
            border-radius: 8px;
            outline: none;
            position: relative;
            cursor: pointer;
            box-shadow: 
              inset 0 2px 4px rgba(0, 0, 0, 0.4),
              inset 0 -2px 4px rgba(255, 255, 255, 0.1),
              0 2px 8px rgba(0, 0, 0, 0.3);
          }
          .bamboo-slider::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 4px;
            right: 4px;
            height: 2px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
          } }
          .bamboo-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 28px;
            height: 28px;
            background: radial-gradient(circle at 30% 30%, #d4a574, #8b5a2b 60%, #5c3d1e);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #f5e6c8;
            box-shadow: 
              0 4px 12px rgba(0, 0, 0, 0.5),
              inset 0 2px 4px rgba(255, 255, 255, 0.3);
            transition: transform 0.2s ease;
          } }
          .bamboo-slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          } }
          .bamboo-slider::-moz-range-thumb {
            width: 28px;
            height: 28px;
            background: radial-gradient(circle at 30% 30%, #d4a574, #8b5a2b 60%, #5c3d1e);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #f5e6c8;
            box-shadow: 
              0 4px 12px rgba(0, 0, 0, 0.5),
              inset 0 2px 4px rgba(255, 255, 255, 0.3);
          } }
          .ink-button {
            position: relative;
            overflow: hidden;
          } }
          .ink-ripple {
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(26, 26, 46, 0.6) 0%, rgba(26, 26, 46, 0) 70%);
            pointer-events: none;
            transform: translate(-50%, -50%) scale(0);
            animation: ripple-animation 1s ease-out forwards;
          } }
          @keyframes ripple-animation {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(4);
              opacity: 0;
            } }
          .silk-border {
            position: relative;
          } }
          .silk-border::before {
            content: '';
            position: absolute;
            top: -8px;
            left: -8px;
            right: -8px;
            bottom: -8px;
            background: linear-gradient(45deg, 
              transparent 30%, 
              rgba(139, 90, 43, 0.3) 50%, 
              transparent 70%);
            border-radius: 16px;
            z-index: -1;
            filter: blur(4px);
          } }
        `}</style>

        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '22px',
          color: '#d4a574',
          textAlign: 'center',
          letterSpacing: '4px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          时序控衡
        </h3>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '14px', color: '#a67c52' }}>月令</span>
            <span style={{
              fontSize: '18px',
              color: '#f5e6c8',
              fontWeight: 'bold',
              letterSpacing: '2px',
            }}>
              {MONTHS[monthIndex]}
            </span>
            <span style={{ fontSize: '14px', color: '#a67c52' }}>节气</span>
          </div>

          <input
            type="range"
            min="0"
            max="11"
            step="1"
            value={monthIndex}
            onChange={handleSliderChange}
            className="bamboo-slider"
            style={{ width: '100%' }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            padding: '0 4px',
          }}>
            {MONTHS.map((month, index) => (
              <span
                key={index}
                style={{
                  fontSize: '10px',
                  color: index === monthIndex ? '#d4a574' : 'rgba(245, 230, 200, 0.4)',
                  transition: 'color 0.3s ease',
                  fontWeight: index === monthIndex ? 'bold' : 'normal',
                }}
              >
                {month.charAt(0)}
              </span>
            ))}
          </div>

          <motion.div
            key={monthIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              marginTop: '16px',
              textAlign: 'center',
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(139, 90, 43, 0.3) 0%, rgba(92, 61, 30, 0.3) 100%)',
              borderRadius: '8px',
              border: '1px solid rgba(212, 165, 116, 0.3)',
            }}
          >
            <span style={{ fontSize: '12px', color: '#a67c52' }}>当前节气</span>
            <div style={{
              fontSize: '24px',
              color: '#f5e6c8',
              fontWeight: 'bold',
              letterSpacing: '4px',
              marginTop: '4px',
            }}>
              {getCurrentSolarTerm()}
            </div>
          </motion.div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            color: '#a67c52',
            letterSpacing: '2px',
          }}>
            二十四节气
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}>
            {SOLAR_TERMS.filter(term => term.isMajor).map((term, index) => (
              <motion.button
                key={term.name}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(212, 165, 116, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleTermClick(e, term.month)}
                className="ink-button"
                style={{
                  position: 'relative',
                  padding: '8px 4px',
                  background: monthIndex === term.month
                    ? 'linear-gradient(135deg, #8b5a2b 0%, #6b4423 100%)'
                    : 'rgba(139, 90, 43, 0.2)',
                  border: monthIndex === term.month
                    ? '1px solid #d4a574'
                    : '1px solid rgba(212, 165, 116, 0.2)',
                  borderRadius: '6px',
                  color: monthIndex === term.month ? '#f5e6c8' : 'rgba(245, 230, 200, 0.7)',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  letterSpacing: '1px',
                }}
              >
                {term.name}
                {ripples.filter(r => r.id % SOLAR_TERMS.length === index).map(ripple => (
                  <span
                    key={ripple.id}
                    className="ink-ripple"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '40px',
                      height: '40px',
                    }}
                  />
                ))}
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid rgba(212, 165, 116, 0.2)',
          fontSize: '11px',
          color: 'rgba(245, 230, 200, 0.5)',
          textAlign: 'center',
          lineHeight: '1.8',
        }}>
          点击环圈查看说明 · 悬停星宿观看故事
        </div>
      </motion.div>

      <AnimatePresence>
        {activeInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
            }}
            onClick={onCloseInfo}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 2 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="silk-border"
              style={{
                position: 'relative',
                width: '450px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                background: 'linear-gradient(135deg, #f5e6c8 0%, #e8d4a8 50%, #dcc290 100%)',
                borderRadius: '12px',
                padding: '32px 28px',
                fontFamily: '"STKaiti", "KaiTi", "STSong", serif',
                color: '#3d2817',
                boxShadow: `
                  0 20px 60px rgba(0, 0, 0, 0.5),
                  inset 0 0 30px rgba(139, 90, 43, 0.1)
                `,
                border: '2px solid #8b5a2b',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(ellipse at 20% 30%, rgba(139, 90, 43, 0.05) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 70%, rgba(139, 90, 43, 0.08) 0%, transparent 50%)
                `,
                pointerEvents: 'none',
              }} />

              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                height: '20px',
                background: 'linear-gradient(180deg, rgba(139, 90, 43, 0.15) 0%, transparent 100%)',
                borderRadius: '50%',
                filter: 'blur(8px)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                right: '10px',
                height: '20px',
                background: 'linear-gradient(0deg, rgba(139, 90, 43, 0.15) 0%, transparent 100%)',
                borderRadius: '50%',
                filter: 'blur(8px)',
                pointerEvents: 'none',
              }} />

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCloseInfo}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  background: 'none',
                  border: '2px solid #8b5a2b',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#8b5a2b',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                }}
              >
                ×
              </motion.button>

              <h2 style={{
                margin: '0 0 20px 0',
                fontSize: '28px',
                color: '#5c3d1e',
                textAlign: 'center',
                letterSpacing: '6px',
                borderBottom: '2px solid #8b5a2b',
                paddingBottom: '12px',
                textShadow: '0 2px 4px rgba(139, 90, 43, 0.2)',
              }}>
                {ringInfo ? '环圈说明' : '星宿故事'}
              </h2>

              <motion.div
                key={activeInfo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '0 8px',
                }}
              >
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '22px',
                  color: '#8b5a2b',
                  letterSpacing: '3px',
                }}>
                  {activeInfo.name}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  lineHeight: '2',
                  color: '#3d2817',
                  textIndent: '2em',
                  letterSpacing: '1px',
                }}>
                  {'description' in activeInfo ? activeInfo.description : activeInfo.story}
                </p>
              </motion.div>

              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                width: '60px',
                height: '60px',
                borderTop: '3px solid #8b5a2b',
                borderLeft: '3px solid #8b5a2b',
                opacity: 0.4,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '60px',
                height: '60px',
                borderTop: '3px solid #8b5a2b',
                borderRight: '3px solid #8b5a2b',
                opacity: 0.4,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                width: '60px',
                height: '60px',
                borderBottom: '3px solid #8b5a2b',
                borderLeft: '3px solid #8b5a2b',
                opacity: 0.4,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                width: '60px',
                height: '60px',
                borderBottom: '3px solid #8b5a2b',
                borderRight: '3px solid #8b5a2b',
                opacity: 0.4,
                pointerEvents: 'none',
              }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ControlPanel;
