import { motion } from 'framer-motion'
import {
  FinishedJar,
  materialNames,
  downloadSticker,
} from '../utils/brewingLogic'
import { useState } from 'react'

interface Props {
  jar: FinishedJar
}

export default function FinishedJarCard({ jar }: Props) {
  const [isDownloading, setIsDownloading] = useState(false)

  const acidityPercent = ((jar.initialAcidity - 3) / 3) * 100
  const clampedAcidity = Math.max(0, Math.min(100, acidityPercent))

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      await downloadSticker(jar)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <motion.div
      className="bg-[#faf0e0] rounded-lg p-4 border-2 border-[#8b4513] shadow-lg relative overflow-hidden"
      whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.3 }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(to right, rgba(139, 69, 19, 0.1), rgba(139, 69, 19, 0.3), rgba(139, 69, 19, 0.1))`,
        }}
      />

      <div className="flex justify-between items-start mb-3">
        <h3
          className="text-xl font-bold text-[#8b4513]"
          style={{ fontFamily: '"Liu Jian Mao Cao", cursive' }}
        >
          {jar.jarNumber}
        </h3>
        <span
          className="text-sm text-[#5d4037] bg-[#c2a571] bg-opacity-40 px-2 py-1 rounded"
        >
          {materialNames[jar.material]}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-[#5d4037] mb-1">
          <span>酸度</span>
          <span>{jar.initialAcidity.toFixed(1)}°</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden border border-[#8b4513]">
          <motion.div
            className="h-full"
            initial={{ width: 0 }}
            animate={{ width: `${clampedAcidity}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: `linear-gradient(to right, #ffcccc, #ff6666, #cc0000, #660000)`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#8b4513] mt-0.5">
          <span>淡</span>
          <span>浓</span>
        </div>
      </div>

      <div className="space-y-1 text-sm text-[#5d4037]">
        <p className="flex justify-between">
          <span>陈酿天数：</span>
          <span className="font-bold">{jar.agingDays} 天</span>
        </p>
        <p className="flex justify-between">
          <span>开坛日期：</span>
          <span className="font-bold">{jar.openDate}</span>
        </p>
      </div>

      <motion.button
        className="w-full mt-3 bg-[#5d4037] text-white py-2 px-4 rounded text-sm font-bold"
        onClick={handleDownload}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17, duration: 0.3 }}
        disabled={isDownloading}
      >
        {isDownloading ? '生成中...' : '导出醋帖'}
      </motion.button>
    </motion.div>
  )
}
