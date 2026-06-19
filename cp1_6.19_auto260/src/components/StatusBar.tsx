import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEcosystemStore } from '@/store/ecosystemStore'

const StatusBar = React.memo(function StatusBar() {
  const alertActive = useEcosystemStore((s) => s.alertActive)
  const achievementUnlocked = useEcosystemStore((s) => s.achievementUnlocked)
  const [showAchievement, setShowAchievement] = useState(false)

  useEffect(() => {
    if (!achievementUnlocked) return
    setShowAchievement(true)
    const timer = setTimeout(() => setShowAchievement(false), 2000)
    return () => clearTimeout(timer)
  }, [achievementUnlocked])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <AnimatePresence>
        {alertActive && (
          <motion.div
            className="bg-red-900/80 backdrop-blur-md text-red-200 px-6 py-3 rounded-b-lg text-center font-semibold pointer-events-auto"
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            ⚠ 生态警报：环境参数异常！植物生长受到威胁
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievement && !alertActive && (
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-b-lg text-center font-semibold shadow-lg pointer-events-auto"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            🏆 成就解锁：稳定生态 — 连续稳定7天
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default StatusBar
