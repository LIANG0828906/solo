import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tea, Snack, BrewingStep } from '../types';

interface TeaBrewingProps {
  selectedTea: Tea | null;
  selectedSnacks: Snack[];
  onBrewingComplete: () => void;
}

const ease = [0.25, 0.46, 0.45, 0.94];

export default function TeaBrewing({ selectedTea, selectedSnacks, onBrewingComplete }: TeaBrewingProps) {
  const [step, setStep] = useState<BrewingStep>('idle');
  const [waterTemp, setWaterTemp] = useState(20);
  const [showFoam, setShowFoam] = useState(false);
  const [teaColor, setTeaColor] = useState('#fff8dc');
  const [whiskProgress, setWhiskProgress] = useState(0);

  const startHeating = useCallback(() => {
    if (step !== 'idle' || !selectedTea) return;
    setStep('heating');
  }, [step, selectedTea]);

  useEffect(() => {
    if (step !== 'heating') return;
    const interval = setInterval(() => {
      setWaterTemp(prev => {
        const next = prev + 2;
        if (next >= 80) {
          setStep('ready');
          return 80;
        }
        return next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [step]);

  const startWhisking = useCallback(() => {
    if (step !== 'ready') return;
    setStep('whisking');
    setWhiskProgress(0);
  }, [step]);

  useEffect(() => {
    if (step !== 'whisking') return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 100 / 30;
      setWhiskProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        setShowFoam(true);
        setStep('whisked');
      }
    }, 100);
    return () => clearInterval(interval);
  }, [step]);

  const startPouring = useCallback(() => {
    if (step !== 'whisked') return;
    setStep('pouring');
  }, [step]);

  useEffect(() => {
    if (step !== 'pouring') return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 100 / 15;
      const ratio = Math.min(progress, 100) / 100;
      const startR = 255, startG = 248, startB = 220;
      const endR = 245, endG = 245, endB = 245;
      const r = Math.round(startR + (endR - startR) * ratio);
      const g = Math.round(startG + (endG - startG) * ratio);
      const b = Math.round(startB + (endB - startB) * ratio);
      setTeaColor(`rgb(${r}, ${g}, ${b})`);
      if (progress >= 100) {
        clearInterval(interval);
        setStep('done');
        setTimeout(() => onBrewingComplete(), 300);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [step, onBrewingComplete]);

  const getWhiskSpeed = () => {
    const p = whiskProgress;
    if (p < 20) return 1.5 - (p / 20) * 0.5;
    if (p < 80) return 1 - ((p - 20) / 60) * 0.3;
    return 0.7 + ((p - 80) / 20) * 0.8;
  };

  const resetAll = () => {
    setStep('idle');
    setWaterTemp(20);
    setShowFoam(false);
    setTeaColor('#fff8dc');
    setWhiskProgress(0);
  };

  return (
    <div className="tea-brewing-area">
      <div className="tea-table">
        <div className="table-surface" />
        <div className="table-edge" />
        
        <AnimatePresence>
          {selectedTea && (
            <motion.div
              className="selected-tea-jar"
              initial={{ x: -300, y: -300, opacity: 0, rotate: -180 }}
              animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease }}
            >
              <div
                className="jar-mini"
                style={{
                  background: `radial-gradient(ellipse at 30% 20%, ${selectedTea.color}ee 0%, ${selectedTea.color}dd 40%, ${selectedTea.color}aa 70%, ${selectedTea.color}88 100%)`,
                }}
              >
                <div className="jar-lid-mini" style={{ background: `linear-gradient(180deg, ${selectedTea.color}ff, ${selectedTea.color}cc)` }} />
                <div className="jar-gloss-mini" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="selected-snacks">
          <AnimatePresence>
            {selectedSnacks.map((snack, index) => (
              <motion.div
                key={snack.id}
                className="snack-on-table"
                initial={{ x: 300, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease }}
              >
                <div className="mini-plate">
                  <div className="cracked-glaze-mini" />
                  <div className="snack-icon">
                    {snack.id === 'guihua' && <span>糕</span>}
                    {snack.id === 'xingren' && <span>酥</span>}
                    {snack.id === 'meizi' && <span>梅</span>}
                    {snack.id === 'longxu' && <span>糖</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="tea-pot-area">
          <div className={`fire-container ${step === 'heating' ? 'active' : ''}`}>
            <div className="fire-base" />
            {step === 'heating' && (
              <motion.div
                className="flame"
                animate={{
                  scaleY: [1, 1.3, 1],
                  scaleX: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <div className="flame-inner" />
                <div className="flame-outer" />
              </motion.div>
            )}
            <button
              className={`fire-btn ${step === 'heating' ? 'heating' : ''} ${step !== 'idle' && step !== 'heating' ? 'disabled' : ''}`}
              onClick={startHeating}
              disabled={step !== 'idle' || !selectedTea}
            >
              {step === 'idle' ? '点燃炭火' : step === 'heating' ? `${waterTemp}℃` : step === 'ready' ? '水已开' : ''}
            </button>
          </div>

          <div className="tea-pot">
            <div className="pot-body" />
            <div className="pot-lid" />
            <div className="pot-spout" />
            <div className="pot-handle" />
          </div>
        </div>

        <div className="tea-bowl-area">
          <div className="tea-bowl-outer">
            <div className="tea-bowl-inner">
              <motion.div
                className="tea-liquid"
                style={{ backgroundColor: teaColor }}
                animate={{
                  backgroundColor: teaColor
                }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
              {showFoam && (
                <motion.div
                  className="tea-foam"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease }}
                >
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="bubble"
                      style={{
                        left: `${20 + (i % 4) * 20}%`,
                        top: `${20 + Math.floor(i / 4) * 25}%`
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.6, 0.9, 0.6]
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.15,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  ))}
                </motion.div>
              )}
              {step === 'pouring' && (
                <motion.div
                  className="pouring-stream"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.3, ease }}
                />
              )}
            </div>
          </div>

          {step === 'whisking' && (
            <motion.div
              className="whisk"
              animate={{
                rotate: [0, 20, -20, 0],
                x: [0, 15, -15, 0],
                y: [0, 5, -5, 0]
              }}
              transition={{
                duration: getWhiskSpeed(),
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="whisk-handle" />
              <div className="whisk-brush">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="whisk-bristle" style={{ transform: `rotate(${i * 45}deg)` }} />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.button
              className="whisk-btn"
              onClick={startWhisking}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease }}
            >
              击拂
            </motion.button>
          )}

          {step === 'whisked' && (
            <motion.button
              className="pour-btn"
              onClick={startPouring}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease }}
            >
              分茶
            </motion.button>
          )}

          {step === 'done' && (
            <motion.button
              className="reset-btn"
              onClick={resetAll}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              重新点茶
            </motion.button>
          )}
        </div>
      </div>

      <div className="hint-text">
        {!selectedTea && '请先从左侧茶叶架选取茶叶'}
        {selectedTea && step === 'idle' && '点击炭火按钮，候汤三沸'}
        {step === 'heating' && '水已渐热，静待汤沸'}
        {step === 'ready' && '汤已初沸，拿起茶筅击拂'}
        {step === 'whisking' && '击拂茶汤，令沫饽泛起'}
        {step === 'whisked' && '沫饽已成，可以分茶入盏'}
        {step === 'pouring' && '分茶入盏，汤色渐变'}
        {step === 'done' && '茶已备好，请品评记录'}
      </div>

      <style>{`
        .tea-brewing-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .tea-table {
          flex: 1;
          position: relative;
          background: linear-gradient(145deg, #8b5a2b 0%, #6d4c41 30%, #5d4037 70%, #4e342e 100%);
          border-radius: 16px;
          box-shadow: 
            0 15px 40px rgba(0,0,0,0.5),
            inset 0 2px 10px rgba(255,255,255,0.1),
            inset 0 -2px 10px rgba(0,0,0,0.3);
          overflow: hidden;
          min-height: 350px;
        }

        .table-surface {
          position: absolute;
          inset: 0;
          background: 
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 60px,
              rgba(0,0,0,0.05) 60px,
              rgba(0,0,0,0.05) 62px
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 100px,
              rgba(0,0,0,0.03) 100px,
              rgba(0,0,0,0.03) 102px
            );
        }

        .table-edge {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 25px;
          background: linear-gradient(180deg, #5d4037 0%, #3e2723 100%);
          box-shadow: 0 -2px 8px rgba(0,0,0,0.3);
        }

        .selected-tea-jar {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
        }

        .jar-mini {
          width: 55px;
          height: 70px;
          border-radius: 10px 10px 6px 6px;
          position: relative;
          box-shadow: inset -6px -6px 15px rgba(0,0,0,0.3), inset 6px 6px 15px rgba(255,255,255,0.1), 0 6px 15px rgba(0,0,0,0.4);
        }

        .jar-lid-mini {
          width: 85%;
          height: 10px;
          border-radius: 5px 5px 2px 2px;
          margin: -5px auto 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .jar-gloss-mini {
          position: absolute;
          top: 10px;
          left: 8px;
          width: 6px;
          height: 40px;
          background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
          border-radius: 3px;
          transform: rotate(-5deg);
        }

        .selected-snacks {
          position: absolute;
          top: 30px;
          right: 30px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 5;
        }

        .snack-on-table {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mini-plate {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(145deg, #e8e4d9 0%, #d4cfc0 50%, #c5c0b0 100%);
          position: relative;
          box-shadow: inset -2px -2px 6px rgba(0,0,0,0.2), inset 2px 2px 6px rgba(255,255,255,0.5), 0 2px 6px rgba(0,0,0,0.3);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cracked-glaze-mini {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(45deg, transparent 48%, rgba(139, 119, 101, 0.3) 49%, rgba(139, 119, 101, 0.3) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(139, 119, 101, 0.3) 49%, rgba(139, 119, 101, 0.3) 51%, transparent 52%);
          background-size: 10px 10px;
          opacity: 0.6;
        }

        .snack-icon {
          color: #8b4513;
          font-size: 18px;
          z-index: 1;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.2);
        }

        .tea-pot-area {
          position: absolute;
          bottom: 40px;
          left: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 10;
        }

        .fire-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .fire-base {
          width: 60px;
          height: 15px;
          background: linear-gradient(180deg, #4e342e 0%, #3e2723 100%);
          border-radius: 50%;
          box-shadow: 0 3px 8px rgba(0,0,0,0.5);
        }

        .flame {
          position: absolute;
          bottom: 8px;
          width: 40px;
          height: 50px;
          transform-origin: bottom center;
        }

        .flame-outer {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 35px;
          height: 45px;
          background: radial-gradient(ellipse at bottom, #ff9800 0%, #f57c00 40%, #e65100 70%, transparent 100%);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          filter: blur(3px);
        }

        .flame-inner {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 30px;
          background: radial-gradient(ellipse at bottom, #fff9c4 0%, #ffeb3b 40%, #ff9800 70%, transparent 100%);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          z-index: 1;
        }

        .fire-btn {
          margin-top: 5px;
          padding: 8px 20px;
          background: linear-gradient(180deg, #5d4037 0%, #4e342e 100%);
          color: #faf0e6;
          border: 2px solid #8b6914;
          border-radius: 20px;
          font-family: 'Ma Shan Zheng', cursive;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          min-width: 100px;
        }

        .fire-btn:hover:not(:disabled) {
          background: linear-gradient(180deg, #6d4c41 0%, #5d4037 100%);
          transform: scale(1.05);
        }

        .fire-btn.heating {
          background: linear-gradient(180deg, #e65100 0%, #bf360c 100%);
          border-color: #ff9800;
          animation: pulse 0.5s infinite alternate;
        }

        .fire-btn.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes pulse {
          from { box-shadow: 0 0 5px #ff9800; }
          to { box-shadow: 0 0 15px #ff9800; }
        }

        .tea-pot {
          position: relative;
          width: 70px;
          height: 55px;
        }

        .pot-body {
          position: absolute;
          bottom: 0;
          left: 5px;
          width: 60px;
          height: 45px;
          background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 50%, #1a1a1a 100%);
          border-radius: 5px 5px 25px 25px;
          box-shadow: inset -5px -5px 15px rgba(0,0,0,0.5), inset 5px 5px 15px rgba(255,255,255,0.1), 0 4px 10px rgba(0,0,0,0.4);
        }

        .pot-lid {
          position: absolute;
          top: 0;
          left: 12px;
          width: 46px;
          height: 15px;
          background: linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%);
          border-radius: 5px 5px 2px 2px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }

        .pot-lid::after {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 10px;
          background: linear-gradient(180deg, #6a6a6a 0%, #4a4a4a 100%);
          border-radius: 50%;
        }

        .pot-spout {
          position: absolute;
          bottom: 20px;
          right: -8px;
          width: 20px;
          height: 15px;
          background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%);
          border-radius: 0 10px 10px 0;
          transform: rotate(-10deg);
        }

        .pot-handle {
          position: absolute;
          bottom: 15px;
          left: -12px;
          width: 20px;
          height: 25px;
          border: 4px solid #4a4a4a;
          border-radius: 50% 0 0 50%;
          border-right: none;
        }

        .tea-bowl-area {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          z-index: 10;
        }

        .tea-bowl-outer {
          width: 110px;
          height: 75px;
          background: linear-gradient(180deg, #8db58c 0%, #6b9e6b 50%, #4a7d4a 100%);
          border-radius: 0 0 55px 55px;
          box-shadow: inset -8px -8px 20px rgba(0,0,0,0.3), inset 8px 8px 20px rgba(255,255,255,0.1), 0 6px 15px rgba(0,0,0,0.4);
          padding: 8px;
          position: relative;
        }

        .tea-bowl-outer::before {
          content: '';
          position: absolute;
          top: -6px;
          left: -5px;
          right: -5px;
          height: 12px;
          background: linear-gradient(180deg, #9dc59c 0%, #7bae7b 100%);
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }

        .tea-bowl-inner {
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #d4ccc0 0%, #c0b8a8 100%);
          border-radius: 0 0 50px 50px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 3px 8px rgba(0,0,0,0.2);
        }

        .tea-liquid {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70%;
          border-radius: 0 0 50px 50px;
          transition: background-color 0.1s linear;
        }

        .tea-foam {
          position: absolute;
          bottom: 40%;
          left: 50%;
          transform: translateX(-50%);
          width: 85%;
          height: 50%;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.85) 50%, rgba(235,235,235,0.75) 100%);
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .bubble {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(255,255,255,0.8);
          border-radius: 50%;
          box-shadow: inset -1px -1px 2px rgba(0,0,0,0.1);
        }

        .pouring-stream {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%) scaleY(0);
          width: 8px;
          height: 80px;
          background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, #e8e4d9 50%, #d4ccc0 100%);
          border-radius: 4px;
          transform-origin: top center;
        }

        .whisk {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          transform-origin: top center;
          z-index: 20;
        }

        .whisk-handle {
          width: 8px;
          height: 50px;
          background: linear-gradient(180deg, #8b6914 0%, #6d4c41 100%);
          border-radius: 4px;
          margin: 0 auto;
          box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .whisk-brush {
          position: relative;
          width: 40px;
          height: 35px;
          margin-top: -5px;
        }

        .whisk-bristle {
          position: absolute;
          top: 0;
          left: 50%;
          width: 3px;
          height: 35px;
          background: linear-gradient(180deg, #6d4c41 0%, #8b6914 100%);
          border-radius: 0 0 2px 2px;
          transform-origin: top center;
          box-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .whisk-btn,
        .pour-btn,
        .reset-btn {
          padding: 10px 28px;
          background: linear-gradient(180deg, #689f38 0%, #558b2f 100%);
          color: #faf0e6;
          border: 2px solid #8bc34a;
          border-radius: 25px;
          font-family: 'Ma Shan Zheng', cursive;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .whisk-btn:hover,
        .pour-btn:hover,
        .reset-btn:hover {
          background: linear-gradient(180deg, #7cb342 0%, #689f38 100%);
          box-shadow: 0 6px 15px rgba(0,0,0,0.4);
        }

        .reset-btn {
          background: linear-gradient(180deg, #8b6914 0%, #6d4c41 100%);
          border-color: #a0826d;
        }

        .reset-btn:hover {
          background: linear-gradient(180deg, #9e7a1c 0%, #7d5a49 100%);
        }

        .hint-text {
          text-align: center;
          color: #faf0e6;
          font-size: 18px;
          padding: 15px;
          letter-spacing: 3px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          min-height: 55px;
        }

        @media (max-width: 768px) {
          .tea-table {
            min-height: 300px;
          }
          .selected-snacks {
            top: 15px;
            right: 15px;
          }
          .tea-pot-area {
            left: 20px;
            bottom: 30px;
          }
          .tea-bowl-outer {
            width: 90px;
            height: 60px;
          }
          .hint-text {
            font-size: 16px;
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}
