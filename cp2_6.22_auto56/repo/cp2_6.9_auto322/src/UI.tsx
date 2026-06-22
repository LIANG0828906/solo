import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ColorResult, Mordant, getMordantName, MORDANT_COLORS, DYE_COLORS } from './colorEngine'

interface UIProps {
  onSave: () => void
  onOxidize: () => void
  onSelectMordant: (m: Mordant) => void
  onReset: () => void
  currentColor: ColorResult
  temperature: number
  oxidationTime: number
  isOxidizing: boolean
  isMordanting: boolean
  oxidationProgress: number
  canOxidize: boolean
  canMordant: boolean
  mordant: Mordant
}

const UI: React.FC<UIProps> = ({
  onSave,
  onOxidize,
  onSelectMordant,
  onReset,
  currentColor,
  temperature,
  oxidationTime,
  isOxidizing,
  isMordanting,
  oxidationProgress,
  canOxidize,
  canMordant,
  mordant,
}) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [hoveredMordant, setHoveredMordant] = useState<number | null>(null)

  const mordantOptions: { type: Mordant; name: string }[] = [
    { type: 'alum', name: '明矾' },
    { type: 'greenVitriol', name: '绿矾' },
    { type: 'blueVitriol', name: '蓝矾' },
  ]

  return (
    <>
      <motion.div
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'rgba(245, 239, 224, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(155, 183, 196, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          padding: '0 40px',
          zIndex: 50,
          fontFamily: "'Noto Serif SC', serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#5a4a3a', fontSize: 14, fontWeight: 500 }}>染液温度</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={temperature}
            onChange={(e) => {
              const input = document.querySelector('input[type="range"]') as HTMLInputElement
              if (input) {
                const val = parseInt(e.target.value)
                const percent = (val - 0) / (100 - 0)
                input.style.background = `linear-gradient(to right, #c43a31 0%, #e6b422 ${percent * 100}%, #d4ccc0 ${percent * 100}%, #d4ccc0 100%)`
              }
            }}
            style={{
              width: 180,
              height: 6,
              borderRadius: 3,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #c43a31 0%, #e6b422 ${((temperature - 0) / (100 - 0)) * 100}%, #d4ccc0 ${((temperature - 0) / (100 - 0)) * 100}%, #d4ccc0 100%)`,
              cursor: 'pointer',
              outline: 'none',
            }}
          />
          <span style={{ color: '#c43a31', fontSize: 16, fontWeight: 600, minWidth: 45 }}>{temperature}°C</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#5a4a3a', fontSize: 14, fontWeight: 500 }}>氧化时间</span>
          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={oxidationTime}
            onChange={(e) => {
              const inputs = document.querySelectorAll('input[type="range"]')
              const input = inputs[1] as HTMLInputElement
              if (input) {
                const val = parseInt(e.target.value)
                const percent = (val - 5) / (40 - 5)
                input.style.background = `linear-gradient(to right, #2d6a9f 0%, #2d6a9f ${percent * 100}%, #d4ccc0 ${percent * 100}%, #d4ccc0 100%)`
              }
            }}
            style={{
              width: 180,
              height: 6,
              borderRadius: 3,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #2d6a9f 0%, #2d6a9f ${((oxidationTime - 5) / (40 - 5)) * 100}%, #d4ccc0 ${((oxidationTime - 5) / (40 - 5)) * 100}%, #d4ccc0 100%)`,
              cursor: 'pointer',
              outline: 'none',
            }}
          />
          <span style={{ color: '#2d6a9f', fontSize: 16, fontWeight: 600, minWidth: 45 }}>{oxidationTime}秒</span>
        </div>

        <motion.button
          whileHover={{ scale: canOxidize ? 1.05 : 1 }}
          whileTap={{ scale: canOxidize ? 0.95 : 1 }}
          onClick={onOxidize}
          onMouseEnter={() => setHoveredButton('oxidize')}
          onMouseLeave={() => setHoveredButton(null)}
          disabled={!canOxidize}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: canOxidize
              ? `linear-gradient(135deg, ${DYE_COLORS.blue}, ${DYE_COLORS.red})`
              : '#b8b0a0',
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            cursor: canOxidize ? 'pointer' : 'not-allowed',
            boxShadow: hoveredButton === 'oxidize' && canOxidize
              ? `0 0 20px ${DYE_COLORS.blue}80`
              : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          氧 化
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSave}
          onMouseEnter={() => setHoveredButton('save')}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: `linear-gradient(135deg, ${DYE_COLORS.yellow}, ${DYE_COLORS.red})`,
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: hoveredButton === 'save'
              ? `0 0 20px ${DYE_COLORS.yellow}80`
              : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          保存染布
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          onMouseEnter={() => setHoveredButton('reset')}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '2px solid #8a7a6a',
            background: 'transparent',
            color: '#5a4a3a',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          重新开始
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOxidizing && oxidationProgress < 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 60,
              pointerEvents: 'none',
            }}
          >
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={currentColor.hex}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${oxidationProgress * 314} 314`}
                transform="rotate(-90 60 60)"
                style={{
                  filter: `drop-shadow(0 0 10px ${currentColor.hex})`,
                }}
              />
              <text
                x="60"
                y="55"
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="600"
                fontFamily="'Noto Serif SC', serif"
              >
                氧化中
              </text>
              <text
                x="60"
                y="75"
                textAnchor="middle"
                fill="white"
                fontSize="18"
                fontWeight="700"
                fontFamily="'Noto Serif SC', serif"
              >
                {Math.round(oxidationProgress * 100)}%
              </text>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          position: 'absolute',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          zIndex: 40,
        }}
      >
        <div
          style={{
            color: '#5a4a3a',
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: 5,
          }}
        >
          媒染剂
        </div>
        {mordantOptions.map((option, index) => (
          <motion.div
            key={option.type}
            whileHover={{ scale: canMordant && (!mordant || mordant === option.type) ? 1.1 : 1 }}
            whileTap={{ scale: canMordant && (!mordant || mordant === option.type) ? 0.9 : 1 }}
            onClick={() => canMordant && (!mordant || mordant === option.type) && onSelectMordant(option.type)}
            onMouseEnter={() => setHoveredMordant(index)}
            onMouseLeave={() => setHoveredMordant(null)}
            style={{
              width: 60,
              height: 80,
              cursor: canMordant && (!mordant || mordant === option.type) ? 'pointer' : 'not-allowed',
              opacity: mordant && mordant !== option.type ? 0.4 : 1,
              position: 'relative',
            }}
          >
            <svg width="60" height="80" viewBox="0 0 60 80">
              <defs>
                <linearGradient id={`bottleGrad${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(200,220,240,0.4)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                  <stop offset="100%" stopColor="rgba(180,200,220,0.4)" />
                </linearGradient>
              </defs>
              <path
                d="M20 70 L20 25 Q20 15 30 15 Q40 15 40 25 L40 70 Q40 75 30 75 Q20 75 20 70"
                fill={`url(#bottleGrad${index})`}
                stroke="rgba(150,170,190,0.8)"
                strokeWidth="1.5"
              />
              <rect x="24" y="8" width="12" height="10" rx="2" fill="rgba(139,90,43,0.8)" />
              <rect
                x="22"
                y="35"
                width="16"
                height="32"
                rx="2"
                fill={MORDANT_COLORS[option.type!]}
                style={{
                  filter: hoveredMordant === index ? 'brightness(1.2)' : 'none',
                }}
              />
              {isMordanting && mordant === option.type && (
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <circle
                      key={i}
                      cx={28 + (i % 2) * 8}
                      cy={65 - i * 6}
                      r="2"
                      fill="rgba(255,255,255,0.8)"
                      style={{
                        animation: `bubble 1s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </>
              )}
            </svg>
            <div
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: hoveredMordant === index ? '#2d6a9f' : '#5a4a3a',
                marginTop: 2,
                fontWeight: 500,
                textShadow: hoveredMordant === index ? '0 0 8px #ffd54f' : 'none',
              }}
            >
              {option.name}
            </div>
            {hoveredMordant === index && canMordant && (!mordant || mordant === option.type) && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  position: 'absolute',
                  left: 70,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(90,74,58,0.95)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                点击使用{option.name}媒染
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          background: 'rgba(245, 239, 224, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(155, 183, 196, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 60,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 8,
              background: currentColor.hex,
              boxShadow: `0 4px 20px ${currentColor.hex}60`,
              border: '2px solid rgba(255,255,255,0.5)',
            }}
          />
          <div>
            <div style={{ color: '#5a4a3a', fontSize: 12, marginBottom: 4 }}>当前染布</div>
            <div style={{ color: '#3a2a1a', fontSize: 20, fontWeight: 700 }}>
              {currentColor.name}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 160,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #c43a31, #2d6a9f, #e6b422)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#5a4a3a', fontSize: 14 }}>HEX 色值</span>
          <div
            style={{
              padding: '8px 20px',
              background: 'rgba(155, 183, 196, 0.2)',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 18,
              fontWeight: 600,
              color: currentColor.hex,
              letterSpacing: 2,
            }}
          >
            {currentColor.hex.toUpperCase()}
          </div>
        </div>

        {isMordanting && mordant && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#e6b422', fontSize: 14, fontWeight: 600 }}>
              正在使用{getMordantName(mordant)}媒染...
            </span>
          </div>
        )}
      </motion.div>

      <style>{`
        @keyframes bubble {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(-8px); opacity: 0.4; }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid #8a7a6a;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 12px #ffd54f;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid #8a7a6a;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </>
  )
}

export default UI
