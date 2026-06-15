import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FermentationVat as FermentationVatType,
  stirVat,
  materialNames,
  formatTime,
} from '../utils/brewingLogic'

interface Props {
  vat: FermentationVatType
  onStir: (vat: FermentationVatType) => void
}

export default function FermentationVat({ vat, onStir }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [isStirring, setIsStirring] = useState(false)

  const handleClick = () => {
    setShowModal(true)
  }

  const handleStir = () => {
    if (isStirring) return
    setIsStirring(true)
    const updatedVat = stirVat(vat)
    onStir(updatedVat)
    setTimeout(() => setIsStirring(false), 300)
  }

  const progressColor = `hsl(${30 + (100 - vat.progress) * 0.6}, ${60 - vat.progress * 0.4}%, ${85 - vat.progress * 0.5}%)`
  const hoursSinceStir = (Date.now() - vat.lastStirTime) / (1000 * 60 * 60)
  const needsAttention = hoursSinceStir > 12

  return (
    <>
      <motion.div
        className="relative cursor-pointer"
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        animate={needsAttention ? {
          boxShadow: [
            '0 4px 6px rgba(0,0,0,0.1)',
            '0 0 20px rgba(255,100,50,0.4)',
            '0 4px 6px rgba(0,0,0,0.1)',
          ],
        } : {}}
        transition={{
          scale: { type: 'spring', stiffness: 400, damping: 17, duration: 0.3 },
          boxShadow: { duration: 1.5, repeat: needsAttention ? Infinity : 0 },
        }}
      >
        <svg width="120" height="140" viewBox="0 0 120 140">
          <ellipse cx="60" cy="130" rx="45" ry="8" fill="#5d4037" opacity="0.3" />
          <path
            d="M15 50 Q10 90 20 125 L100 125 Q110 90 105 50 Q60 35 15 50"
            fill="#8b4513"
            stroke="#5d4037"
            strokeWidth="2"
          />
          <path
            d="M20 55 Q18 85 25 115 L95 115 Q102 85 100 55 Q60 45 20 55"
            fill={progressColor}
            opacity="0.8"
          />
          <ellipse
            cx="60"
            cy="50"
            rx="45"
            ry="12"
            fill="#a0522d"
            stroke="#5d4037"
            strokeWidth="2"
          />
          <path
            d="M20 50 Q60 20 100 50"
            fill="#d4a574"
            stroke="#8b4513"
            strokeWidth="1.5"
          />
          <path
            d="M30 45 Q60 28 90 45"
            fill="none"
            stroke="#c2a571"
            strokeWidth="1.5"
          />
          <path
            d="M40 42 Q60 32 80 42"
            fill="none"
            stroke="#b8956e"
            strokeWidth="1"
          />
          <text
            x="60"
            y="90"
            textAnchor="middle"
            fill="#5d4037"
            fontSize="14"
            fontFamily='"Liu Jian Mao Cao", cursive'
            fontWeight="bold"
          >
            {materialNames[vat.material]}
          </text>
          <text
            x="60"
            y="110"
            textAnchor="middle"
            fill="#8b4513"
            fontSize="12"
            fontWeight="bold"
          >
            {Math.round(vat.progress)}%
          </text>
        </svg>

        {needsAttention && (
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            !
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-[#faf0e0] rounded-lg p-6 max-w-md w-full mx-4 border-4 border-[#8b4513]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                className="text-2xl font-bold text-[#5d4037] mb-4 text-center"
                style={{ fontFamily: '"Liu Jian Mao Cao", cursive' }}
              >
                {materialNames[vat.material]}醋发酵中
              </h2>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-[#5d4037] mb-2">
                  <span>发酵进度</span>
                  <span>{Math.round(vat.progress)}%</span>
                </div>
                <div className="h-6 rounded-full overflow-hidden border-2 border-[#8b4513]">
                  <motion.div
                    className="h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${vat.progress}%` }}
                    transition={{ duration: 0.5 }}
                    style={{
                      background: `linear-gradient(to right, #ffffff, #f5deb3, #d2691e, #8b4513, #3d2314)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[#8b4513] mt-1">
                  <span>未发酵</span>
                  <span>完全发酵</span>
                </div>
              </div>

              <div className="bg-[#c2a571] bg-opacity-30 rounded p-3 mb-4">
                <p className="text-sm text-[#5d4037]">
                  <span className="font-bold">开始时间：</span>
                  {formatTime(vat.startTime)}
                </p>
                <p className="text-sm text-[#5d4037]">
                  <span className="font-bold">上次翻拌：</span>
                  {formatTime(vat.lastStirTime)}
                </p>
                <p className="text-sm text-[#5d4037]">
                  <span className="font-bold">翻拌次数：</span>
                  {vat.stirHistory.length} 次
                </p>
              </div>

              {needsAttention && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                  ⚠️ 已超过12小时未翻拌，进度开始衰减！
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  className="flex-1 bg-[#8b4513] text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2"
                  onClick={handleStir}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isStirring ? { rotate: [-10, 10, -10, 10, 0] } : {}}
                  transition={{
                    scale: { type: 'spring', stiffness: 400, damping: 17, duration: 0.3 },
                    rotate: { duration: 0.3 },
                  }}
                  disabled={vat.progress >= 100}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2L4 12l8 8" stroke="#d4a574" />
                    <path d="M4 12h16" stroke="#d4a574" />
                    <circle cx="18" cy="12" r="3" fill="#5d4037" stroke="#d4a574" />
                  </svg>
                  翻拌
                </motion.button>

                <motion.button
                  className="flex-1 bg-[#5d4037] text-white py-3 px-4 rounded-lg font-bold"
                  onClick={() => setShowModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17, duration: 0.3 }}
                >
                  关闭
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
